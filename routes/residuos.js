// routes/residuos.js (Express)
import express from 'express';
import { supabaseAdmin } from '../lib/supabaseClient.js';
const router = express.Router();

/*
Payload example:
{
  "residuos": [
    { "temp_id": 123, "tipo":"Plastico","clasificacion":"Reciclable","cantidad":2.5,"unidad":"kg","fecha":167...,"codigo":"XYZ","id_servidor":null,"fecha_actualizacion":167...}
  ]
}
Response:
{ "updated": [ { temp_id, id_servidor, fecha_actualizacion }, ... ] }
*/

router.post('/batch', async (req, res) => {
  try {
    const { residuos } = req.body;
    if (!Array.isArray(residuos)) return res.status(400).send({ error: 'invalid payload' });

    // map payload -> rows for upsert
    const rows = residuos.map(r => ({
      id_servidor: r.id_servidor || null,
      tipo: r.tipo,
      clasificacion: r.clasificacion,
      cantidad: r.cantidad,
      unidad: r.unidad,
      fecha: r.fecha ? new Date(r.fecha) : new Date(),
      fecha_actualizacion: r.fecha_actualizacion ? new Date(r.fecha_actualizacion) : new Date(),
      codigo: r.codigo || null
    }));

    // Upsert by id_servidor or codigo: define onConflict
    // If client doesn't send id_servidor, we rely on 'codigo' to decide conflict or server creates new row.
    // Here we'll upsert on 'codigo' when present, otherwise insert new.
    // Strategy: upsert on (codigo) if codigo not null, else insert.
    const withCodigo = rows.filter(r => r.codigo);
    const withoutCodigo = rows.filter(r => !r.codigo);

    const result = { createdOrUpdated: [] };

    if (withCodigo.length) {
      const { data, error } = await supabaseAdmin
        .from('residuos')
        .upsert(withCodigo, { onConflict: 'codigo' })
        .select('id, id_servidor, fecha_actualizacion, codigo');
      if (error) throw error;
      data.forEach(d => result.createdOrUpdated.push(d));
    }

    if (withoutCodigo.length) {
      // insert many
      const { data, error } = await supabaseAdmin
        .from('residuos')
        .insert(withoutCodigo)
        .select('id, id_servidor, fecha_actualizacion, codigo');
      if (error) throw error;
      data.forEach(d => result.createdOrUpdated.push(d));
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
