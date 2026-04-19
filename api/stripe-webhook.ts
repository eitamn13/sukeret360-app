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

function fromUnixTimestamp(value: number | null | undefined) {
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : null;
}

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const metadataPlan = subscription.metadata?.plan;
  if (metadataPlan === 'yearly') return 'yearly';
  if (metadataPlan === 'monthly') return 'monthly';
  return subscription.items.data[0]?.plan?.interval === 'year' ? 'yearly' : 'monthly';
}

function isActiveSubscription(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing';
}

async function updateFromSubscription(
  admin: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  await admin
    .from('app_users')
    .update({
      subscription_status: isActiveSubscription(subscription.status) ? 'premium' : 'free',
      subscription_plan: isActiveSubscription(subscription.status)
        ? getPlanFromSubscription(subscription)
        : 'free',
      subscription_active: isActiveSubscription(subscription.status),
      subscription_started_at: fromUnixTimestamp(subscription.start_date),
      subscription_renews_at: fromUnixTimestamp(subscription.current_period_end),
      subscription_updated_at: new Date().toISOString(),
      payment_status:
        subscription.status === 'past_due' || subscription.status === 'unpaid'
          ? 'failed'
          : subscription.status === 'canceled'
            ? 'canceled'
            : 'paid',
      billing_provider: 'stripe',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
      billing_currency: subscription.currency || 'ils',
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      is_admin_managed: false,
    })
    .eq('stripe_customer_id', customerId);
}

async function updateFromInvoice(admin: ReturnType<typeof createClient>, invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  await admin
    .from('app_users')
    .update({
      payment_status: invoice.paid ? 'paid' : invoice.status === 'open' ? 'processing' : 'failed',
      last_payment_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : invoice.created
          ? new Date(invoice.created * 1000).toISOString()
          : null,
      subscription_updated_at: new Date().toISOString(),
      billing_provider: 'stripe',
      billing_currency: invoice.currency || 'ils',
      is_admin_managed: false,
    })
    .eq('stripe_customer_id', customerId);
}

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || null;

  if (!userId) return;

  await admin
    .from('app_users')
    .update({
      subscription_status: 'premium',
      subscription_plan: session.metadata?.plan === 'yearly' ? 'yearly' : 'monthly',
      subscription_active: true,
      subscription_updated_at: new Date().toISOString(),
      payment_status: 'paid',
      billing_provider: 'stripe',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      billing_currency: 'ils',
      is_admin_managed: false,
    })
    .eq('user_id', userId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(admin, event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await updateFromSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await updateFromInvoice(admin, event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error', error);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
}
