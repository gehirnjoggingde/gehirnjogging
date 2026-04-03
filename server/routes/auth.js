const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../services/supabaseClient');

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
        subscription_status: 'pending', // becomes 'active' after payment
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

module.exports = router;
