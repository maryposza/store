// ============================================================
// supabase-config.js — Tienda pública (store/)
// Supabase Dashboard → Settings → API
// ============================================================

// URL del proyecto Supabase
// Formato: https://XXXXXXXXXX.supabase.co
const SUPABASE_URL = 'https://pzvlklvsfgmljhvoakkk.supabase.co';

// Clave pública anon (safe para el frontend — respeta RLS)
// Supabase Dashboard → Settings → API → anon / public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dmxrbHZzZmdtbGpodm9ha2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDE1NjcsImV4cCI6MjA5MjgxNzU2N30.y-dfhR5VNDpWXZfeDOENQRJcPPykIBqt4gUSW9UL7Bc;

// URL del Cloudflare Worker (backend seguro)
// Se obtiene después del deploy: wrangler deploy worker/worker.js --name postres-worker
// Formato: https://postres-worker.TU_SUBDOMAIN.workers.dev
const WORKER_URL = 'https://postres-worker.marypostresza.workers.dev/';

let db = null;
try {
  const { createClient } = supabase;
  db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn('[Store] Supabase no disponible:', e.message);
}
