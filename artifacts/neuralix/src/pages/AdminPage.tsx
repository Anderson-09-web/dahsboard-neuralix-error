import { useState } from "react";
import { Settings, Users, FileText, Shield, BarChart3, Plus, Trash2, CheckCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const tabs = ["stats", "licenses", "blacklist", "announcements"] as const;
type Tab = typeof tabs[number];

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
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState("info");

  const handleCreateLicense = () => {
    createLicense.mutate({ data: { plan: newLicensePlan } }, {
      onSuccess: () => { toast({ title: "Licencia creada" }); qc.invalidateQueries({ queryKey: getGetLicensesQueryKey() }); }
    });
  };

  const handleRevoke = (id: number) => {
    revokeLicense.mutate({ id }, { onSuccess: () => { toast({ title: "Licencia revocada" }); qc.invalidateQueries({ queryKey: getGetLicensesQueryKey() }); } });
  };

  const handleBlacklist = () => {
    if (!blUserId || !blReason) { toast({ title: "Completa todos los campos", variant: "destructive" }); return; }
    addBlacklist.mutate({ data: { userId: blUserId, username: blUsername || blUserId, reason: blReason } }, {
      onSuccess: () => { toast({ title: "Anadido a blacklist" }); qc.invalidateQueries({ queryKey: getGetBlacklistQueryKey() }); setBlUserId(""); setBlUsername(""); setBlReason(""); }
    });
  };

  const handleAnnouncement = () => {
    if (!annTitle || !annContent) { toast({ title: "Completa todos los campos", variant: "destructive" }); return; }
    createAnnouncement.mutate({ data: { title: annTitle, content: annContent, type: annType, published: true } }, {
      onSuccess: () => { toast({ title: "Anuncio publicado" }); qc.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() }); setAnnTitle(""); setAnnContent(""); }
    });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1">Panel de Administracion Global</h1>
        <p className="text-muted-foreground text-sm">Gestion completa del sistema Neuralix.</p>
      </div>

      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} data-testid={`admin-tab-${t}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "stats" ? "Estadisticas" : t === "licenses" ? "Licencias" : t === "blacklist" ? "Blacklist" : "Anuncios"}
          </button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Servidores" value={stats.totalGuilds} icon={<Settings className="w-5 h-5" />} color="primary" />
          <StatCard label="Usuarios" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="accent" />
          <StatCard label="Tickets" value={stats.totalTickets} icon={<FileText className="w-5 h-5" />} color="green" />
          <StatCard label="Blacklist" value={stats.activeBlacklist} icon={<Shield className="w-5 h-5" />} color="red" />
          <StatCard label="Backups" value={stats.totalBackups} icon={<BarChart3 className="w-5 h-5" />} color="yellow" />
          <StatCard label="Premium" value={stats.premiumGuilds} icon={<CheckCircle className="w-5 h-5" />} color="accent" />
        </div>
      )}

      {tab === "licenses" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Crear licencia</h3>
            <div className="flex gap-3 flex-wrap">
              <Select value={newLicensePlan} onValueChange={setNewLicensePlan}>
                <SelectTrigger className="w-32" data-testid="select-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateLicense} disabled={createLicense.isPending} className="gap-2" data-testid="btn-create-license">
                <Plus className="w-4 h-4" /> Generar
              </Button>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-xl divide-y divide-border overflow-hidden">
            {!licenses?.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Sin licencias</div>
            ) : licenses.map((lic) => (
              <div key={lic.id} data-testid={`license-${lic.id}`} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{lic.key}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">{lic.plan}</span>
                    <span className={`text-xs ${lic.active ? "text-green-400" : "text-muted-foreground"}`}>{lic.active ? "Activa" : "Revocada"}</span>
                    {lic.guildId && <span className="text-xs text-muted-foreground">Guild: {lic.guildId}</span>}
                  </div>
                </div>
                {lic.active && (
                  <Button size="sm" variant="destructive" onClick={() => handleRevoke(lic.id)} data-testid={`btn-revoke-${lic.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "blacklist" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Agregar a blacklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Discord ID</Label>
                <Input placeholder="ID del usuario" value={blUserId} onChange={(e) => setBlUserId(e.target.value)} data-testid="input-bl-userid" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Nombre de usuario</Label>
                <Input placeholder="Username" value={blUsername} onChange={(e) => setBlUsername(e.target.value)} data-testid="input-bl-username" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Razon</Label>
              <Input placeholder="Razon del bloqueo" value={blReason} onChange={(e) => setBlReason(e.target.value)} data-testid="input-bl-reason" />
            </div>
            <Button onClick={handleBlacklist} disabled={addBlacklist.isPending} className="gap-2" data-testid="btn-add-blacklist">
              <Plus className="w-4 h-4" /> Agregar
            </Button>
          </div>
          <div className="bg-card border border-card-border rounded-xl divide-y divide-border overflow-hidden">
            {!blacklist?.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Blacklist vacia</div>
            ) : blacklist.map((entry) => (
              <div key={entry.id} data-testid={`bl-entry-${entry.id}`} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold">{entry.username}</p>
                  <p className="text-xs text-muted-foreground font-mono">{entry.userId}</p>
                  <p className="text-xs text-muted-foreground">{entry.reason}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  removeBlacklist.mutate({ userId: entry.userId }, {
                    onSuccess: () => { toast({ title: "Eliminado de blacklist" }); qc.invalidateQueries({ queryKey: getGetBlacklistQueryKey() }); }
                  });
                }} data-testid={`btn-remove-bl-${entry.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "announcements" && (
        <div className="space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Publicar anuncio</h3>
            <div>
              <Label className="text-sm mb-1.5 block">Titulo</Label>
              <Input placeholder="Titulo del anuncio" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} data-testid="input-ann-title" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Contenido</Label>
              <Textarea placeholder="Contenido del anuncio..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows={4} data-testid="textarea-ann-content" />
            </div>
            <Select value={annType} onValueChange={setAnnType}>
              <SelectTrigger className="w-36" data-testid="select-ann-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informacion</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="success">Exito</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAnnouncement} disabled={createAnnouncement.isPending} className="gap-2" data-testid="btn-publish-announcement">
              <Plus className="w-4 h-4" /> Publicar
            </Button>
          </div>
          <div className="space-y-3">
            {announcements?.map((ann) => (
              <div key={ann.id} data-testid={`ann-${ann.id}`} className="flex items-start justify-between p-5 bg-card border border-card-border rounded-xl">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ann.type === "info" ? "bg-primary/20 text-primary" : ann.type === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>{ann.type}</span>
                    {ann.published && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                  <h3 className="font-semibold text-sm">{ann.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{ann.content}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {
                  deleteAnnouncement.mutate({ id: ann.id }, {
                    onSuccess: () => { toast({ title: "Anuncio eliminado" }); qc.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() }); }
                  });
                }} data-testid={`btn-delete-ann-${ann.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
