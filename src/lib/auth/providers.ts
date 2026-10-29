import type { Provider } from "@supabase/supabase-js";

export interface OAuthProviderMeta {
  id: Provider;
  label: string;
}

// OAuth providers offered on the login page. Credentials are configured in the
// Supabase dashboard (auth → providers); each button activates only once its
// provider is set up, so an unconfigured provider simply returns an error.
export const OAUTH_PROVIDERS: OAuthProviderMeta[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "apple", label: "Apple" },
];
