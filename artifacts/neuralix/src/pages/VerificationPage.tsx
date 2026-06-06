import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useGetVerificationConfig, useUpdateVerificationConfig, getGetVerificationConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ToggleModule from "@/components/ToggleModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function VerificationPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: config, isLoading } = useGetVerificationConfig(guildId, { query: { queryKey: getGetVerificationConfigQueryKey(guildId), enabled: !!guildId } });
  const update = useUpdateVerificationConfig();
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => { if (config) setCfg(config); }, [config]);

  if (isLoading || !cfg) return (
    <Layout guildId={guildId}><div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>
  );

  const set = (key: string) => (val: any) => setCfg((c: any) => ({ ...c, [key]: val }));

  const save = () => {
    update.mutate({ guildId, data: cfg }, {
      onSuccess: () => { toast({ title: "Verificacion guardada" }); qc.invalidateQueries({ queryKey: getGetVerificationConfigQueryKey(guildId) }); },
      onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
    });
  };

  return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Verificacion</h1>
          <p className="text-muted-foreground text-sm">Protege tu servidor con filtros de verificacion avanzados.</p>
        </div>
        <Button size="sm" onClick={save} disabled={update.isPending} data-testid="btn-save-verification">Guardar</Button>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold">Verificacion activa</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Los nuevos miembros deben pasar la verificacion para acceder</p>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={set("enabled")} data-testid="toggle-verification-enabled" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">ID del rol verificado</Label>
            <Input placeholder="ID del rol que se asignara al verificarse" value={cfg.roleId || ""} onChange={(e) => set("roleId")(e.target.value)} data-testid="input-verification-role" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Edad minima de cuenta (dias)</Label>
            <Input type="number" value={cfg.minAccountAge} onChange={(e) => set("minAccountAge")(Number(e.target.value))} className="w-32" data-testid="input-min-age" />
          </div>
        </div>

        <ToggleModule title="AntiVPN" description="Bloquea usuarios conectados via VPN o proxy" enabled={cfg.antiVpn} onToggle={set("antiVpn")} badge="Recomendado" />
        <ToggleModule title="AntiAlt" description="Bloquea cuentas que parecen ser alternativas" enabled={cfg.antiAlt} onToggle={set("antiAlt")} badge="Recomendado" />
        <ToggleModule title="AntiBot" description="Bloquea cuentas identificadas como bots" enabled={cfg.antiBot} onToggle={set("antiBot")} />

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-primary mb-2">Portal de Verificacion</h3>
          <p className="text-xs text-muted-foreground mb-3">Comparte este enlace para que los miembros se verifiquen:</p>
          <div className="flex gap-2">
            <Input readOnly value={`${window.location.origin}/verify?guild=${guildId}`} className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/verify?guild=${guildId}`)}>Copiar</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
