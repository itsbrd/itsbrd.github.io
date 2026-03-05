// supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://fauoohclvblciogeluiy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE"
);
