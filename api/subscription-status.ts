import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Billing service is not ready' });
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

  if (verifyError || !user?.id) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const { data: appUser, error } = await admin
    .from('app_users')
    .select(
      'subscription_status, subscription_plan, subscription_active, subscription_started_at, subscription_renews_at, payment_status, billing_provider, stripe_customer_id, stripe_subscription_id, billing_currency, cancel_at_period_end, last_payment_at'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Unable to load subscription status' });
  }

  return res.status(200).json({
    subscription: appUser ?? {
      subscription_status: 'free',
      subscription_plan: 'free',
      subscription_active: false,
      subscription_started_at: null,
      subscription_renews_at: null,
      payment_status: 'none',
      billing_provider: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      billing_currency: 'ils',
      cancel_at_period_end: false,
      last_payment_at: null,
    },
  });
}
