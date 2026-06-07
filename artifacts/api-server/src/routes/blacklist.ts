import { Router } from "express";
import { db, blacklistTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireOwner } from "../lib/auth";

const router = Router();

router.get("/blacklist", requireOwner, async (_req, res) => {
  const entries = await db.select().from(blacklistTable).orderBy(blacklistTable.createdAt);
  res.json(entries);
});

router.post("/blacklist", requireOwner, async (req, res) => {
  const { userId, username, avatarHash, reason, evidence } = req.body;
  const user = (req as any).user;

  const existing = await db.select().from(blacklistTable).where(eq(blacklistTable.userId, userId as string));
  if (existing.length > 0) {
    const prev = existing[0];
    const history = [
      ...(prev.sanctionHistory || []),
      { action: "update", reason, by: user.username, at: new Date().toISOString() },
    ];
    const [updated] = await db
      .update(blacklistTable)
      .set({ username, avatarHash: avatarHash || null, reason, evidence: evidence || [], sanctionHistory: history, addedByUsername: user.username })
      .where(eq(blacklistTable.userId, userId as string))
      .returning();
    res.json(updated);
    return;
  }

  const [entry] = await db.insert(blacklistTable).values({
    userId: userId as string,
    username,
    avatarHash: avatarHash || null,
    reason,
    addedBy: user.discordId,
    addedByUsername: user.username,
    evidence: evidence || [],
    sanctionHistory: [{ action: "blacklist", reason, by: user.username, at: new Date().toISOString() }],
  }).returning();
  res.status(201).json(entry);
});

router.patch("/blacklist/:userId", requireOwner, async (req, res) => {
  const userId = req.params.userId as string;
  const { evidence, reason } = req.body;
  const user = (req as any).user;
  const existing = await db.select().from(blacklistTable).where(eq(blacklistTable.userId, userId));
  if (!existing.length) { res.status(404).json({ error: "No encontrado" }); return; }

  const prev = existing[0];
  const history = [
    ...(prev.sanctionHistory || []),
    { action: "update", reason: reason || "Actualizacion", by: user.username, at: new Date().toISOString() },
  ];
  const [updated] = await db
    .update(blacklistTable)
    .set({ ...(evidence !== undefined && { evidence }), ...(reason && { reason }), sanctionHistory: history })
    .where(eq(blacklistTable.userId, userId))
    .returning();
  res.json(updated);
});

router.delete("/blacklist/:userId", requireOwner, async (req, res) => {
  const userId = req.params.userId as string;
  await db.delete(blacklistTable).where(eq(blacklistTable.userId, userId));
  res.status(204).send();
});

export default router;
