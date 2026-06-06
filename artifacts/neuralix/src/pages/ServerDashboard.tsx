import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Users, Ticket, Shield, ShieldAlert, Database, FileText, ExternalLink, AlertTriangle } from "lucide-react";
import { useGetGuild, useGetGuildStats, useGetGuildBotStatus, getGetGuildQueryKey, getGetGuildStatsQueryKey, getGetGuildBotStatusQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";

export default function ServerDashboard() {
  const { guildId } = useParams<{ guildId: string }>();
  const [, setLocation] = useLocation();

  const { data: guild, isLoading: guildLoading } = useGetGuild(guildId, { query: { queryKey: getGetGuildQueryKey(guildId), enabled: !!guildId } });
  const { data: stats, isLoading: statsLoading } = useGetGuildStats(guildId, { query: { queryKey: getGetGuildStatsQueryKey(guildId), enabled: !!guildId } });
  const { data: botStatus } = useGetGuildBotStatus(guildId, { query: { queryKey: getGetGuildBotStatusQueryKey(guildId), enabled: !!guildId } });

  if (guildLoading) return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout guildId={guildId} guildName={guild?.name} guildIcon={guild?.icon}>
      {/* Bot not present banner */}
      {botStatus && !botStatus.present && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-yellow-300">Bot no instalado</p>
              <p className="text-xs text-yellow-300/70">Agrega el bot al servidor para activar todas las funciones.</p>
            </div>
          </div>
          <a href={botStatus.addBotUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <ExternalLink className="w-4 h-4" />
              Agregar Bot
            </Button>
          </a>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {guild?.icon ? (
          <img src={`https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.png`} className="w-16 h-16 rounded-full" alt={guild.name} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">{guild?.name?.[0]}</span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black">{guild?.name || guildId}</h1>
          <p className="text-sm text-muted-foreground">Panel de control del servidor</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Miembros" value={stats?.memberCount?.toLocaleString() ?? "—"} icon={<Users className="w-5 h-5" />} color="primary" trend="Total en el servidor" />
        <StatCard label="Tickets abiertos" value={stats?.openTickets ?? "—"} icon={<Ticket className="w-5 h-5" />} color="accent" trend="Tickets activos" />
        <StatCard label="Detecciones AntiRaid" value={stats?.antiraidDetections ?? "—"} icon={<ShieldAlert className="w-5 h-5" />} color="red" trend="Total detectado" />
        <StatCard label="Backups" value={stats?.backupsCount ?? "—"} icon={<Database className="w-5 h-5" />} color="green" trend="Copias disponibles" />
      </div>

      {/* Quick access */}
      <h2 className="text-lg font-bold mb-4">Acceso rapido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: `/servers/${guildId}/antiraid`, icon: ShieldAlert, label: "AntiRaid", desc: "Configura los 20+ modulos de proteccion", color: "text-primary" },
          { href: `/servers/${guildId}/verification`, icon: Shield, label: "Verificacion", desc: "Filtra alts, bots y VPNs automaticamente", color: "text-accent" },
          { href: `/servers/${guildId}/tickets`, icon: Ticket, label: "Tickets", desc: "Gestiona el sistema de soporte", color: "text-green-400" },
          { href: `/servers/${guildId}/logs`, icon: FileText, label: "Logs", desc: "Revisa el historial de actividad", color: "text-yellow-400" },
          { href: `/servers/${guildId}/backups`, icon: Database, label: "Backups", desc: "Crea y restaura copias de seguridad", color: "text-primary" },
          { href: `/servers/${guildId}/welcome`, icon: Users, label: "Bienvenidas", desc: "Configura mensajes de entrada/salida", color: "text-accent" },
        ].map(({ href, icon: Icon, label, desc, color }) => (
          <button key={href} onClick={() => setLocation(href)}
            className="p-5 rounded-xl bg-card border border-card-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
            <Icon className={`w-6 h-6 mb-3 ${color} transition-transform group-hover:scale-110`} />
            <h3 className="font-semibold text-sm mb-1">{label}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </button>
        ))}
      </div>
    </Layout>
  );
}
