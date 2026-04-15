import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function normalizeEmails(value?: string | null) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmails = normalizeEmails(process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS);

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  if (adminEmails.length === 0) {
    return res.status(500).json({ error: 'Missing admin emails configuration' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const verifier = createClient(supabaseUrl, supabaseAnonKey);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: verifyError,
  } = await verifier.auth.getUser(token);

  if (verifyError || !user?.email) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await admin
    .from('app_users')
    .select('user_id, email, full_name, created_at, last_seen_at')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ users: data ?? [] });
}
