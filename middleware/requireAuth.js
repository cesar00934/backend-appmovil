import { supabaseAdmin } from "../lib/supabaseClient.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = auth.replace("Bearer ", "");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.supabaseUser = data.user;
    next();
  } catch (err) {
    console.error("requireAuth error", err);
    res.status(500).json({ error: "auth error" });
  }
}