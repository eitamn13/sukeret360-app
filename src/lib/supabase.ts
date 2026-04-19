import { createClient } from '@supabase/supabase-js';
import type {
  EmergencyContact,
  LoggedMeal,
  MedicationLogEntry,
  MedicationScheduleItem,
  SavedLocation,
  SugarLogEntry,
  UserProfile,
} from '../context/AppContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const authRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sukeret360-auth',
      },
    })
  : null;

const APP_LOCAL_STORAGE_KEYS = [
  'guest_mode_v1',
  'userProfile',
  'onboardingDone',
  'emergency_contact',
  'saved_location',
  'locationPermissionGranted',
  'medication_schedule',
  'medication_logs',
  'meal_logs',
  'todayMeals',
  'sugar_logs',
  'medication_notification_log',
  'sugar_emergency_alert_log',
] as const;

const APP_STORAGE_PREFIX = 'sukeret360:';

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export function getAuthRedirectUrl() {
  if (authRedirectUrl) {
    return stripTrailingSlash(authRedirectUrl);
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return 'http://localhost:5173';
}

export function clearAppLocalState() {
  if (typeof window === 'undefined') return;

  for (const key of APP_LOCAL_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(APP_STORAGE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }
}

export type SubscriptionStatus = 'free' | 'premium' | 'lifetime';
export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface RemoteAppSnapshot {
  onboardingDone: boolean;
  userProfile: UserProfile;
  emergencyContact: EmergencyContact;
  savedLocation: SavedLocation | null;
  locationPermissionGranted: boolean;
  medicationSchedule: MedicationScheduleItem[];
  medicationLogs: MedicationLogEntry[];
  mealLogs: LoggedMeal[];
  sugarLogs: SugarLogEntry[];
}

export interface AppUserRecord {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_seen_at: string;
  auth_provider: string;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  subscription_updated_at: string | null;
  subscription_started_at: string | null;
  subscription_renews_at: string | null;
  subscription_active: boolean;
  payment_status: string;
  billing_provider: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  billing_currency: string;
  cancel_at_period_end: boolean;
  last_payment_at: string | null;
  is_admin_managed: boolean;
}

export async function fetchRemoteAppSnapshot(userId: string): Promise<RemoteAppSnapshot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_app_state')
    .select('app_state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch remote app snapshot', error);
    return null;
  }

  return (data?.app_state as RemoteAppSnapshot | null) ?? null;
}

export async function saveRemoteAppSnapshot(userId: string, snapshot: RemoteAppSnapshot) {
  if (!supabase) return;

  const { error } = await supabase.from('user_app_state').upsert(
    {
      user_id: userId,
      app_state: snapshot,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.warn('Failed to save remote app snapshot', error);
  }
}

function getAuthProvider(user: {
  app_metadata?: { provider?: string | null; providers?: string[] | null };
  identities?: Array<{ provider?: string | null }> | null;
}) {
  const fromMetadata = user.app_metadata?.provider?.trim();
  if (fromMetadata) return fromMetadata;

  const fromProviders = user.app_metadata?.providers?.find(Boolean)?.trim();
  if (fromProviders) return fromProviders;

  const fromIdentity = user.identities?.find((identity) => identity.provider)?.provider?.trim();
  return fromIdentity || 'email';
}

export async function syncAuthenticatedUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string | null };
  app_metadata?: { provider?: string | null; providers?: string[] | null };
  identities?: Array<{ provider?: string | null }> | null;
}) {
  if (!supabase || !user.email?.trim()) return;

  const { error } = await supabase.from('app_users').upsert(
    {
      user_id: user.id,
      email: user.email.trim().toLowerCase(),
      full_name: user.user_metadata?.full_name?.trim() || '',
      auth_provider: getAuthProvider(user),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.warn('Failed to sync authenticated user', error);
  }
}
