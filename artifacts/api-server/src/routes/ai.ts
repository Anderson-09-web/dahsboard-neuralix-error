import { Router } from "express";
import Groq from "groq-sdk";
import { db, antiraidConfigsTable, verificationConfigsTable, ticketConfigsTable, logsConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// Initialize Groq client only if API key is present
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SYSTEM_PROMPT = `Eres el Asistente de IA de Neuralix, una plataforma enterprise de gestión de bots de Discord.
Ayudas a los administradores de servidores a configurar: AntiRaid, AntiNuke, Verificación, Tickets, Logs, Backups y seguridad general.
Responde siempre en español, de forma concisa y profesional. 
Si el usuario pregunta algo no relacionado con Discord o Neuralix, redirige amablemente hacia temas relevantes.
Máximo 3 párrafos por respuesta.`;

router.post("/guilds/:guildId/ai/analyze", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const [antiraid] = await db.select().from(antiraidConfigsTable).where(eq(antiraidConfigsTable.guildId, guildId));
  const [verification] = await db.select().from(verificationConfigsTable).where(eq(verificationConfigsTable.guildId, guildId));
  const [tickets] = await db.select().from(ticketConfigsTable).where(eq(ticketConfigsTable.guildId, guildId));
  const [logs] = await db.select().from(logsConfigsTable).where(eq(logsConfigsTable.guildId, guildId));

  const recommendations = [];
  let score = 100;

  if (!antiraid?.enabled) {
    recommendations.push({ category: "AntiRaid", severity: "high", title: "AntiRaid desactivado", description: "Activa AntiRaid para proteger tu servidor de ataques masivos." });
    score -= 20;
  }
  if (!antiraid?.antiNuke) {
    recommendations.push({ category: "AntiRaid", severity: "medium", title: "AntiNuke no configurado", description: "AntiNuke previene daños catastróficos causados por admins comprometidos." });
    score -= 10;
  }
  if (!verification?.enabled) {
    recommendations.push({ category: "Verificación", severity: "medium", title: "Verificación desactivada", description: "Activa la verificación de miembros para filtrar bots y cuentas alternativas." });
    score -= 10;
  }
  if (!verification?.antiVpn) {
    recommendations.push({ category: "Seguridad", severity: "low", title: "AntiVPN no habilitado", description: "Activa AntiVPN para bloquear usuarios que se conecten mediante proxy o VPN." });
    score -= 5;
  }
  if (!tickets?.enabled) {
    recommendations.push({ category: "Soporte", severity: "low", title: "Sistema de tickets desactivado", description: "Configura el sistema de tickets para gestionar las solicitudes de soporte eficientemente." });
    score -= 5;
  }
  if (!logs?.enabled) {
    recommendations.push({ category: "Logs", severity: "medium", title: "Registros desactivados", description: "Activa los logs para rastrear toda la actividad del servidor y acciones de moderación." });
    score -= 10;
  }
  if (recommendations.length === 0) {
    recommendations.push({ category: "General", severity: "info", title: "Servidor bien configurado", description: "La configuración de seguridad de tu servidor se ve bien. Sigue monitoreando los cambios." });
  }

  res.json({
    guildId,
    score: Math.max(0, score),
    recommendations,
    summary: `Puntuación de seguridad: ${Math.max(0, score)}/100. Se encontraron ${recommendations.length} recomendacion(es).`,
    analyzedAt: new Date().toISOString(),
  });
});

router.post("/guilds/:guildId/ai/chat", requireAuth, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "El mensaje es requerido" });
    return;
  }

  // Use Groq if available, otherwise fall back to static responses
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";
      const suggestions = ["¿Cómo activo AntiRaid?", "Configurar verificación", "Sistema de tickets", "Analizar seguridad del servidor"];

      res.json({ response, suggestions });
      return;
    } catch (err: any) {
      req.log.error({ err }, "Groq AI chat error");
      // Fall through to static responses on error
    }
  }

  // Static fallback responses
  const responses: Record<string, string> = {
    antiraid: "Para proteger tu servidor de raids, activa el módulo AntiRaid y configura AntiAlt para requerir cuentas con más de 7 días de antigüedad. También activa AntiBot para bloquear cuentas automatizadas.",
    verification: "Configura el sistema de verificación asignando un rol post-verificación, habilitando AntiVPN y estableciendo una antigüedad mínima de cuenta.",
    tickets: "Crea un panel de tickets configurando la categoría, el rol de soporte y el canal de transcripciones. Los usuarios podrán abrir tickets directamente en Discord.",
    premium: "Neuralix Premium ofrece IA avanzada, backups ilimitados y protección AntiNuke. Consulta la sección Premium para ver las opciones de plan.",
    default: "Soy el Asistente de IA de Neuralix. Puedo ayudarte a configurar la seguridad, tickets, verificación y más de tu servidor. Pregúntame sobre cualquier función.",
  };

  const lower = message.toLowerCase();
  let response = responses.default;
  if (lower.includes("raid") || lower.includes("ataque")) response = responses.antiraid;
  else if (lower.includes("verif")) response = responses.verification;
  else if (lower.includes("ticket")) response = responses.tickets;
  else if (lower.includes("premium")) response = responses.premium;

  const suggestions = ["¿Cómo activo AntiRaid?", "Configurar verificación", "Sistema de tickets", "Analizar seguridad del servidor"];
  res.json({ response, suggestions });
});

export default router;
