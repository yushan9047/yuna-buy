// supabase-client.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhaW9iemdhanRibGxzenBsbGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjIyMTAsImV4cCI6MjA4ODIzODIxMH0.UeAYQib1ZQ8l1WzGmT4Bg_hOIAOPRhZ6JbPQYug0GN0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
