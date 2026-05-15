import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// n8n Webhook URLs
export const N8N_WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://nonempirically-araucarian-leia.ngrok-free.dev';
export const N8N_FLOW1_URL = `${N8N_WEBHOOK_BASE_URL}/webhook/flow1`;
export const N8N_FLOW2_URL = `${N8N_WEBHOOK_BASE_URL}/webhook/flow2`;
export const N8N_FLOW4_URL = `${N8N_WEBHOOK_BASE_URL}/webhook/event-check`;
