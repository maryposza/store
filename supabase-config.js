// ============================================================
// supabase-config.js — Tienda pública (store/)
// Supabase Dashboard → Settings → API
// ============================================================

// URL del proyecto Supabase
// Formato: https://XXXXXXXXXX.supabase.co
const SUPABASE_URL = 'https://TU_PROJECT_ID.supabase.co';

// Clave pública anon (safe para el frontend — respeta RLS)
// Supabase Dashboard → Settings → API → anon / public
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';

// URL del Cloudflare Worker (backend seguro)
// Se obtiene después del deploy: wrangler deploy worker/worker.js --name postres-worker
// Formato: https://postres-worker.TU_SUBDOMAIN.workers.dev
const WORKER_URL = 'https://postres-worker.TU_SUBDOMAIN.workers.dev';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
