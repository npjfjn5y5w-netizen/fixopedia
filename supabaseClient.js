import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://jobycjifggynmfszpdto.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYnljamlmZ2d5bm1mc3pwZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjAyOTcsImV4cCI6MjA4MTg5NjI5N30.BJGf2NVlBP_-qqsp4TFYnjn9RdvqAC1wkj8j9MkXinQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
