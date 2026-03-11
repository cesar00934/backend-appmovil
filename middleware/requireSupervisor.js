import { supabaseAdmin } from "../lib/supabaseClient.js";

export async function requireSupervisor(req, res, next) {
  try {
    const userId = req.supabaseUser?.id;
    if (!userId) return res.status(401).json({ error: "No user" });

    // suponer tabla 'usuarios' con col 'id_servidor' que guarda supabase user id
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("role")
      .eq("id_servidor", userId)
      .maybeSingle();

    if (error || !data) return res.status(403).json({ error: "Forbidden" });
    if (data.role !== "supervisor") return res.status(403).json({ error: "Forbidden" });

    next();
  } catch (err) {
    console.error("requireSupervisor error", err);
    res.status(500).json({ error: "server error" });
  }
}