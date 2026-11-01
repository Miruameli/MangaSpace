import type { Metadata } from "next";
import { Header } from "@/components/header";
import "./globals.css";
import { HydrateRemote } from "@/components/hydrate-remote";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "MangaSpace — Free Comic Reader",
  description: "Read comics and manga online for free.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("mangaspace:theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased">
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <Header />
          <HydrateRemote />
          <main id="main-content" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
