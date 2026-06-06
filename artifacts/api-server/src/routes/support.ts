import { Router } from "express";
import { db, supportTicketsTable, supportMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/support/tickets", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const tickets = user.isOwner
    ? await db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt))
    : await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.userId, user.id)).orderBy(desc(supportTicketsTable.createdAt));
  res.json(tickets);
});

router.post("/support/tickets", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { subject, message, priority } = req.body;
  const [ticket] = await db.insert(supportTicketsTable).values({
    userId: user.id, username: user.username, subject, priority: priority || "normal",
  }).returning();

  await db.insert(supportMessagesTable).values({
    ticketId: ticket.id, userId: user.id, username: user.username,
    avatar: user.avatar, content: message, isStaff: false,
  });

  res.status(201).json(ticket);
});

router.get("/support/tickets/:id/messages", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const messages = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.ticketId, id)).orderBy(supportMessagesTable.createdAt);
  res.json(messages);
});

router.post("/support/tickets/:id/messages", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const id = Number(req.params.id);
  const { content } = req.body;
  const [msg] = await db.insert(supportMessagesTable).values({
    ticketId: id, userId: user.id, username: user.username,
    avatar: user.avatar, content, isStaff: user.isOwner,
  }).returning();
  res.status(201).json(msg);
});

export default router;
