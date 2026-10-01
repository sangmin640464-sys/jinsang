import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gtxxfamhwntxmhcjlyvo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WEtkL96a_wcF6VkWnlkjvQ_tYW8WXAB';

export const supabase = createClient(supabaseUrl, supabaseKey);
