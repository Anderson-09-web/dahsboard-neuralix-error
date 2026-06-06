import { useParams } from "wouter";
import { Database, Plus, RotateCcw, Clock } from "lucide-react";
import { useGetBackups, useCreateBackup, useRestoreBackup, getGetBackupsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BackupsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: backups, isLoading } = useGetBackups(guildId, { query: { queryKey: getGetBackupsQueryKey(guildId), enabled: !!guildId } });
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();

  const handleCreate = () => {
    createBackup.mutate({ guildId }, {
      onSuccess: () => { toast({ title: "Backup creado exitosamente" }); qc.invalidateQueries({ queryKey: getGetBackupsQueryKey(guildId) }); },
      onError: () => toast({ title: "Error al crear backup", variant: "destructive" }),
    });
  };

  const handleRestore = (backupId: number) => {
    restoreBackup.mutate({ guildId, backupId }, {
      onSuccess: () => toast({ title: "Backup restaurado" }),
      onError: () => toast({ title: "Error al restaurar", variant: "destructive" }),
    });
  };

  return (
    <Layout guildId={guildId}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Backups</h1>
          <p className="text-muted-foreground text-sm">Guarda y restaura la configuracion completa de tu servidor.</p>
        </div>
        <Button onClick={handleCreate} disabled={createBackup.isPending} className="gap-2" data-testid="btn-create-backup">
          <Plus className="w-4 h-4" />
          {createBackup.isPending ? "Creando..." : "Crear backup"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : !backups?.length ? (
        <div className="text-center py-24 bg-card rounded-xl border border-card-border">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Sin backups</h3>
          <p className="text-muted-foreground text-sm mb-6">Crea tu primer backup para guardar la configuracion actual.</p>
          <Button onClick={handleCreate} className="gap-2" data-testid="btn-create-first-backup">
            <Plus className="w-4 h-4" /> Crear primer backup
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {backups.map((backup, i) => (
            <motion.div key={backup.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              data-testid={`backup-row-${backup.id}`}
              className="flex items-center justify-between p-5 bg-card border border-card-border rounded-xl hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{backup.label}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(backup.createdAt).toLocaleString("es")}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatBytes(backup.size)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">v{backup.version}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRestore(backup.id)} disabled={restoreBackup.isPending} className="gap-2" data-testid={`btn-restore-${backup.id}`}>
                <RotateCcw className="w-4 h-4" />
                Restaurar
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
