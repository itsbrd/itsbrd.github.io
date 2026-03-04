// supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://YOUR_PROJECT_REF.supabase.co",
  "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
);
