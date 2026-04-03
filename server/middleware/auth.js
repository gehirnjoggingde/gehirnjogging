const jwt = require('jsonwebtoken');
const supabase = require('../services/supabaseClient');

/**
 * JWT middleware – attaches req.user = { id, email } on success.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in DB
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, subscription_status')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
