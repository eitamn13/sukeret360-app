import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type SubscriptionStatus = 'free' | 'premium' | 'lifetime';
type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';

function normalizeEmails(value?: string | null) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseBody(req: VercelRequest) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

async function verifyAdmin(req: VercelRequest) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmails = normalizeEmails(process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS);

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return { error: 'Missing Supabase configuration', status: 500 as const };
  }

  if (adminEmails.length === 0) {
    return { error: 'Missing admin emails configuration', status: 500 as const };
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { error: 'Missing auth token', status: 401 as const };
  }

  const verifier = createClient(supabaseUrl, supabaseAnonKey);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: verifyError,
  } = await verifier.auth.getUser(token);

  if (verifyError || !user?.email) {
    return { error: 'Invalid auth token', status: 401 as const };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { admin, user, status: 200 as const };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const verification = await verifyAdmin(req);

  if ('error' in verification) {
    return res.status(verification.status).json({ error: verification.error });
  }

  const { admin } = verification;

  if (req.method === 'GET') {
    const { data, error } = await admin
      .from('app_users')
      .select(
        'user_id, email, full_name, created_at, last_seen_at, auth_provider, subscription_status, subscription_plan, subscription_updated_at, billing_provider, stripe_customer_id, is_admin_managed'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ users: data ?? [] });
  }

  if (req.method === 'PATCH') {
    const body = parseBody(req);
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const subscriptionStatus = typeof body.subscriptionStatus === 'string' ? body.subscriptionStatus : '';
    const subscriptionPlan = typeof body.subscriptionPlan === 'string' ? body.subscriptionPlan : '';

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const allowedStatuses: SubscriptionStatus[] = ['free', 'premium', 'lifetime'];
    const allowedPlans: SubscriptionPlan[] = ['free', 'monthly', 'yearly', 'lifetime'];

    if (!allowedStatuses.includes(subscriptionStatus as SubscriptionStatus)) {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }

    if (!allowedPlans.includes(subscriptionPlan as SubscriptionPlan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const { data, error } = await admin
      .from('app_users')
      .update({
        subscription_status: subscriptionStatus,
        subscription_plan: subscriptionPlan,
        subscription_updated_at: new Date().toISOString(),
        billing_provider: subscriptionStatus === 'free' ? null : 'admin',
        is_admin_managed: true,
      })
      .eq('user_id', userId)
      .select(
        'user_id, email, full_name, created_at, last_seen_at, auth_provider, subscription_status, subscription_plan, subscription_updated_at, billing_provider, stripe_customer_id, is_admin_managed'
      )
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ user: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
