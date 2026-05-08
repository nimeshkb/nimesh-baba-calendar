import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Sparkles } from "lucide-react";

type Schedule = {
  id: string;
  date: string;
  time?: string;
  title: string;
  notes?: string;
};

const STORAGE_KEY = "nimeshbaba-calendar-schedules-v1";

function loadSchedules(): Schedule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSchedules(s: Schedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function App() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(fmtDate(today));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState({ title: "", time: "", notes: "" });

  useEffect(() => { setSchedules(loadSchedules()); }, []);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push({ day: d, date: fmtDate(new Date(viewYear, viewMonth, d)) });
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [viewYear, viewMonth]);

  const byDate = useMemo(() => {
    const m = new Map<string, Schedule[]>();
    for (const s of schedules) {
      const list = m.get(s.date) ?? [];
      list.push(s);
      m.set(s.date, list);
    }
    for (const list of m.values()) list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    return m;
  }, [schedules]);

  const daySchedules = byDate.get(selectedDate) ?? [];

  function openAdd() { setEditing(null); setForm({ title: "", time: "", notes: "" }); setDialogOpen(true); }
  function openEdit(s: Schedule) { setEditing(s); setForm({ title: s.title, time: s.time ?? "", notes: s.notes ?? "" }); setDialogOpen(true); }
  function save() {
    if (!form.title.trim()) return;
    const next = editing
      ? schedules.map(s => s.id === editing.id ? { ...s, title: form.title.trim(), time: form.time || undefined, notes: form.notes || undefined } : s)
      : [...schedules, { id: crypto.randomUUID(), date: selectedDate, title: form.title.trim(), time: form.time || undefined, notes: form.notes || undefined }];
    setSchedules(next); saveSchedules(next); setDialogOpen(false);
  }
  function remove(id: string) { const next = schedules.filter(s => s.id !== id); setSchedules(next); saveSchedules(next); }
  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }

  const todayStr = fmtDate(today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-soft via-background to-saffron-soft">
      <header className="border-b border-border/50 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-tight text-foreground">Nimesh Baba Darshan Calendar</h1>
              <p className="text-xs text-muted-foreground">Sacred schedules, beautifully kept</p>
            </div>
          </div>
          <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add schedule</Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-elegant backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="size-5" /></Button>
            <h2 className="font-display text-xl text-foreground">{MONTHS[viewMonth]} {viewYear}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="size-5" /></Button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS.map(d => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} className="aspect-square" />;
              const isToday = cell.date === todayStr;
              const isSelected = cell.date === selectedDate;
              const evs = byDate.get(cell.date) ?? [];
              return (
                <button key={cell.date} onClick={() => setSelectedDate(cell.date)}
                  className={[
                    "group relative flex aspect-square flex-col items-start justify-start rounded-lg p-2 text-left transition-all",
                    isSelected ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow" : "bg-background/50 hover:bg-saffron-soft hover:scale-[1.02]",
                    isToday && !isSelected ? "ring-2 ring-primary/60" : "",
                  ].join(" ")}>
                  <span className={["text-sm font-semibold", isSelected ? "" : "text-foreground"].join(" ")}>{cell.day}</span>
                  {evs.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1">
                      {evs.slice(0, 3).map(e => (
                        <span key={e.id} className={["size-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary"].join(" ")} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-elegant backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected</p>
              <h3 className="font-display text-lg text-foreground">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h3>
            </div>
            <Button size="sm" onClick={openAdd} className="gap-1"><Plus className="size-4" /> Add</Button>
          </div>

          {daySchedules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              No schedules yet. Add the first darshan.
            </div>
          ) : (
            <ul className="space-y-3">
              {daySchedules.map(s => (
                <li key={s.id} className="group rounded-lg border border-border/50 bg-background/60 p-4 transition-all hover:border-primary/40 hover:shadow-glow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {s.time && <p className="text-xs font-medium text-primary">{s.time}</p>}
                      <p className="truncate font-semibold text-foreground">{s.title}</p>
                      {s.notes && <p className="mt-1 text-sm text-muted-foreground">{s.notes}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="size-4 text-destructive" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Update schedule" : "Add schedule"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Morning Darshan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time (optional)</Label>
              <Input id="time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Location, devotees, special instructions..." />
            </div>
            <p className="text-xs text-muted-foreground">Date: {new Date(selectedDate + "T00:00:00").toLocaleDateString()}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Nimesh Baba Darshan Calendar · Schedules saved on your device
      </footer>
    </div>
  );
}
