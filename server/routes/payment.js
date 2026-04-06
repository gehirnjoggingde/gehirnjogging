const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/auth');
const { sendWelcomeTemplate, sendQuiz } = require('../services/twilioService');
const { getQuestionsForUser } = require('../services/quizService');

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
      payment_method_types: ['card'],
      allow_promotion_codes: true,
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
      // Support both old (metadata.userId) and new (email) matching
      const userId = obj.metadata?.userId;
      const email = obj.customer_details?.email || obj.customer_email;

      let userQuery = supabase.from('users').update({
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.subscription,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      });

      if (userId) {
        await userQuery.eq('id', userId);
      } else if (email) {
        await userQuery.eq('email', email);
      } else {
        console.error('[Checkout] No userId or email found in event');
        break;
      }

      // Send welcome WhatsApp message
      let userLookup = supabase.from('users').select('phone, name, quiz_time');
      if (userId) userLookup = userLookup.eq('id', userId);
      else userLookup = userLookup.eq('email', email);

      const { data: newUser, error: userFetchError } = await userLookup.single();

      console.log('[Checkout] user:', newUser?.phone, 'error:', userFetchError?.message);

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

        // We always send the first question right after the welcome message.
        // dayStr is only used in the welcome text – question always comes now.
        const nowBerlin = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
        const nowDate = new Date(nowBerlin);
        const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
        const quizMinutes = hour * 60 + minute;
        const isToday = quizMinutes > currentMinutes + 10;
        const dayStr = isToday ? 'heute' : 'morgen';

        try {
          console.log('[Checkout] Sending welcome WhatsApp to:', newUser.phone);
          await sendWelcomeTemplate(newUser.phone, newUser.name?.split(' ')[0] || 'du', dayStr, timeStr);
          console.log('[Checkout] Welcome WhatsApp sent successfully');
        } catch (waErr) {
          console.error('[Checkout] WhatsApp send failed:', waErr.message);
        }

        // Re-fetch user with full settings so we can get a question for them
        const { data: fullUser } = await supabase
          .from('users')
          .select('id, name, phone, daily_question_count, difficulty_level, preferred_categories')
          .eq('phone', newUser.phone)
          .single();

        if (fullUser) {
          try {
            // Small delay so welcome message arrives first
            await sleep(3000);

            const questions = await getQuestionsForUser(fullUser, fullUser.daily_question_count || 1);
            if (questions.length > 0) {
              // Pre-insert all questions as pending (same as cron does)
              for (const q of questions) {
                await supabase.from('user_answers').insert({
                  user_id: fullUser.id,
                  question_id: q.id,
                  user_answer: null,
                  is_correct: false,
                  answered_at: new Date().toISOString(),
                });
                await sleep(50);
              }

              // Q1 wird NICHT sofort gesendet — der User muss erst auf die
              // Welcome-Nachricht antworten (z.B. "Los geht's!"), dann schickt
              // der Webhook automatisch die erste Frage.
              console.log(`[Checkout] ${questions.length} question(s) queued for ${fullUser.phone}, waiting for user reply`);
            }
          } catch (qErr) {
            console.error('[Checkout] Failed to send first question:', qErr.message);
          }
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
