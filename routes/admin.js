// routes/admin.js
import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/replace-users', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: 'no token' });

    // Validate token (if using supabase JWT, verify signature with JWT_SECRET or use supabase to get user)
    const payload = jwt.verify(auth, process.env.JWT_SECRET); // example
    if (!payload || payload.role !== 'supervisor') return res.status(403).json({ error: 'forbidden' });

    const { users } = req.body; // array of { email, password_hash, role }
    // transaction: delete all then insert new
    // For simplicity: delete all
    await supabaseAdmin.from('usuarios').delete();
    // insert new:
    if (Array.isArray(users) && users.length) {
      await supabaseAdmin.from('usuarios').insert(users);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
