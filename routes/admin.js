import express from "express";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireSupervisor } from "../middleware/requireSupervisor.js";
import Joi from "joi";

const router = express.Router();

const replaceSchema = Joi.object({
  users: Joi.array().items(
    Joi.object({
      email: Joi.string().email().required(),
      role: Joi.string().valid("operario", "supervisor").default("operario"),
      tempPassword: Joi.string().optional(),
    })
  ).min(0)
});

router.post("/replace-users", requireAuth, requireSupervisor, async (req, res) => {
  try {
    const { error, value } = replaceSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { users } = value;

    // Backup / audit: copy existing users
    const { data: existing, error: e1 } = await supabaseAdmin.from("usuarios").select("*");
    if (e1) return res.status(500).json({ error: "db error" });

    // delete non-supervisors from auth and table
    const toDelete = existing.filter(u => u.role !== "supervisor").map(u => u.id_servidor).filter(Boolean);
    for (const uid of toDelete) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn("delete user error", uid, err.message);
      }
    }
    await supabaseAdmin.from("usuarios").delete().neq("role", "supervisor");

    // create new users
    for (const u of users) {
      const email = u.email;
      const role = u.role || "operario";
      const passwd = u.tempPassword || Math.random().toString(36).slice(-8) + "A1!";
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: passwd,
        email_confirm: true
      });
      if (createErr) {
        console.error("createUserErr", createErr);
        continue;
      }
      await supabaseAdmin.from("usuarios").insert([{ id_servidor: created.user.id, usuario: email, role }]);
    }

    await supabaseAdmin.from("audit_logs").insert([{ actor: req.supabaseUser.id, action: "replace-users", payload: JSON.stringify(users), timestamp: new Date().toISOString() }]);

    res.json({ ok: true });
  } catch (err) {
    console.error("replace-users error", err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;