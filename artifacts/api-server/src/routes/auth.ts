import { Router } from "express";
import axios from "axios";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";

const router = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

function getRedirectUri(req: any): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (domain) return `https://${domain}/api/auth/discord/callback`;
  return `http://localhost:80/api/auth/discord/callback`;
}

router.get("/auth/discord/url", (req, res) => {
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email guilds",
  });
  res.json({ url: `https://discord.com/api/oauth2/authorize?${params}` });
});

router.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.redirect("/?error=no_code");
    return;
  }
  try {
    const redirectUri = getRedirectUri(req);
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    const { access_token, refresh_token } = tokenRes.data;

    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const discordUser = userRes.data;

    const OWNER_IDS = (process.env.OWNER_DISCORD_IDS || "").split(",").filter(Boolean);
    const isOwner = OWNER_IDS.includes(discordUser.id);

    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.discordId, discordUser.id));
    let user;
    if (existingUsers.length > 0) {
      const [updated] = await db
        .update(usersTable)
        .set({
          username: discordUser.username,
          discriminator: discordUser.discriminator || "0",
          avatar: discordUser.avatar,
          email: discordUser.email,
          accessToken: access_token,
          refreshToken: refresh_token,
          isOwner,
        })
        .where(eq(usersTable.discordId, discordUser.id))
        .returning();
      user = updated;
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({
          id: `user_${discordUser.id}`,
          discordId: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator || "0",
          avatar: discordUser.avatar,
          email: discordUser.email,
          accessToken: access_token,
          refreshToken: refresh_token,
          isOwner,
        })
        .returning();
      user = created;
    }

    const token = signToken({ userId: user.id, discordId: user.discordId, isOwner: user.isOwner });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect("/servers");
  } catch (err: any) {
    req.log.error({ err }, "Discord OAuth error");
    res.redirect("/?error=oauth_failed");
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,
    email: user.email,
    isOwner: user.isOwner,
    isPremium: user.isPremium,
    premiumPlan: user.premiumPlan,
    createdAt: user.createdAt,
  });
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;
