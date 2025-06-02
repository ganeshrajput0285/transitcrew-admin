import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymvdsdophnscycxpjbmn.supabase.co'; // Replace this
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdmRzZG9waG5zY3ljeHBqYm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTc2MDYsImV4cCI6MjA1OTg3MzYwNn0.7IZXkB11GmFfMu88nsbi39_jaGSdTp6whONEcMUsIRk'; // Replace this

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;