import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-neon">404</h1>
        <h2 className="mt-4 font-display text-2xl font-semibold">Stránka nenalezena</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tato stránka neexistuje nebo byla přesunuta.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-md bg-gradient-neon px-4 py-2 text-sm font-semibold text-neon-foreground shadow-neon"
        >
          Zpět domů
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Něco se pokazilo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Zkus obnovit stránku nebo se vrátit na hlavní stránku.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-gradient-neon px-4 py-2 text-sm font-semibold text-neon-foreground shadow-neon"
          >
            Zkusit znovu
          </button>
          <a href="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Domů
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Skyf.gg — Komunitní hub Skyfova Imperia" },
      { name: "description", content: "Oficiální komunitní stránka českého CS2 streamera Skyfa. Sbírej body sledováním streamu, vyměňuj za CS2 skiny a soutěž v žebříčku." },
      { name: "author", content: "Skyfovo Imperium" },
      { property: "og:title", content: "Skyf.gg — Komunitní hub Skyfova Imperia" },
      { property: "og:description", content: "Sbírej body, vyměňuj za CS2 skiny a soutěž v žebříčku." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <div className={isAdmin ? "admin-theme min-h-screen bg-background text-foreground" : "min-h-screen bg-background text-foreground"}>
        {!isAdmin && <Header />}
        <Outlet />
        {!isAdmin && <Footer />}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
