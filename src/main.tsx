import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { initTracking } from "@arruda/tracking";
import { supabase } from "@/integrations/supabase/client";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://kgzybpelluftexrewyke.supabase.co";

initTracking({
  projectSlug: "arruda-central-hub",
  supabaseUrl,
  getAuthToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  mode: "frequency",
  debug: import.meta.env.DEV,
});

createRoot(document.getElementById("root")!).render(<App />);
