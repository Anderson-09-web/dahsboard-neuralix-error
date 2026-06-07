import { useState } from "react";
import { Settings, Users, FileText, Shield, BarChart3, Plus, Trash2, CheckCircle, UserCheck, UserX, Edit2, X } from "lucide-react";
import {
  useGetAdminStats, useGetLicenses, useCreateLicense, useRevokeLicense,
  useGetBlacklist, useAddToBlacklist, useRemoveFromBlacklist,
  useGetAnnouncements, useCreateAnnouncement, useDeleteAnnouncement,
  getGetAdminStatsQueryKey, getGetLicensesQueryKey, getGetBlacklistQueryKey, getGetAnnouncementsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const tabs = ["stats", "licenses", "blacklist", "announcements", "admins"] as const;
type Tab = typeof tabs[number];

const TAB_LABELS: Record<Tab, string> = {
  stats: "Estadisticas",
  licenses: "Licencias",
  blacklist: "Blacklist",
  announcements: "Anuncios",
  admins: "Administradores",
};

const ALL_PERMISSIONS = [
  { id: "manage_licenses", label: "Gestionar licencias" },
  { id: "manage_blacklist", label: "Gestionar blacklist" },
  { id: "manage_announcements", label: "Gestionar anuncios" },
  { id: "view_stats", label: "Ver estadisticas" },
  { id: "manage_support", label: "Gestionar soporte" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: licenses } = useGetLicenses({ query: { queryKey: getGetLicensesQueryKey() } });
  const { data: blacklist } = useGetBlacklist({ query: { queryKey: getGetBlacklistQueryKey() } });
  const { data: announcements } = useGetAnnouncements({ query: { queryKey: getGetAnnouncementsQueryKey() } });

  const createLicense = useCreateLicense();
  const revokeLicense = useRevokeLicense();
  const addBlacklist = useAddToBlacklist();
  const removeBlacklist = useRemoveFromBlacklist();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [newLicensePlan, setNewLicensePlan] = useState("plus");
  const [blUserId, setBlUserId] = useState("");
  const [blUsername, setBlUsername] = useState("");
  const [blReason, setBlReason] = useState("");
  const [blEvidence, setBlEvidence] = useState("");
  const [selectedBl, setSelectedBl] = useState<any>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState("info");
  const [adminDiscordId, setAdminDiscordId] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPerms, setAdminPerms] = useState<string[]>(["view_stats"]);

  const handleCreateLicense = () => {
    createLicense.mutate({ data: { plan: newLicensePlan } }, {
      onSuccess: () => { toast({ title: "Licencia creada" }); qc.invalidateQueries({ queryKey: getGetLicensesQueryKey() }); }
    });
  };

  const handleRevoke = (id: number) => {
    revokeLicense.mutate({ id }, { onSuccess: () => { toast({ title: "Licencia revocada" }); qc.invalidateQueries({ queryKey: getGetLicensesQueryKey() }); } });
  };

  const handleBlacklist = () => {
    if (!blUserId || !blReason) { toast({ title: "ID y motivo son obligatorios", variant: "destructive" }); return; }
    const evidenceArr = blEvidence ? blEvidence.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    addBlacklist.mutate(
      { data: { userId: blUserId, username: blUsername || blUserId, reason: blReason, evidence: evidenceArr } as any },
      { onSuccess: () => { toast({ title: "Anadido a blacklist" }); qc.invalidateQueries({ queryKey: getGetBlacklistQueryKey() }); setBlUserId(""); setBlUsername(""); setBlReason(""); setBlEvidence(""); } }
    );
  };

  const handleAnnouncement = () => {
    if (!annTitle || !annContent) { toast({ title: "Completa titulo y contenido", variant: "destructive" }); return; }
    createAnnouncement.mutate({ data: { title: annTitle, content: annContent, type: annType, published: true } }, {
      onSuccess: () => { toast({ title: "Anuncio publicado" }); qc.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() }); setAnnTitle(""); setAnnContent(""); }
    });
  };

  const handleGrantAdmin = async () => {
    if (!adminDiscordId || !adminUsername) { toast({ title: "ID de Discord y nombre son obligatorios", variant: "destructive" }); return; }
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: adminDiscordId, username: adminUsername, permissions: adminPerms }),
      });
      if (!res.ok) throw new Error("Error");
      toast({ title: "Administrador anadido" });
      setAdminDiscordId(""); setAdminUsername(""); setAdminPerms(["view_stats"]);
    } catch {
      toast({ title: "Error al agregar administrador", variant: "destructive" });
    }
  };

  const togglePerm = (perm: string) => {
    setAdminPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1">Panel de Administracion</h1>
        <p className="text-muted-foreground text-sm">Control global de Neuralix. Acceso exclusivo para el Owner.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} data-testid={`admin-tab-${t}`}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Stats ── */}
      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["Servidores", stats?.totalGuilds || 0, "bg-primary/10 text-primary"],
              ["Usuarios", stats?.totalUsers || 0, "bg-accent/10 text-accent"],
              ["Tickets abiertos", (stats as any)?.openSupport || 0, "bg-green-500/10 text-green-400"],
              ["Blacklist", stats?.activeBlacklist || 0, "bg-red-500/10 text-red-400"],
              ["Premium activo", stats?.premiumGuilds || 0, "bg-yellow-500/10 text-yellow-400"],
              ["Backups totales", stats?.totalBackups || 0, "bg-blue-500/10 text-blue-400"],
              ["Admins secundarios", (stats as any)?.totalAdmins || 0, "bg-purple-500/10 text-purple-400"],
              ["Tickets Discord", (stats as any)?.totalTickets || 0, "bg-orange-500/10 text-orange-400"],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="bg-card border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-2xl font-black mt-1", cls as string)}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Licenses ── */}
      {tab === "licenses" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-sm">Generar nueva licencia</h3>
            <div className="flex gap-3">
              <Select value={newLicensePlan} onValueChange={setNewLicensePlan}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateLicense} disabled={createLicense.isPending} className="gap-2">
                <Plus className="w-4 h-4" /> Generar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {!licenses || licenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No hay licencias generadas</p>
            ) : licenses.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between bg-card border border-card-border rounded-xl px-5 py-3">
                <div>
                  <code className="text-xs font-mono text-primary">{l.key}</code>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{l.plan?.toUpperCase()}</span>
                    {l.guildId && <span className="text-xs text-muted-foreground">Asignada: {l.guildId}</span>}
                    {!l.guildId && <span className="text-xs text-muted-foreground">Sin asignar</span>}
                    <span className={cn("text-xs px-1.5 py-0.5 rounded", l.active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                      {l.active ? "Activa" : "Revocada"}
                    </span>
                  </div>
                </div>
                {l.active && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-8" onClick={() => handleRevoke(l.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Blacklist ── */}
      {tab === "blacklist" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm">Agregar a blacklist global</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Discord ID *</Label>
                <Input placeholder="123456789012345678" value={blUserId} onChange={(e) => setBlUserId(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Nombre de usuario</Label>
                <Input placeholder="Usuario#0" value={blUsername} onChange={(e) => setBlUsername(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Motivo completo *</Label>
              <Textarea placeholder="Describe detalladamente el motivo de la sancion..." value={blReason} onChange={(e) => setBlReason(e.target.value)} rows={3} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Evidencias (una por linea — URLs, descripciones)</Label>
              <Textarea placeholder={"https://cdn.discord.com/attachments/...\nhttps://media.discordapp.net/..."} value={blEvidence} onChange={(e) => setBlEvidence(e.target.value)} rows={3} />
            </div>
            <Button onClick={handleBlacklist} disabled={addBlacklist.isPending} className="gap-2">
              <Shield className="w-4 h-4" /> Agregar a blacklist
            </Button>
          </div>

          <div className="space-y-3">
            {!blacklist || blacklist.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Blacklist vacia</p>
            ) : blacklist.map((b: any) => (
              <div key={b.id}>
                <div
                  className={cn("bg-card border border-card-border rounded-xl px-5 py-4 cursor-pointer transition-colors hover:border-primary/30", selectedBl?.id === b.id && "border-primary/30")}
                  onClick={() => setSelectedBl(selectedBl?.id === b.id ? null : b)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <UserX className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{b.username}</p>
                        <p className="text-xs text-muted-foreground font-mono">{b.userId}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{b.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString("es")}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeBlacklist.mutate({ userId: b.userId }, { onSuccess: () => { toast({ title: "Eliminado de blacklist" }); qc.invalidateQueries({ queryKey: getGetBlacklistQueryKey() }); } }); }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedBl?.id === b.id && (
                  <div className="bg-secondary/50 border border-border rounded-xl mx-2 p-5 space-y-4 -mt-2 pt-6">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Motivo completo</p>
                      <p className="text-sm">{b.reason}</p>
                    </div>
                    {b.addedByUsername && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Moderador responsable</p>
                        <p className="text-sm">{b.addedByUsername}</p>
                      </div>
                    )}
                    {b.evidence && b.evidence.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Evidencias</p>
                        <div className="space-y-1">
                          {b.evidence.map((ev: string, i: number) => (
                            <a key={i} href={ev.startsWith("http") ? ev : undefined} target="_blank" rel="noopener noreferrer"
                              className={cn("block text-xs p-2 rounded-lg bg-card border border-card-border break-all", ev.startsWith("http") && "text-primary hover:underline")}>
                              {ev}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {b.sanctionHistory && b.sanctionHistory.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Historial de sanciones</p>
                        <div className="space-y-2">
                          {b.sanctionHistory.map((s: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 text-xs">
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">{s.action}</span>
                              <span className="text-muted-foreground">{s.reason}</span>
                              <span className="text-muted-foreground ml-auto flex-shrink-0">{s.by} · {new Date(s.at).toLocaleDateString("es")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Announcements ── */}
      {tab === "announcements" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm">Nuevo anuncio</h3>
            <div>
              <Label className="text-xs mb-1.5 block">Titulo</Label>
              <Input placeholder="Titulo del anuncio" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Contenido</Label>
              <Textarea placeholder="Contenido del anuncio..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows={4} />
            </div>
            <div className="flex gap-3">
              <Select value={annType} onValueChange={setAnnType}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="success">Exito</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAnnouncement} disabled={createAnnouncement.isPending} className="gap-2">
                <Plus className="w-4 h-4" /> Publicar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {!announcements || announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay anuncios publicados</p>
            ) : announcements.map((a: any) => (
              <div key={a.id} className="flex items-start justify-between bg-card border border-card-border rounded-xl px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", a.type === "info" ? "bg-blue-500/10 text-blue-400" : a.type === "warning" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400")}>{a.type}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded", a.published ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground")}>{a.published ? "Publicado" : "Borrador"}</span>
                  </div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-8 flex-shrink-0" onClick={() => deleteAnnouncement.mutate({ id: a.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() }) })}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Admins ── */}
      {tab === "admins" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm">Otorgar acceso administrativo</h3>
            <p className="text-xs text-muted-foreground">El usuario debe haber iniciado sesion en Neuralix al menos una vez para que los permisos sean reconocidos.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Discord ID *</Label>
                <Input placeholder="123456789012345678" value={adminDiscordId} onChange={(e) => setAdminDiscordId(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Nombre de usuario *</Label>
                <Input placeholder="Usuario" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Permisos</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Switch
                      checked={adminPerms.includes(p.id)}
                      onCheckedChange={() => togglePerm(p.id)}
                      className="scale-90"
                    />
                    <span className="text-muted-foreground">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleGrantAdmin} className="gap-2">
              <UserCheck className="w-4 h-4" /> Otorgar acceso
            </Button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-400 font-medium mb-1">Nota importante</p>
            <p className="text-xs text-amber-400/80">Los administradores secundarios no tienen acceso al panel de owner. Solo pueden realizar acciones segun los permisos que les otorgues aqui. Tu Discord ID (1237892993013387307) tiene acceso completo de Owner y no puede ser restringido.</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
