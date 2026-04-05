const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/auth');
const { sendWelcomeTemplate } = require('../services/twilioService');

const router = express.Router();

// POST /api/payment/create-checkout
// Requires auth – creates a Stripe Checkout session and returns the URL
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    const sessionParams = {
      automatic_payment_methods: { enabled: true },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Gehirnjogging',
            description: 'Täglich klüger per WhatsApp · Jederzeit kündbar',
          },
          unit_amount: 299, // 2,99€ in Cent
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment?cancelled=true`,
      customer_email: user.email,
      metadata: { userId: req.user.id },
      // 7-day free trial
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: req.user.id },
      },
    };

    // Re-use existing Stripe customer if available
    if (user.stripe_customer_id) {
      delete sessionParams.customer_email;
      sessionParams.customer = user.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Create Checkout]', err);
    return res.status(500).json({ error: 'Checkout konnte nicht erstellt werden' });
  }
});

// POST /api/payment/webhook
// Raw body required – registered BEFORE bodyParser in server.js
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log the event
  await supabase.from('stripe_events').upsert({
    event_id: event.id,
    event_type: event.type,
    customer_id: event.data.object.customer || null,
    data: event.data.object,
    processed: false,
  }, { onConflict: 'event_id' });

  try {
    await handleStripeEvent(event);
    await supabase
      .from('stripe_events')
      .update({ processed: true })
      .eq('event_id', event.id);
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    // Return 200 anyway so Stripe doesn't retry endlessly for logic errors
  }

  return res.json({ received: true });
});

async function handleStripeEvent(event) {
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = obj.metadata?.userId;
      if (!userId) break;

      await supabase.from('users').update({
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.subscription,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      // Send welcome WhatsApp message
      const { data: newUser, error: userFetchError } = await supabase
        .from('users')
        .select('phone, name, quiz_time')
        .eq('id', userId)
        .single();

      console.log('[Checkout] userId:', userId, 'user:', newUser, 'error:', userFetchError);

      if (newUser?.phone) {
        // quiz_time can be stored as "HH:MM" string or as integer minutes
        let hour = 9, minute = 0;
        if (typeof newUser.quiz_time === 'string' && newUser.quiz_time.includes(':')) {
          [hour, minute] = newUser.quiz_time.split(':').map(Number);
        } else if (typeof newUser.quiz_time === 'number') {
          hour = Math.floor(newUser.quiz_time / 60);
          minute = newUser.quiz_time % 60;
        }
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        // Check if quiz time is still today (Berlin time)
        const nowBerlin = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
        const nowDate = new Date(nowBerlin);
        const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
        const quizMinutes = hour * 60 + minute;
        const isToday = quizMinutes > currentMinutes + 10;

        const closing = isToday
          ? `Wir sehen uns heute um *${timeStr} Uhr*! 🧠`
          : `Deine erste Frage kommt morgen um *${timeStr} Uhr*. Bis dann! 🧠`;

        try {
          console.log('[Checkout] Sending welcome WhatsApp to:', newUser.phone);
          const dayStr = isToday ? 'heute' : 'morgen';
          await sendWelcomeTemplate(newUser.phone, newUser.name?.split(' ')[0] || 'du', dayStr, timeStr);
          console.log('[Checkout] Welcome WhatsApp sent successfully');
        } catch (waErr) {
          console.error('[Checkout] WhatsApp send failed:', waErr.message);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      // Find user by customer id
      const status = obj.status; // active, past_due, canceled, trialing...
      const mappedStatus = mapStripeStatus(status);

      await supabase.from('users').update({
        subscription_status: mappedStatus,
        is_paused: mappedStatus === 'paused',
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', obj.customer);
      break;
    }

    case 'customer.subscription.deleted': {
      await supabase.from('users').update({
        subscription_status: 'cancelled',
        is_paused: true,
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', obj.customer);
      break;
    }

    case 'invoice.payment_failed': {
      await supabase.from('users').update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', obj.customer);
      break;
    }
  }
}

function mapStripeStatus(stripeStatus) {
  const map = {
    active: 'active',
    trialing: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    paused: 'paused',
  };
  return map[stripeStatus] || stripeStatus;
}

// POST /api/payment/cancel
// Cancels the subscription at period end
router.post('/cancel', authMiddleware, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('id', req.user.id)
    .single();

  if (!user?.stripe_subscription_id) {
    return res.status(400).json({ error: 'Kein aktives Abonnement gefunden' });
  }

  try {
    await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    return res.json({ message: 'Abonnement wird zum Ende des Abrechnungszeitraums gekündigt' });
  } catch (err) {
    console.error('[Cancel]', err);
    return res.status(500).json({ error: 'Kündigung fehlgeschlagen' });
  }
});

module.exports = router;
