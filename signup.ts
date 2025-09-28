import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { guardian, children } = req.body;

    const { data: g, error: gErr } = await supabase
      .from('kids.guardians').insert([guardian]).select().single();
    if (gErr) throw gErr;

    for (const ch of children) {
      const { data: c, error: cErr } = await supabase
        .from('kids.children').insert([ch]).select().single();
      if (cErr) throw cErr;
      const { error: linkErr } = await supabase
        .from('kids.guardian_children').insert([{ guardian_id: g.id, child_id: c.id }]);
      if (linkErr) throw linkErr;
    }

    res.json({ ok: true, guardian: g });
  } catch (e:any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}