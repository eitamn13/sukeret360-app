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

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

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

export async function syncAuthenticatedUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string | null };
}) {
  if (!supabase || !user.email?.trim()) return;

  const { error } = await supabase.from('app_users').upsert(
    {
      user_id: user.id,
      email: user.email.trim().toLowerCase(),
      full_name: user.user_metadata?.full_name?.trim() || '',
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.warn('Failed to sync authenticated user', error);
  }
}
