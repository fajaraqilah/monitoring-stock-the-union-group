// Supabase Client Configuration
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client configuration
// Get these from your Supabase project settings: Project Settings > API
const SUPABASE_URL = 'https://wdbkyngiforcrwfnakww.supabase.co/'; // Replace with your actual Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmt5bmdpZm9yY3J3Zm5ha3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDY5MjEsImV4cCI6MjA4NTQyMjkyMX0.j4msqs4sERAlWnF0WXym1tNhBZbfYt7E1iFEe2eXAv8'; // Replace with your actual Supabase anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the supabase client for use in other modules
export { supabase };