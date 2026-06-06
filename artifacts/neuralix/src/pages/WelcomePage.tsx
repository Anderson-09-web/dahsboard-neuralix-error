import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useGetWelcomeConfig, useUpdateWelcomeConfig, useTestWelcome, getGetWelcomeConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function WelcomePage() {
  const { guildId } = useParams<{ guildId: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: config, isLoading } = useGetWelcomeConfig(guildId, { query: { queryKey: getGetWelcomeConfigQueryKey(guildId), enabled: !!guildId } });
  const update = useUpdateWelcomeConfig();
  const testWelcome = useTestWelcome();
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => { if (config) setCfg(config); }, [config]);

  if (isLoading || !cfg) return (
    <Layout guildId={guildId}><div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>
  );

  const set = (key: string) => (val: any) => setCfg((c: any) => ({ ...c, [key]: val }));

  const save = () => {
    update.mutate({ guildId, data: cfg }, {
      onSuccess: () => { toast({ title: "Bienvenidas guardadas" }); qc.invalidateQueries({ queryKey: getGetWelcomeConfigQueryKey(guildId) }); },
      onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
    });
  };

  const test = () => {
    testWelcome.mutate({ guildId }, { onSuccess: () => toast({ title: "Mensaje de prueba enviado" }) });
  };

  return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Sistema de Bienvenidas</h1>
          <p className="text-muted-foreground text-sm">Configura los mensajes de bienvenida para nuevos miembros.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={test} disabled={testWelcome.isPending} data-testid="btn-test-welcome">Probar</Button>
          <Button size="sm" onClick={save} disabled={update.isPending} data-testid="btn-save-welcome">Guardar</Button>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Label>Activar bienvenidas</Label>
            <Switch checked={cfg.enabled} onCheckedChange={set("enabled")} data-testid="toggle-welcome-enabled" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Canal de bienvenida (ID)</Label>
            <Input placeholder="ID del canal" value={cfg.channelId || ""} onChange={(e) => set("channelId")(e.target.value)} data-testid="input-welcome-channel" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Mensaje de bienvenida</Label>
            <Textarea placeholder="Usa {user} para mencionar al miembro, {server} para el nombre del servidor" value={cfg.message || ""} onChange={(e) => set("message")(e.target.value)} rows={4} data-testid="textarea-welcome-message" />
            <p className="text-xs text-muted-foreground mt-1.5">Variables: {"{user}"}, {"{server}"}, {"{memberCount}"}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-sm">Embed</h3>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Usar embed</Label>
            <Switch checked={cfg.embedEnabled} onCheckedChange={set("embedEnabled")} data-testid="toggle-embed" />
          </div>
          {cfg.embedEnabled && (
            <>
              <div>
                <Label className="text-sm mb-1.5 block">Titulo del embed</Label>
                <Input placeholder="Titulo" value={cfg.embedTitle || ""} onChange={(e) => set("embedTitle")(e.target.value)} data-testid="input-embed-title" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Descripcion del embed</Label>
                <Textarea placeholder="Descripcion" value={cfg.embedDescription || ""} onChange={(e) => set("embedDescription")(e.target.value)} rows={3} data-testid="textarea-embed-desc" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Color (hex)</Label>
                <Input placeholder="#5865F2" value={cfg.embedColor || ""} onChange={(e) => set("embedColor")(e.target.value)} data-testid="input-embed-color" />
              </div>
            </>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-sm">Mensaje privado (DM)</h3>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Enviar DM al unirse</Label>
            <Switch checked={cfg.dmEnabled} onCheckedChange={set("dmEnabled")} data-testid="toggle-dm" />
          </div>
          {cfg.dmEnabled && (
            <div>
              <Label className="text-sm mb-1.5 block">Mensaje DM</Label>
              <Textarea placeholder="Mensaje privado de bienvenida" value={cfg.dmMessage || ""} onChange={(e) => set("dmMessage")(e.target.value)} rows={3} data-testid="textarea-dm-message" />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
