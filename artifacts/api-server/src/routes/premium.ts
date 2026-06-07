import { Router } from "express";
import { db, guildConfigsTable, licensesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireOwner } from "../lib/auth";
import crypto from "crypto";

const router = Router();

const PLANS = [
  { id: "plus", name: "Plus", price: 4.99, features: ["5 backups", "AI Assistant", "Priority support", "Custom commands"] },
  { id: "pro", name: "Pro", price: 9.99, features: ["Unlimited backups", "Advanced AI", "Anti-Nuke protection", "Multi-panel", "API access"] },
  { id: "ultra", name: "Ultra", price: 19.99, features: ["Everything in Pro", "Dedicated support", "Custom integrations", "SLA guarantee", "Advanced analytics"] },
];

router.get("/guilds/:guildId/premium", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const [cfg] = await db.select().from(guildConfigsTable).where(eq(guildConfigsTable.guildId, guildId));
  const features = cfg?.premiumPlan ? PLANS.find((p) => p.id === cfg.premiumPlan)?.features || [] : [];
  res.json({
    guildId,
    active: cfg?.premiumActive || false,
    plan: cfg?.premiumPlan || null,
    expiresAt: cfg?.premiumExpiresAt?.toISOString() || null,
    features,
  });
});

router.get("/premium/plans", async (_req, res) => {
  res.json(PLANS);
});

router.get("/admin/licenses", requireOwner, async (_req, res) => {
  const licenses = await db.select().from(licensesTable).orderBy(licensesTable.createdAt);
  res.json(licenses);
});

router.post("/admin/licenses", requireOwner, async (req, res) => {
  const { plan, guildId, expiresAt } = req.body;
  const key = `NRX-${plan.toUpperCase()}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  const [license] = await db.insert(licensesTable).values({
    key, plan, guildId: guildId || null, active: true,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }).returning();
  res.status(201).json(license);
});

router.delete("/admin/licenses/:id", requireOwner, async (req, res) => {
  const id = Number(req.params.id as string);
  await db.update(licensesTable).set({ active: false }).where(eq(licensesTable.id, id));
  res.status(204).send();
});

export default router;
