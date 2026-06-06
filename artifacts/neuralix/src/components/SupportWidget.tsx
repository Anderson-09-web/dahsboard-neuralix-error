import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Ticket, Clock, MessageSquare } from "lucide-react";
import { useGetSupportTickets, useCreateSupportTicket, useGetSupportMessages, useSendSupportMessage, getGetSupportTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState as useS } from "react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "create" | "chat">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const qc = useQueryClient();

  const { data: tickets, isLoading } = useGetSupportTickets({ query: { queryKey: getGetSupportTicketsQueryKey(), enabled: open } });
  const createTicket = useCreateSupportTicket();
  const { data: messages } = useGetSupportMessages(selectedTicketId!, { query: { enabled: !!selectedTicketId } });
  const sendMessage = useSendSupportMessage();

  const handleCreate = () => {
    if (!subject || !message) return;
    createTicket.mutate({ data: { subject, message } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSupportTicketsQueryKey() });
        setSubject(""); setMessage(""); setView("list");
      }
    });
  };

  const handleSend = () => {
    if (!chatMsg || !selectedTicketId) return;
    sendMessage.mutate({ id: selectedTicketId, data: { content: chatMsg } }, {
      onSuccess: () => { setChatMsg(""); qc.invalidateQueries(); }
    });
  };

  return (
    <>
      <button
        data-testid="support-button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-sm font-medium"
      >
        <Ticket className="w-4 h-4" />
        <span className="hidden sm:inline">Soporte</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-16 right-4 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Centro de Soporte</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                {view === "list" && (
                  <div className="space-y-3">
                    <Button size="sm" className="w-full" onClick={() => setView("create")}>Abrir nuevo ticket</Button>
                    {isLoading ? (
                      <div className="text-center text-muted-foreground text-sm py-4">Cargando...</div>
                    ) : tickets?.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-4">No tienes tickets abiertos</div>
                    ) : (
                      <div className="space-y-2">
                        {tickets?.map((t) => (
                          <button key={t.id} onClick={() => { setSelectedTicketId(t.id); setView("chat"); }}
                            className="w-full text-left p-3 rounded-lg bg-secondary hover:bg-accent/10 transition-all border border-border">
                            <div className="text-sm font-medium truncate">{t.subject}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.status === "open" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>{t.status}</span>
                              <span className="text-xs text-muted-foreground">{t.priority}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {view === "create" && (
                  <div className="space-y-3">
                    <button onClick={() => setView("list")} className="text-xs text-muted-foreground hover:text-foreground">Volver</button>
                    <Input placeholder="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="input-subject" />
                    <Textarea placeholder="Describe tu problema..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} data-testid="textarea-message" />
                    <Button size="sm" className="w-full" onClick={handleCreate} disabled={createTicket.isPending}>
                      {createTicket.isPending ? "Enviando..." : "Crear ticket"}
                    </Button>
                  </div>
                )}

                {view === "chat" && (
                  <div className="space-y-3">
                    <button onClick={() => setView("list")} className="text-xs text-muted-foreground hover:text-foreground">Volver</button>
                    <div className="h-48 overflow-y-auto space-y-2">
                      {messages?.map((m) => (
                        <div key={m.id} className={`flex ${m.isStaff ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.isStaff ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Escribe un mensaje..." value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                      <Button size="sm" onClick={handleSend}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
