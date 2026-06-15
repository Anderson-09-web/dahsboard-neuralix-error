import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

async function bootstrap() {
  // 1. Start with build-time env var (always available in dev or Vercel builds that set it)
  let apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

  // 2. Try the Vercel serverless config endpoint (same-origin, no CORS issues).
  //    This endpoint reads from the DB so it always reflects the latest API URL
  //    even if the Replit URL changed since the last build.
  try {
    const resp = await fetch("/api/config", { cache: "no-store" });
    if (resp.ok) {
      const data = (await resp.json()) as { apiUrl?: string };
      if (data.apiUrl && data.apiUrl.startsWith("http")) {
        apiUrl = data.apiUrl.replace(/\/+$/, "");
      }
    }
  } catch {
    // Swallow — use whatever apiUrl we already have
  }

  if (apiUrl) {
    setBaseUrl(apiUrl);
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
