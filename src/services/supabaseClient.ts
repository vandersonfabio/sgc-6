import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CONFIG_STORAGE_KEY = 'sgc6_supabase_custom_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isChecking: boolean;
  error?: string;
  source: 'env' | 'custom' | 'none';
  projectUrl?: string;
}

let supabaseInstance: SupabaseClient | null = null;
let lastConfigHash = '';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://cnolwqevgjcdwohmvbgw.supabase.co',
  anonKey: 'sb_publishable_sK6QikCwCmnecjgmDHWgnA_aCGFv4LZ',
};

export function cleanSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim();
  // Remove /rest/v1 or /rest/v1/ suffix if user pasted the PostgREST URL
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getStoredSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: cleanSupabaseUrl(parsed.url),
          anonKey: parsed.anonKey.trim(),
        };
      }
    }
  } catch (e) {
    console.error('Erro ao ler configuração local do Supabase:', e);
  }
  return null;
}

export function getActiveSupabaseConfig(): { config: SupabaseConfig; source: 'env' | 'custom' | 'default' } {
  // 1. Primary: Use DEFAULT_SUPABASE_CONFIG defined directly in code
  if (DEFAULT_SUPABASE_CONFIG?.url && DEFAULT_SUPABASE_CONFIG?.anonKey) {
    return {
      config: {
        url: cleanSupabaseUrl(DEFAULT_SUPABASE_CONFIG.url),
        anonKey: DEFAULT_SUPABASE_CONFIG.anonKey.trim(),
      },
      source: 'default',
    };
  }

  // 2. Fallback: Check custom user-configured credentials in localStorage
  const stored = getStoredSupabaseConfig();
  if (stored?.url && stored?.anonKey) {
    return { config: stored, source: 'custom' };
  }

  // 3. Fallback: Check environment variables
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL;
  const envKey = env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && envUrl !== 'MY_SUPABASE_URL' && envKey !== 'MY_SUPABASE_ANON_KEY') {
    return { config: { url: cleanSupabaseUrl(envUrl), anonKey: envKey.trim() }, source: 'env' };
  }

  return { config: DEFAULT_SUPABASE_CONFIG, source: 'default' };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { config } = getActiveSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    supabaseInstance = null;
    lastConfigHash = '';
    return null;
  }

  const currentHash = `${config.url}:::${config.anonKey}`;
  if (!supabaseInstance || lastConfigHash !== currentHash) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'sgc6_auth_v1',
        },
      });
      lastConfigHash = currentHash;
    } catch (e) {
      console.error('Erro ao instanciar cliente Supabase:', e);
      supabaseInstance = null;
      lastConfigHash = '';
    }
  }

  return supabaseInstance;
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const cleanedUrl = cleanSupabaseUrl(url);
    const trimmedKey = anonKey.trim();
    if (!cleanedUrl || !trimmedKey) return false;

    localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({ url: cleanedUrl, anonKey: trimmedKey })
    );
    // Invalidate client instance
    supabaseInstance = null;
    lastConfigHash = '';
    return true;
  } catch (e) {
    console.error('Erro ao salvar configuração do Supabase:', e);
    return false;
  }
}

export function clearCustomSupabaseConfig(): void {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    supabaseInstance = null;
    lastConfigHash = '';
  } catch (e) {
    console.error('Erro ao limpar configuração do Supabase:', e);
  }
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const start = performance.now();
  let client: SupabaseClient | null = null;

  if (customUrl && customKey) {
    try {
      client = createClient(cleanSupabaseUrl(customUrl), customKey.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'sgc6_test_v1',
        },
      });
    } catch (e: any) {
      return { success: false, message: `URL ou chave inválida: ${e.message}` };
    }
  } else {
    client = getSupabaseClient();
  }

  if (!client) {
    return {
      success: false,
      message: 'Supabase não está configurado. Insira a URL e a Chave Anon para conectar.',
    };
  }

  try {
    // Attempt a light ping/query on 'unidade' table
    const { error } = await client.from('unidade').select('count', { count: 'exact', head: true });
    const latency = Math.round(performance.now() - start);

    if (error) {
      // If table does not exist yet (error 42P01), connection to Supabase itself succeeded!
      if (error.code === '42P01' || error.message.includes('relation') || error.code === 'PGRST116' || error.code === '42501') {
        return {
          success: true,
          message: `Conectado ao Supabase com sucesso (${latency}ms). Tabelas precisam ser criadas pelo script SQL.`,
          latencyMs: latency,
        };
      }
      return {
        success: false,
        message: `Falha ao consultar banco Supabase: ${error.message} (${error.code || 'Erro'})`,
      };
    }

    return {
      success: true,
      message: `Conexão estabelecida com sucesso com PostgreSQL Supabase (${latency}ms)!`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao conectar com o servidor Supabase: ${err.message || 'Falha de rede'}`,
    };
  }
}
