import express from "express";
import Joi from "joi";
import { supabase } from "../lib/supabaseClient.js";

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post("/login", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email, password } = value;
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      return res.status(401).json({ error: authErr.message || authErr });
    }

    // normalize response
    const session = data.session;
    const user = data.user;

    return res.json({
      accessToken: session?.access_token,
      refreshToken: session?.refresh_token,
      usuario: user?.email || user?.user_metadata?.name || null,
      role: null, // optional: you can fetch role from your 'usuarios' table by user.id
      userId: user?.id,
    });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "server error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refresh token required" });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return res.status(401).json({ error: error.message || error });

    return res.json({
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    });
  } catch (err) {
    console.error("refresh error", err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;