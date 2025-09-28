import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { securityCode } from '../../../lib/code';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { phone, service_date, child_ids } = req.body as {
      phone:string, service_date:string, child_ids:string[]
    };

    const { data: g } = await supabase
      .from('kids.guardians').select('id').eq('phone', phone).maybeSingle();
    if(!g) return res.status(404).json({ ok:false, error:'Tutor no encontrado' });

    const { data: links } = await supabase
      .from('kids.guardian_children').select('child_id').eq('guardian_id', g.id);
    const allowed = new Set((links||[]).map(l=>l.child_id));
    for (const cid of child_ids) if (!allowed.has(cid)) {
      return res.status(403).json({ ok:false, error:'Hijo no vinculado a este tutor' });
    }

    let { data: svc } = await supabase
      .from('kids.services').select('*').eq('service_date', service_date).maybeSingle();
    if (!svc) {
      const ins = await supabase.from('kids.services').insert([{ service_date }]).select().single();
      if (ins.error) throw ins.error; svc = ins.data;
    }

    const { data: kids } = await supabase
      .from('kids.children').select('id, full_name, dob, allergies').in('id', child_ids);

    const out:any[] = [];
    for (const ch of (kids||[])) {
      const { data: classroomName } = await supabase.rpc('classroom_for', { dob: ch.dob, at_date: service_date });
      const code = securityCode(ch.id, service_date);

      const ins = await supabase.from('kids.checkins').insert([{
        child_id: ch.id,
        service_id: svc!.id,
        classroom_name: classroomName || 'Sin salón',
        security_code: code
      }]).select().single();
      if (ins.error) throw ins.error;

      out.push({
        child_id: ch.id,
        full_name: ch.full_name,
        allergies: ch.allergies,
        classroom: ins.data.classroom_name,
        security_code: ins.data.security_code
      });
    }

    res.json({ ok:true, checkins: out });
  } catch (e:any) {
    res.status(400).json({ ok:false, error:e.message });
  }
}