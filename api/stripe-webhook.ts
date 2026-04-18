import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripeClient } from '../src/lib/stripe';

async function readRawBody(req: VercelRequest) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function getPlanFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return 'monthly';
  if (priceId === process.env.STRIPE_PRICE_ID_YEARLY) return 'yearly';
  return 'monthly';
}

async function updateSubscriptionFromEvent(
  event: Stripe.Event,
  admin: ReturnType<typeof createClient>
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId) return;

      await admin
        .from('app_users')
        .update({
          subscription_status: 'premium',
          subscription_plan: session.metadata?.plan || 'monthly',
          subscription_updated_at: new Date().toISOString(),
          billing_provider: 'stripe',
          stripe_customer_id:
            typeof session.customer === 'string' ? session.customer : null,
          is_admin_managed: false,
        })
        .eq('user_id', userId);
      return;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : null;
      if (!customerId) return;

      await admin
        .from('app_users')
        .update({
          subscription_status: subscription.status === 'active' ? 'premium' : 'free',
          subscription_plan: getPlanFromPriceId(subscription.items.data[0]?.price?.id),
          subscription_updated_at: new Date().toISOString(),
          billing_provider: 'stripe',
          is_admin_managed: false,
        })
        .eq('stripe_customer_id', customerId);
      return;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : null;
      if (!customerId) return;

      await admin
        .from('app_users')
        .update({
          subscription_status: 'free',
          subscription_plan: 'free',
          subscription_updated_at: new Date().toISOString(),
          billing_provider: 'stripe',
          is_admin_managed: false,
        })
        .eq('stripe_customer_id', customerId);
      return;
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Missing Stripe or Supabase configuration' });
  }

  const signature = req.headers['stripe-signature'];

  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: 'Missing stripe signature' });
  }

  try {
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    await updateSubscriptionFromEvent(event, admin);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error', error);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
}
