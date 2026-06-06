import { useParams } from "wouter";
import { Star, Check, Crown, Zap, Shield } from "lucide-react";
import { useGetGuildPremium, useGetPremiumPlans, getGetGuildPremiumQueryKey, getGetPremiumPlansQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const planIcons: Record<string, any> = { plus: Zap, pro: Star, ultra: Crown };
const planColors: Record<string, string> = {
  plus: "border-primary/40 bg-primary/5",
  pro: "border-accent/40 bg-accent/5",
  ultra: "border-yellow-500/40 bg-yellow-500/5",
};

export default function PremiumPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data: premium } = useGetGuildPremium(guildId, { query: { queryKey: getGetGuildPremiumQueryKey(guildId), enabled: !!guildId } });
  const { data: plans } = useGetPremiumPlans({ query: { queryKey: getGetPremiumPlansQueryKey() } });

  return (
    <Layout guildId={guildId}>
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1">Premium</h1>
        <p className="text-muted-foreground text-sm">Desbloquea funciones avanzadas para tu servidor.</p>
      </div>

      {premium?.active && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-4">
          <Crown className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-yellow-300">Premium {premium.plan?.toUpperCase()} activo</p>
            <p className="text-sm text-yellow-300/70">
              {premium.expiresAt ? `Expira: ${new Date(premium.expiresAt).toLocaleDateString("es")}` : "Sin fecha de expiracion"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Plans */}
      {plans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const Icon = planIcons[plan.id] || Star;
            const isActive = premium?.plan === plan.id;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`rounded-xl border p-6 relative ${planColors[plan.id] || "border-card-border bg-card"} ${isActive ? "ring-2 ring-primary" : ""}`}>
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">Plan actual</div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{plan.name}</h3>
                    <p className="text-2xl font-black text-primary">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={isActive ? "secondary" : "default"} disabled={isActive} data-testid={`btn-plan-${plan.id}`}>
                  {isActive ? "Plan actual" : `Activar ${plan.name}`}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-5 rounded-xl bg-card border border-card-border">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Activar con codigo de licencia</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Si tienes un codigo de licencia, puedes activarlo directamente aqui.</p>
        <div className="flex gap-3">
          <input className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="NRX-PRO-XXXXXXXXXXXXXXXX" data-testid="input-license-key" />
          <Button size="sm" data-testid="btn-activate-license">Activar</Button>
        </div>
      </div>
    </Layout>
  );
}
