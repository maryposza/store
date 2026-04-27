const SUPABASE_URL = 'https://pzvlklvsfgmljhvoakkk.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dmxrbHZzZmdtbGpodm9ha2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDE1NjcsImV4cCI6MjA5MjgxNzU2N30.y-dfhR5VNDpWXZfeDOENQRJcPPykIBqt4gUSW9UL7Bc';

const WORKER_URL = 'https://postres-worker.marypostresza.workers.dev';

let db = null;
try {
  const { createClient } = supabase;
  db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn('[Store] Supabase no disponible:', e.message);
}
