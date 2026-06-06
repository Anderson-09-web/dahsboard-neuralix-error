import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useGetGoodbyeConfig, useUpdateGoodbyeConfig, useTestGoodbye, getGetGoodbyeConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function GoodbyePage() {
  const { guildId } = useParams<{ guildId: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: config, isLoading } = useGetGoodbyeConfig(guildId, { query: { queryKey: getGetGoodbyeConfigQueryKey(guildId), enabled: !!guildId } });
  const update = useUpdateGoodbyeConfig();
  const testGoodbye = useTestGoodbye();
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => { if (config) setCfg(config); }, [config]);

  if (isLoading || !cfg) return (
    <Layout guildId={guildId}><div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>
  );

  const set = (key: string) => (val: any) => setCfg((c: any) => ({ ...c, [key]: val }));

  const save = () => {
    update.mutate({ guildId, data: cfg }, {
      onSuccess: () => { toast({ title: "Despedidas guardadas" }); qc.invalidateQueries({ queryKey: getGetGoodbyeConfigQueryKey(guildId) }); },
      onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
    });
  };

  return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Sistema de Despedidas</h1>
          <p className="text-muted-foreground text-sm">Configura los mensajes de despedida cuando un miembro abandona.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => testGoodbye.mutate({ guildId }, { onSuccess: () => toast({ title: "Mensaje de prueba enviado" }) })} data-testid="btn-test-goodbye">Probar</Button>
          <Button size="sm" onClick={save} disabled={update.isPending} data-testid="btn-save-goodbye">Guardar</Button>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Label>Activar despedidas</Label>
            <Switch checked={cfg.enabled} onCheckedChange={set("enabled")} data-testid="toggle-goodbye-enabled" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Canal de despedidas (ID)</Label>
            <Input placeholder="ID del canal" value={cfg.channelId || ""} onChange={(e) => set("channelId")(e.target.value)} data-testid="input-goodbye-channel" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Mensaje de despedida</Label>
            <Textarea placeholder="Usa {user} para mencionar al miembro" value={cfg.message || ""} onChange={(e) => set("message")(e.target.value)} rows={4} data-testid="textarea-goodbye-message" />
            <p className="text-xs text-muted-foreground mt-1.5">Variables: {"{user}"}, {"{server}"}, {"{memberCount}"}</p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-sm">Embed</h3>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Usar embed</Label>
            <Switch checked={cfg.embedEnabled} onCheckedChange={set("embedEnabled")} data-testid="toggle-goodbye-embed" />
          </div>
          {cfg.embedEnabled && (
            <>
              <div>
                <Label className="text-sm mb-1.5 block">Titulo</Label>
                <Input placeholder="Titulo" value={cfg.embedTitle || ""} onChange={(e) => set("embedTitle")(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Descripcion</Label>
                <Textarea placeholder="Descripcion" value={cfg.embedDescription || ""} onChange={(e) => set("embedDescription")(e.target.value)} rows={3} />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
