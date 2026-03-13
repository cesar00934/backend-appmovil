import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireSupervisor } from '../middleware/requireSupervisor.js';

const router = express.Router();

// Usamos middlewares para validar el token y el rol de supervisor
router.post('/sync-users', requireAuth, requireSupervisor, async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Se esperaba un array de usuarios' });
    }

    // Usamos upsert para actualizar o insertar sin borrar todo (más seguro)
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .upsert(users, { onConflict: 'email' });

    if (error) throw error;

    res.json({ ok: true, message: 'Usuarios sincronizados' });
  } catch (err) {
    console.error('Admin Error:', err.message);
    res.status(500).json({ error: 'Error interno en el servidor admin' });
  }
});

export default router;