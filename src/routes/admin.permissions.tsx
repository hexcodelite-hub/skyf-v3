import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Ban, ShieldCheck, UserX } from "lucide-react";
import { banUser, grantRole, listBans, listBanTemplates, listStaff, revokeRole, searchUsers, unbanUser } from "@/lib/server-fns/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/permissions")({ component: AdminPermissions });

const roleLabel: Record<string, string> = { owner: "Owner", admin: "Full admin", moderator: "Moderator" };

function AdminPermissions() {
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["admin-staff"], queryFn: () => listStaff() });
  const { data: bans = [] } = useQuery({ queryKey: ["admin-bans"], queryFn: () => listBans() });
  const { data: templates = [] } = useQuery({ queryKey: ["ban-templates"], queryFn: () => listBanTemplates() });
  const [userQ, setUserQ] = useState("");
  const { data: userResults = [] } = useQuery({ queryKey: ["admin-users-perm", userQ], queryFn: () => searchUsers({ data: { q: userQ } }), enabled: userQ.length > 0 });

  const grantFn = useServerFn(grantRole);
  const revokeFn = useServerFn(revokeRole);
  const banFn = useServerFn(banUser);
  const unbanFn = useServerFn(unbanUser);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [manualReason, setManualReason] = useState("");
  const [manualHours, setManualHours] = useState<string>("");

  const doGrant = async (userId: string, role: "admin" | "moderator") => {
    try { await grantFn({ data: { userId, role } }); toast.success("Přiděleno"); qc.invalidateQueries({ queryKey: ["admin-staff"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const doRevoke = async (userId: string, role: "admin" | "moderator" | "owner") => {
    try { await revokeFn({ data: { userId, role } }); toast.success("Odebráno"); qc.invalidateQueries({ queryKey: ["admin-staff"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const doBan = async (userId: string, kickName: string) => {
    const tmpl = templates.find((t: any) => t.id === selectedTemplate);
    const reason = tmpl?.reason ?? manualReason.trim();
    const hours = tmpl ? tmpl.duration_hours : (manualHours ? parseInt(manualHours, 10) : null);
    if (!reason) { toast.error("Vyber šablonu nebo napiš důvod"); return; }
    try { await banFn({ data: { userId, reason, durationHours: hours ?? null } }); toast.success(`Zabanován: ${kickName}`); qc.invalidateQueries({ queryKey: ["admin-bans"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const doUnban = async (userId: string) => {
    try { await unbanFn({ data: { userId } }); toast.success("Unban"); qc.invalidateQueries({ queryKey: ["admin-bans"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Práva & bany</h1>
        <p className="text-sm text-muted-foreground">Spravuj admin práva a banuj uživatele.</p>
      </div>

      {/* Staff */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-neon" />
          <h2 className="font-display text-lg font-bold">Tým</h2>
        </div>
        <div className="space-y-2">
          {staff.map((s: any) => (
            <div key={`${s.user?.id}-${s.role}`} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{s.user?.kick_name}</span>
                <Badge variant="outline" className={s.role === "owner" ? "border-gold/50 text-gold" : "border-neon/40 text-neon"}>{roleLabel[s.role]}</Badge>
              </div>
              {s.role !== "owner" && (
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => doRevoke(s.user.id, s.role)}>Odebrat</Button>
              )}
            </div>
          ))}
          {staff.length === 0 && <div className="text-sm text-muted-foreground">Zatím žádný tým</div>}
        </div>
      </div>

      {/* Ban / permission by user search */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Hledej uživatele</h2>
        <Input placeholder="Kick jméno..." value={userQ} onChange={(e) => setUserQ(e.target.value)} className="bg-surface-2" />
        <div className="mt-3 space-y-2">
          {userResults.map((u: any) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
              <span className="font-semibold">{u.kick_name}</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => doGrant(u.id, "moderator")}>+ Mod</Button>
                <Button size="sm" variant="outline" onClick={() => doGrant(u.id, "admin")}>+ Admin</Button>
                <Button size="sm" className="gap-1 bg-destructive text-destructive-foreground" onClick={() => doBan(u.id, u.kick_name)}>
                  <Ban className="h-3.5 w-3.5" /> Ban
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ban options */}
      <div className="rounded-xl border border-destructive/40 bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Ban className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-lg font-bold">Šablona banu</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Šablona</label>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
              <option value="">— Vlastní —</option>
              {templates.map((t: any) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vlastní důvod</label>
              <Input value={manualReason} onChange={(e) => setManualReason(e.target.value)} placeholder="Důvod..." className="mt-1 bg-surface-2" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hodin</label>
              <Input type="number" value={manualHours} onChange={(e) => setManualHours(e.target.value)} placeholder="perm" className="mt-1 bg-surface-2" />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Vyplň nastavení a stiskni Ban u konkrétního uživatele výše.</p>
      </div>

      {/* Active bans */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Aktivní bany</h2>
        <div className="space-y-2">
          {bans.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <div>
                <div className="font-semibold">{b.user?.kick_name}</div>
                <div className="text-xs text-muted-foreground">{b.reason} — {b.expires_at ? `do ${new Date(b.expires_at).toLocaleString("cs-CZ")}` : "trvale"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-destructive/40 text-destructive"><UserX className="mr-1 h-3 w-3" /> Banned</Badge>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-neon" onClick={() => doUnban(b.user.id)}>Unban</Button>
              </div>
            </div>
          ))}
          {bans.length === 0 && <div className="text-sm text-muted-foreground">Žádné aktivní bany</div>}
        </div>
      </div>
    </div>
  );
}
