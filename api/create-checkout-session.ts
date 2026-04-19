import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getStripeClient } from '../src/lib/stripe';
import { getSubscriptionPlanConfig, type SubscriptionPlanId } from '../src/lib/subscription';

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

function getServerAppBaseUrl(req: VercelRequest) {
  return (
    process.env.APP_BASE_URL ||
    process.env.VITE_AUTH_REDIRECT_URL ||
    req.headers.origin ||
    'https://sukeret360.app'
  ).replace(/\/+$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripeClient();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Billing service is not ready' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const body = parseBody(req);
  const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
  const planConfig = getSubscriptionPlanConfig(plan as SubscriptionPlanId);

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
        billing_provider: 'stripe',
        billing_currency: 'ils',
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }

  const appBaseUrl = getServerAppBaseUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'ils',
          unit_amount: planConfig.amount,
          recurring: {
            interval: planConfig.interval,
          },
          product_data: {
            name: planConfig.title,
            description: planConfig.description,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'auto',
    success_url: `${appBaseUrl}/?billing=success`,
    cancel_url: `${appBaseUrl}/?billing=cancelled`,
  });

  return res.status(200).json({ url: session.url });
}
