import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ylmsomkljcqcjpztslug.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  '';

const isSecretKey = supabaseAnonKey.startsWith('sb_secret_');
const isMissingKey = !supabaseAnonKey;
export const isSupabaseBrowserKeyValid = !isMissingKey && !isSecretKey;

if (isMissingKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Missing VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_KEY. Browser auth/database calls will fail until set.',
  );
}

if (isSecretKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Supabase secret key detected in browser env. Use publishable/anon key only. Falling back to safe stub key.',
  );
}

const runtimeKey = isSupabaseBrowserKeyValid ? supabaseAnonKey : 'public-anon-key-not-configured';

export const supabase = createClient(supabaseUrl, runtimeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
