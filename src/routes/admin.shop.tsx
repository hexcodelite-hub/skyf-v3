import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Coins, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { deleteSkin, upsertSkin, createSkinImageUploadUrl } from "@/lib/server-fns/admin.functions";
import { listActiveSkins } from "@/lib/server-fns/shop.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shop")({ component: AdminShop });

type Skin = { id: string; weapon: string; skin: string; wear: string | null; price_gems: number; image_url: string | null; stock: number; active: boolean };

function AdminShop() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["admin-shop"], queryFn: () => listActiveSkins() });
  const delFn = useServerFn(deleteSkin);
  const [editing, setEditing] = useState<Partial<Skin> | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Smazat skin?")) return;
    try { await delFn({ data: { id } }); toast.success("Smazáno"); qc.invalidateQueries({ queryKey: ["admin-shop"] }); qc.invalidateQueries({ queryKey: ["shop-skins"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Správa shopu</h1>
          <p className="text-sm text-muted-foreground">Přidej, uprav nebo smaž skiny. Změny se propíší okamžitě.</p>
        </div>
        <Button className="gap-2 bg-gradient-neon text-neon-foreground shadow-neon" onClick={() => setEditing({ weapon: "", skin: "", wear: "", price_gems: 100, stock: 1, active: true, image_url: "" })}>
          <Plus className="h-4 w-4" /> Přidat skin
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Náhled</th><th className="p-3">Skin</th>
              <th className="p-3 hidden md:table-cell">Wear</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-right">Cena</th>
              <th className="p-3 text-right">Akce</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3">
                  {s.image_url ? <img src={s.image_url} className="h-10 w-16 rounded object-cover" alt="" /> : <div className="h-10 w-16 rounded bg-gradient-to-br from-neon/30 to-gold/20" />}
                </td>
                <td className="p-3"><div className="font-semibold">{s.weapon} | {s.skin}</div></td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{s.wear ?? "—"}</td>
                <td className="p-3 text-right font-display font-bold">{s.stock}</td>
                <td className="p-3 text-right">
                  <span className="inline-flex items-center gap-1 font-display font-bold text-gold"><Coins className="h-3.5 w-3.5" /> {s.price_gems.toLocaleString("cs-CZ")}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Žádné skiny</td></tr>}
          </tbody>
        </table>
      </div>

      <EditDialog value={editing} onClose={() => setEditing(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-shop"] }); qc.invalidateQueries({ queryKey: ["shop-skins"] }); }} />
    </div>
  );
}

function EditDialog({ value, onClose, onSaved }: { value: Partial<Skin> | null; onClose: () => void; onSaved: () => void }) {
  const upsertFn = useServerFn(upsertSkin);
  const signFn = useServerFn(createSkinImageUploadUrl);
  const [form, setForm] = useState<Partial<Skin>>({});
  const [uploading, setUploading] = useState(false);

  useState(() => {}); // no-op
  // Reset when value changes
  if (value && form.id !== value.id && (value.id || !form.weapon)) {
    // simple sync via setState in render-safe way
    Promise.resolve().then(() => setForm(value));
  }

  const save = async () => {
    try {
      await upsertFn({ data: {
        id: form.id, weapon: form.weapon ?? "", skin: form.skin ?? "",
        wear: form.wear ?? null, price_gems: Number(form.price_gems ?? 0),
        image_url: form.image_url ?? null, stock: Number(form.stock ?? 0),
        active: form.active ?? true,
      }});
      toast.success("Uloženo");
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { path, token, publicUrl } = await signFn({ data: { filename: file.name } });
      const { error } = await supabase.storage.from("skins").uploadToSignedUrl(path, token, file);
      if (error) throw error;
      setForm((f) => ({ ...f, image_url: publicUrl }));
      toast.success("Obrázek nahrán");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{form.id ? "Upravit skin" : "Nový skin"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Zbraň</Label><Input value={form.weapon ?? ""} onChange={(e) => setForm({ ...form, weapon: e.target.value })} /></div>
            <div><Label>Skin</Label><Input value={form.skin ?? ""} onChange={(e) => setForm({ ...form, skin: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Wear</Label><Input value={form.wear ?? ""} onChange={(e) => setForm({ ...form, wear: e.target.value })} /></div>
            <div><Label>Cena (Gemy)</Label><Input type="number" value={form.price_gems ?? 0} onChange={(e) => setForm({ ...form, price_gems: parseInt(e.target.value, 10) || 0 })} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value, 10) || 0 })} /></div>
          </div>
          <div>
            <Label>Obrázek</Label>
            <div className="mt-1 flex items-center gap-3">
              {form.image_url && <img src={form.image_url} alt="" className="h-14 w-24 rounded object-cover" />}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:bg-surface">
                <Upload className="h-4 w-4" /> {uploading ? "Nahrávám…" : "Nahrát"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Aktivní v shopu</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button className="bg-gradient-neon text-neon-foreground shadow-neon" onClick={save}>Uložit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
