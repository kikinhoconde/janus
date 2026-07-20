// Credenciais Supabase
const SUPABASE_URL = 'https://lsqgxxzauzjcozdroyvo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eKfdd1atcOYAKPesyiXjVg_SBkwcW6t';

// Inicializar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
