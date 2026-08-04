const SUPABASE_URL =
    "https://oudxsihtfvfhyglqqarq.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_7jN-tI3jAfuendFXY61JJg_B6fvk5Zi";


window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


console.log(
    "Supabase подключён:",
    window.supabaseClient
);