import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// When deployed with a separate API server (e.g. frontend on Vercel, API on Replit),
// set VITE_API_URL to the API's base URL so all fetch calls are routed correctly.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl.replace(/\/+$/, ""));
}

createRoot(document.getElementById("root")!).render(<App />);
