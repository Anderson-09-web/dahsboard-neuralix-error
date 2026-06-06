import { Router } from "express";
import { db, blacklistTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireOwner } from "../lib/auth";

const router = Router();

router.get("/blacklist", requireOwner, async (req, res) => {
  const entries = await db.select().from(blacklistTable).orderBy(blacklistTable.createdAt);
  res.json(entries);
});

router.post("/blacklist", requireOwner, async (req, res) => {
  const { userId, username, reason } = req.body;
  const user = (req as any).user;
  const [entry] = await db.insert(blacklistTable).values({ userId, username, reason, addedBy: user.username }).returning();
  res.status(201).json(entry);
});

router.delete("/blacklist/:userId", requireOwner, async (req, res) => {
  await db.delete(blacklistTable).where(eq(blacklistTable.userId, req.params.userId));
  res.status(204).send();
});

export default router;
