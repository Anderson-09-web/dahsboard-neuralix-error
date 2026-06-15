import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, EyeOff, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const KNOWN_KEYS: { key: string; label: string; description: string; sensitive: boolean }[] = [
  { key: "discord_client_id",     label: "Discord Client ID",     description: "ID de la aplicación de Discord (Developer Portal)",   sensitive: false },
  { key: "discord_client_secret", label: "Discord Client Secret", description: "Secret OAuth2 de Discord",                            sensitive: true  },
  { key: "discord_bot_token",     label: "Discord Bot Token",     description: "Token del bot de Discord",                           sensitive: true  },
  { key: "groq_api_key",          label: "Groq API Key",          description: "Clave para el chat de IA (console.groq.com)",        sensitive: true  },
  { key: "app_url",               label: "App URL",               description: "URL del frontend en producción (ej: https://neuralixapp.vercel.app)", sensitive: false },
  { key: "discord_redirect_uri",  label: "Discord Redirect URI",  description: "Override del callback URI de OAuth2 (opcional)",     sensitive: false },
];

type ConfigEntry = { key: string; value: string; exists: boolean };

export default function AdminConfigPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<Record<string, ConfigEntry>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data: { key: string; value: string }[] = await res.json();
      const map: Record<string, ConfigEntry> = {};
      for (const k of KNOWN_KEYS) {
        const found = data.find((d) => d.key === k.key);
        map[k.key] = { key: k.key, value: found?.value ?? "", exists: !!found };
      }
      setConfigs(map);
      setEdits({});
    } catch (e: any) {
      toast({ title: "Error al cargar configuración", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(key: string) {
    const value = edits[key];
    if (value === undefined) return;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch(`/api/admin/config/${key}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error(await res.text());
      setConfigs((c) => ({ ...c, [key]: { key, value, exists: true } }));
      setEdits((e) => { const n = { ...e }; delete n[key]; return n; });
      toast({ title: "Guardado", description: `${key} actualizado correctamente.` });
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  const currentVal = (key: string) => edits[key] ?? configs[key]?.value ?? "";
  const isDirty = (key: string) => edits[key] !== undefined && edits[key] !== (configs[key]?.value ?? "");

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Database className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Configuracion del Sistema</h1>
              <p className="text-sm text-zinc-400">Claves almacenadas en la base de datos. No se necesitan en Vercel.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Recargar
          </Button>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-300">
            Estas claves se cargan desde la BD al iniciar el servidor. Despues de guardar un cambio, reinicia el API Server para que tome efecto.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {KNOWN_KEYS.map((k) => (
              <div key={k.key} className="h-24 rounded-xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {KNOWN_KEYS.map((item) => {
              const val = currentVal(item.key);
              const dirty = isDirty(item.key);
              const exists = configs[item.key]?.exists;
              const isVisible = visible[item.key];

              return (
                <div
                  key={item.key}
                  className={cn(
                    "rounded-xl border p-5 space-y-3 transition-colors",
                    dirty ? "border-indigo-500/40 bg-indigo-500/5" : "border-zinc-800 bg-zinc-900/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">{item.label}</Label>
                        {exists ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Configurado
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">No configurado</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                      <code className="text-xs text-zinc-600 font-mono">{item.key}</code>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={item.sensitive && !isVisible ? "password" : "text"}
                        value={val}
                        onChange={(e) => setEdits((ed) => ({ ...ed, [item.key]: e.target.value }))}
                        placeholder={exists ? "••••••••••••" : `Introduce ${item.label}`}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 pr-10"
                      />
                      {item.sensitive && (
                        <button
                          type="button"
                          onClick={() => setVisible((v) => ({ ...v, [item.key]: !v[item.key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <Button
                      onClick={() => save(item.key)}
                      disabled={!dirty || saving[item.key]}
                      size="sm"
                      className={cn(
                        "shrink-0",
                        dirty ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
                      )}
                    >
                      <Save className={cn("h-4 w-4 mr-1.5", saving[item.key] && "animate-spin")} />
                      {saving[item.key] ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
