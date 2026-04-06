const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../services/supabaseClient');

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Gehirnjogging', email: 'gehirnjoggingkanal@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }
}

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
// Body: { email, name, phone, password }
router.post('/register', async (req, res) => {
  const { email, name, phone, password } = req.body;

  if (!email || !name || !phone || !password) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone.trim(),
        password_hash: passwordHash,
        subscription_status: 'pending',
        daily_question_count: 3,
        preferred_categories: ['allgemeinwissen','psychologie','geschichte','wissenschaft','philosophie','wirtschaft','natur','kultur'],
      })
      .select('id, email, name, phone')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        const field = error.message.includes('email') ? 'E-Mail' : 'Telefonnummer';
        return res.status(409).json({ error: `${field} bereits registriert` });
      }
      throw error;
    }

    const token = signToken(user.id);
    return res.status(201).json({ userId: user.id, token, user });
  } catch (err) {
    console.error('[Register]', err);
    return res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

// POST /api/auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, quiz_time, is_paused, subscription_status, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(user.id);
    return res.json({ userId: user.id, token, user: safeUser });
  } catch (err) {
    console.error('[Login]', err);
    return res.status(500).json({ error: 'Login fehlgeschlagen' });
  }
});

// POST /api/auth/forgot-password
// Body: { email }
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-Mail erforderlich' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Always respond with success to prevent email enumeration
    if (!user) return res.json({ message: 'Falls diese E-Mail existiert, wurde ein Link gesendet.' });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate old tokens for this user
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Save new token
    await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'https://gehirnjoggingclub.de'}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Passwort zurücksetzen – Gehirnjogging',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">
              Gehirn<span style="color: #2563eb;">jogging</span>
            </h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px;">
            Passwort zurücksetzen
          </h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hallo ${user.name},<br><br>
            du hast angefordert dein Passwort zurückzusetzen. Klicke auf den Button um ein neues Passwort festzulegen.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
            Passwort zurücksetzen →
          </a>
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
            Dieser Link ist <strong>1 Stunde</strong> gültig. Falls du kein Zurücksetzen angefordert hast, kannst du diese E-Mail ignorieren.
          </p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;">
          <p style="color: #d1d5db; font-size: 12px; text-align: center; margin: 0;">
            © Gehirnjogging · Hannes Herwig · Bad Hersfeld
          </p>
        </div>
      `,
    });

    return res.json({ message: 'Falls diese E-Mail existiert, wurde ein Link gesendet.' });
  } catch (err) {
    console.error('[ForgotPassword]', err.message || err);
    return res.status(500).json({ error: 'Fehler beim Senden der E-Mail' });
  }
});

// POST /api/auth/reset-password
// Body: { token, password }
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token und Passwort erforderlich' });
  if (password.length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });

  try {
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (!resetToken) return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link' });
    if (resetToken.used) return res.status(400).json({ error: 'Dieser Link wurde bereits verwendet' });
    if (new Date(resetToken.expires_at) < new Date()) return res.status(400).json({ error: 'Link abgelaufen – bitte neu anfordern' });

    const passwordHash = await bcrypt.hash(password, 12);

    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', resetToken.user_id);
    await supabase.from('password_reset_tokens').update({ used: true }).eq('token', token);

    return res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (err) {
    console.error('[ResetPassword]', err);
    return res.status(500).json({ error: 'Fehler beim Zurücksetzen' });
  }
});

// POST /api/auth/google
// Body: { credential } – Google ID token from GSI
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Kein Token erhalten' });

  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await googleRes.json();

    if (payload.error) return res.status(400).json({ error: 'Ungültiger Google-Token' });

    const expectedId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const tokenAud   = Array.isArray(payload.aud) ? payload.aud[0] : (payload.aud || '');
    if (!expectedId) {
      console.error('[GoogleAuth] GOOGLE_CLIENT_ID not set');
      return res.status(400).json({ error: 'Google nicht konfiguriert' });
    }
    if (tokenAud !== expectedId) {
      console.error('[GoogleAuth] aud mismatch – token:', tokenAud, '| env:', expectedId);
      return res.status(400).json({ error: 'Token ungültig' });
    }

    const email = payload.email?.toLowerCase();
    const name  = payload.name || '';

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, phone, quiz_time, is_paused, subscription_status')
      .eq('email', email)
      .single();

    if (user) {
      // Existing user → login directly
      const token = signToken(user.id);
      return res.json({ token, user });
    }

    // New user → frontend needs to collect phone number
    return res.json({ needsPhone: true, email, name });
  } catch (err) {
    console.error('[GoogleAuth]', err);
    return res.status(500).json({ error: 'Fehler bei der Google-Anmeldung' });
  }
});

// POST /api/auth/google/complete
// Body: { credential, phone } – complete signup for new Google users
router.post('/google/complete', async (req, res) => {
  const { credential, phone } = req.body;
  if (!credential || !phone) return res.status(400).json({ error: 'Fehlende Daten' });

  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await googleRes.json();

    const expectedId2 = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const tokenAud2   = Array.isArray(payload.aud) ? payload.aud[0] : (payload.aud || '');
    if (payload.error || tokenAud2 !== expectedId2) {
      return res.status(400).json({ error: 'Ungültiger Token' });
    }

    const email = payload.email?.toLowerCase();
    const name  = payload.name || email.split('@')[0];

    let formattedPhone = phone.trim().replace(/\s/g, '');
    if (formattedPhone.startsWith('00')) formattedPhone = '+' + formattedPhone.slice(2);
    if (formattedPhone.startsWith('0') && !formattedPhone.startsWith('+')) {
      formattedPhone = '+49' + formattedPhone.slice(1);
    }

    // Random password hash (Google users won't use password login)
    const randomPw = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        phone: formattedPhone,
        password_hash: randomPw,
        subscription_status: 'pending',
        daily_question_count: 3,
        preferred_categories: ['allgemeinwissen','psychologie','geschichte','wissenschaft','philosophie','wirtschaft','natur','kultur'],
      })
      .select('id, email, name, phone')
      .single();

    if (error) {
      if (error.code === '23505') {
        const field = error.message.includes('email') ? 'E-Mail' : 'Telefonnummer';
        return res.status(409).json({ error: `${field} bereits registriert` });
      }
      throw error;
    }

    const token = signToken(user.id);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('[GoogleComplete]', err);
    return res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

module.exports = router;
