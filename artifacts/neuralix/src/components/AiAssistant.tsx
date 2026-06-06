import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useAnalyzeGuild, useAiChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props { guildId: string; }

export default function AiAssistant({ guildId }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "analysis">("chat");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hola! Soy el asistente IA de Neuralix. Puedo ayudarte a configurar tu servidor, detectar problemas de seguridad y responder preguntas. Prueba 'Analizar Servidor' para un analisis completo." }
  ]);
  const [input, setInput] = useState("");
  const analyze = useAnalyzeGuild();
  const aiChat = useAiChat();

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    aiChat.mutate({ guildId, data: { message: userMsg } }, {
      onSuccess: (res) => {
        setMessages((m) => [...m, { role: "ai", content: res.response }]);
      }
    });
  };

  const handleAnalyze = () => {
    setTab("analysis");
    analyze.mutate({ guildId });
  };

  const severityIcon = (s: string) => {
    if (s === "high") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (s === "medium") return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (s === "info") return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Info className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Neuralix AI</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Beta</span>
              </div>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
            </div>

            <div className="flex border-b border-border">
              {(["chat", "analysis"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "chat" ? "Chat" : "Analisis"}
                </button>
              ))}
            </div>

            {tab === "chat" ? (
              <div className="flex flex-col h-72">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {aiChat.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-secondary px-3 py-2 rounded-lg text-xs text-muted-foreground">Pensando...</div>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    placeholder="Pregunta algo..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="text-xs h-8"
                    data-testid="ai-chat-input"
                  />
                  <Button size="sm" className="h-8 w-8 p-0" onClick={handleSend}>
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3 h-72 overflow-y-auto">
                {!analyze.data && !analyze.isPending && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">Analiza la seguridad y configuracion de tu servidor</p>
                    <Button size="sm" onClick={handleAnalyze} className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Analizar Servidor
                    </Button>
                  </div>
                )}
                {analyze.isPending && <div className="text-center text-sm text-muted-foreground py-4">Analizando servidor...</div>}
                {analyze.data && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Puntuacion</span>
                      <span className={`text-2xl font-bold ${analyze.data.score >= 80 ? "text-green-400" : analyze.data.score >= 60 ? "text-yellow-400" : "text-destructive"}`}>
                        {analyze.data.score}/100
                      </span>
                    </div>
                    <div className="space-y-2">
                      {analyze.data.recommendations.map((r, i) => (
                        <div key={i} className="flex gap-2 p-2 rounded-lg bg-secondary border border-border">
                          {severityIcon(r.severity)}
                          <div>
                            <div className="text-xs font-semibold">{r.title}</div>
                            <div className="text-xs text-muted-foreground">{r.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleAnalyze}>Re-analizar</Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-primary shadow-lg glow-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all"
        data-testid="ai-assistant-button"
      >
        <Bot className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
