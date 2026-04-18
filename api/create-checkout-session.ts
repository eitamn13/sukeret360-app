import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getStripeClient } from '../src/lib/stripe';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripeClient();
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Missing billing configuration' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const body = parseBody(req);
  const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
  const priceId =
    plan === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

  if (!priceId) {
    return res.status(500).json({ error: 'Missing Stripe price id' });
  }

  const verifier = createClient(supabaseUrl, supabaseAnonKey);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: verifyError,
  } = await verifier.auth.getUser(token);

  if (verifyError || !user?.id || !user.email) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const { data: appUser } = await admin
    .from('app_users')
    .select('stripe_customer_id, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  let customerId = appUser?.stripe_customer_id || null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:
        (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
        appUser?.full_name ||
        undefined,
      metadata: {
        user_id: user.id,
      },
    });

    customerId = customer.id;

    await admin
      .from('app_users')
      .update({
        stripe_customer_id: customerId,
      })
      .eq('user_id', user.id);
  }

  const origin =
    req.headers.origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    'https://sukeret360.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?billing=success`,
    cancel_url: `${origin}/?billing=cancelled`,
    metadata: {
      user_id: user.id,
      plan,
    },
    allow_promotion_codes: true,
  });

  return res.status(200).json({ url: session.url });
}
