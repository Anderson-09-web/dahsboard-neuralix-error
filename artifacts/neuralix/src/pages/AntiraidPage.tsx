import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { ShieldAlert, TrendingDown, Zap } from "lucide-react";
import { useGetAntiraidConfig, useUpdateAntiraidConfig, useGetAntiraidStats, getGetAntiraidConfigQueryKey, getGetAntiraidStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ToggleModule from "@/components/ToggleModule";
import StatCard from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AntiraidPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: config, isLoading } = useGetAntiraidConfig(guildId, { query: { queryKey: getGetAntiraidConfigQueryKey(guildId), enabled: !!guildId } });
  const { data: stats } = useGetAntiraidStats(guildId, { query: { queryKey: getGetAntiraidStatsQueryKey(guildId), enabled: !!guildId } });
  const update = useUpdateAntiraidConfig();

  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => { if (config) setCfg(config); }, [config]);

  if (isLoading || !cfg) return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  const toggle = (key: string) => (val: boolean) => {
    const next = { ...cfg, [key]: val };
    setCfg(next);
    update.mutate({ guildId, data: { [key]: val } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetAntiraidConfigQueryKey(guildId) }),
      onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
    });
  };

  const setField = (key: string) => (val: any) => setCfg((c: any) => ({ ...c, [key]: val }));

  const saveAll = () => {
    update.mutate({ guildId, data: cfg }, {
      onSuccess: () => { toast({ title: "Configuracion guardada" }); qc.invalidateQueries({ queryKey: getGetAntiraidConfigQueryKey(guildId) }); },
      onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
    });
  };

  const modules = [
    { key: "antiAlt", title: "AntiAlt", desc: "Bloquea cuentas nuevas segun edad minima", badge: "Recomendado", children: (
      <div>
        <Label className="text-xs text-muted-foreground">Edad minima de cuenta (dias)</Label>
        <Input type="number" className="mt-1 w-32" value={cfg.antiAltMinAge} onChange={(e) => setField("antiAltMinAge")(Number(e.target.value))} data-testid="input-antialt-age" />
      </div>
    )},
    { key: "antiBot", title: "AntiBot", desc: "Bloquea bots no autorizados al unirse" },
    { key: "antiSpam", title: "AntiSpam", desc: "Limita la velocidad de mensajes por usuario", children: (
      <div>
        <Label className="text-xs text-muted-foreground">Mensajes maximos por intervalo</Label>
        <Input type="number" className="mt-1 w-32" value={cfg.antiSpamLimit} onChange={(e) => setField("antiSpamLimit")(Number(e.target.value))} data-testid="input-spam-limit" />
      </div>
    )},
    { key: "antiLinks", title: "AntiLinks", desc: "Bloquea enlaces no autorizados en mensajes" },
    { key: "antiMassMention", title: "AntiMassMention", desc: "Limita el numero de menciones por mensaje", children: (
      <div>
        <Label className="text-xs text-muted-foreground">Menciones maximas por mensaje</Label>
        <Input type="number" className="mt-1 w-32" value={cfg.massMentionLimit} onChange={(e) => setField("massMentionLimit")(Number(e.target.value))} data-testid="input-mention-limit" />
      </div>
    )},
    { key: "antiWebhook", title: "AntiWebhook", desc: "Previene la creacion masiva de webhooks" },
    { key: "antiChannelCreate", title: "AntiChannelCreate", desc: "Detecta creacion masiva de canales" },
    { key: "antiChannelDelete", title: "AntiChannelDelete", desc: "Detecta eliminacion masiva de canales" },
    { key: "antiChannelUpdate", title: "AntiChannelUpdate", desc: "Detecta modificaciones masivas de canales" },
    { key: "antiRoleCreate", title: "AntiRoleCreate", desc: "Detecta creacion masiva de roles" },
    { key: "antiRoleDelete", title: "AntiRoleDelete", desc: "Detecta eliminacion masiva de roles" },
    { key: "antiRoleUpdate", title: "AntiRoleUpdate", desc: "Detecta modificaciones masivas de roles" },
    { key: "antiEmojiCreate", title: "AntiEmojiCreate", desc: "Detecta creacion masiva de emojis" },
    { key: "antiEmojiDelete", title: "AntiEmojiDelete", desc: "Detecta eliminacion masiva de emojis" },
    { key: "antiBanMass", title: "AntiBanMass", desc: "Detecta baneos masivos por administradores" },
    { key: "antiKickMass", title: "AntiKickMass", desc: "Detecta expulsiones masivas por administradores" },
    { key: "antiNuke", title: "AntiNuke", desc: "Proteccion total contra destruccion del servidor", badge: "Premium" },
  ];

  return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">AntiRaid</h1>
          <p className="text-muted-foreground text-sm">Configura los {modules.length} modulos de proteccion contra raids.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={saveAll} disabled={update.isPending} data-testid="btn-save-antiraid">
            {update.isPending ? "Guardando..." : "Guardar todo"}
          </Button>
          <ToggleModule title="AntiRaid Global" enabled={cfg.enabled} onToggle={toggle("enabled")} />
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total detectado" value={stats.totalDetections} icon={<ShieldAlert className="w-5 h-5" />} color="red" />
          <StatCard label="Alts bloqueados" value={stats.blockedAlt} icon={<TrendingDown className="w-5 h-5" />} color="primary" />
          <StatCard label="Bots bloqueados" value={stats.blockedBot} icon={<Zap className="w-5 h-5" />} color="accent" />
          <StatCard label="Spam detectado" value={stats.blockedSpam} icon={<ShieldAlert className="w-5 h-5" />} color="yellow" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map(({ key, title, desc, badge, children }) => (
          <ToggleModule
            key={key}
            title={title}
            description={desc}
            enabled={!!cfg[key]}
            onToggle={toggle(key)}
            badge={badge}
            badgeColor={badge === "Premium" ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary"}
          >
            {children}
          </ToggleModule>
        ))}
      </div>
    </Layout>
  );
}
