import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).end();
    const phone = String(req.query.phone||'').trim();
    if(!phone) return res.status(400).json({ ok:false, error:'phone required' });

    const { data: g } = await supabase
      .from('kids.guardians').select('id').eq('phone', phone).maybeSingle();
    if(!g) return res.json({ ok:false, children: [] });

    const { data: links } = await supabase
      .from('kids.guardian_children').select('child_id').eq('guardian_id', g.id);
    const ids = (links||[]).map(l=>l.child_id);
    if(ids.length===0) return res.json({ ok:true, children: [] });

    const { data: kids } = await supabase
      .from('kids.children').select('id, full_name, dob, allergies').in('id', ids);

    res.json({ ok:true, children: kids||[] });
  } catch (e:any) {
    res.status(400).json({ ok:false, error:e.message });
  }
}