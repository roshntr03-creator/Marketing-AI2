import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuogpynrawalmiqlbwxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b2dweW5yYXdhbG1pcWxid3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzI1ODksImV4cCI6MjA3MjQwODU4OX0.3KsJGmjwOEuUMKgGONZ1lwp0jihplavUDezXDyqZ5OA';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
