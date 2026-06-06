import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Ticket, CheckCircle, Clock, X } from "lucide-react";
import { useGetTicketConfig, useUpdateTicketConfig, useGetTickets, useCloseTicket, getGetTicketConfigQueryKey, getGetTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function TicketsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"config" | "list">("config");

  const { data: config, isLoading: configLoading } = useGetTicketConfig(guildId, { query: { queryKey: getGetTicketConfigQueryKey(guildId), enabled: !!guildId } });
  const { data: tickets, isLoading: ticketsLoading } = useGetTickets(guildId, { query: { queryKey: getGetTicketsQueryKey(guildId), enabled: !!guildId && tab === "list" } });
  const update = useUpdateTicketConfig();
  const closeTicket = useCloseTicket();
  const [cfg, setCfg] = useState<any>(null);

  useEffect(() => { if (config) setCfg(config); }, [config]);

  const set = (key: string) => (val: any) => setCfg((c: any) => ({ ...c, [key]: val }));

  const save = () => {
    update.mutate({ guildId, data: cfg }, {
      onSuccess: () => { toast({ title: "Tickets guardado" }); qc.invalidateQueries({ queryKey: getGetTicketConfigQueryKey(guildId) }); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  const handleClose = (ticketId: number) => {
    closeTicket.mutate({ guildId, ticketId }, { onSuccess: () => { toast({ title: "Ticket cerrado" }); qc.invalidateQueries({ queryKey: getGetTicketsQueryKey(guildId) }); } });
  };

  return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Sistema de Tickets</h1>
          <p className="text-muted-foreground text-sm">Gestiona el sistema de soporte de tu servidor.</p>
        </div>
        {tab === "config" && <Button size="sm" onClick={save} disabled={update.isPending} data-testid="btn-save-tickets">Guardar</Button>}
      </div>

      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit mb-6">
        {(["config", "list"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} data-testid={`tab-${t}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "config" ? "Configuracion" : "Tickets activos"}
          </button>
        ))}
      </div>

      {tab === "config" && cfg && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Sistema de tickets activo</Label>
              <Switch checked={cfg.enabled} onCheckedChange={set("enabled")} data-testid="toggle-tickets-enabled" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Categoria (ID)</Label>
              <Input placeholder="ID de la categoria de Discord" value={cfg.categoryId || ""} onChange={(e) => set("categoryId")(e.target.value)} data-testid="input-category" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Rol de soporte (ID)</Label>
              <Input placeholder="ID del rol de soporte" value={cfg.supportRoleId || ""} onChange={(e) => set("supportRoleId")(e.target.value)} data-testid="input-support-role" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Canal de transcripciones (ID)</Label>
              <Input placeholder="ID del canal para guardar transcripciones" value={cfg.transcriptChannelId || ""} onChange={(e) => set("transcriptChannelId")(e.target.value)} data-testid="input-transcript-channel" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Maximo de tickets por usuario</Label>
              <Input type="number" className="w-24" value={cfg.maxTicketsPerUser} onChange={(e) => set("maxTicketsPerUser")(Number(e.target.value))} data-testid="input-max-tickets" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Mensaje del panel</Label>
              <Textarea placeholder="Mensaje que se mostrara en el panel de tickets" value={cfg.panelMessage || ""} onChange={(e) => set("panelMessage")(e.target.value)} rows={3} data-testid="textarea-panel-message" />
            </div>
          </div>
        </div>
      )}

      {tab === "list" && (
        <div>
          {ticketsLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : !tickets?.length ? (
            <div className="text-center py-16 bg-card rounded-xl border border-card-border">
              <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No hay tickets</p>
              <p className="text-sm text-muted-foreground mt-1">Los tickets creados en Discord apareceran aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} data-testid={`ticket-row-${ticket.id}`} className="flex items-center justify-between p-4 bg-card border border-card-border rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${ticket.status === "open" ? "bg-green-400" : "bg-muted-foreground"}`} />
                    <div>
                      <p className="font-semibold text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">Por {ticket.username} · {new Date(ticket.createdAt).toLocaleDateString("es")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ticket.status === "open" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {ticket.status}
                    </span>
                    {ticket.status === "open" && (
                      <Button size="sm" variant="destructive" onClick={() => handleClose(ticket.id)} data-testid={`btn-close-ticket-${ticket.id}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
