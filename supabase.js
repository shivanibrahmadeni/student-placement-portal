const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (url && key && /^https:\/\/.+/.test(url) && key.length > 20) {
  supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

module.exports = { supabase, isDatabaseConfigured: Boolean(supabase) };
