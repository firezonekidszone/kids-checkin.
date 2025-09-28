import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
const todayISO = () => new Date().toISOString().slice(0,10);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const date = (req.query.date as string) || todayISO();
  if (req.method === 'GET') {
    const { data } = await supabase.from('kids.services').select('*').eq('service_date', date).maybeSingle();
    return res.json({ service: data });
  }
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('kids.services').insert([{ service_date: date }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ service: data });
  }
  res.status(405).end();
}