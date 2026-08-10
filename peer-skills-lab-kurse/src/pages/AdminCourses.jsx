// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

import { Loader2, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ParticipantsList from "../components/admin/ParticipantsList";
import { CATEGORIES, LEVELS } from "@/lib/courseConstants";
import {
  invalidateOnCourseCreate,
  invalidateOnCourseUpdate,
  invalidateOnCourseDelete,
} from "@/lib/invalidationStrategy";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";
import AdminCourseRow from "@/components/admin/AdminCourseRow";

const emptyCourse = {
  title: "", description: "", short_description: "", category: "CST Abdomen",
  instructor: "", date: "", time: "", duration_minutes: 60,
  max_participants: 10, location: "", image_url: "",
  level: "Alle Studienjahre", status: "active",
};

export default function AdminCourses() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [deleteError, setDeleteError] = useState(null);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyData, setNotifyData] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) peerskillslab.auth.redirectToLogin(window.location.href);
  }, [user, isLoadingAuth]);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: queryKeys.adminCourses(),
    queryFn: () => peerskillslab.entities.Course.list("date"),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: queryKeys.usersForInstructor(),
    queryFn: () => peerskillslab.entities.User.list("-created_date"),
    enabled: !!user,
  });

  const instructorOptions = useMemo(
    () => allUsers
      .filter((u) => (u.role === "tutor" || u.role === "admin") && u.full_name)
      .map((u) => u.full_name)
      .sort(),
    [allUsers]
  );

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCourse) {
        await peerskillslab.entities.Course.update(editingCourse.id, data);
      } else {
        await peerskillslab.entities.Course.create(data);
      }
    },
    onSuccess: (result, variables) => {
      if (editingCourse) {
        // Only invalidate affected queries on update
        const statusChanged = variables.status !== editingCourse.status;
        invalidateOnCourseUpdate(queryClient, editingCourse.id, statusChanged);
      } else {
        // On create, invalidate course lists
        invalidateOnCourseCreate(queryClient, variables.status || 'active');
      }
      toast({ title: editingCourse ? "Kurs gespeichert" : "Kurs erstellt", description: form.title, duration: 3000 });
      closeDialog();
    },
    onError: (err) => {
      toast({
        title: "Speichern fehlgeschlagen",
        description: err?.data?.error || "Bitte prüfe die Eingaben und versuche es erneut.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.Course.delete(id),
    onSuccess: (result, courseId) => {
      setDeleteError(null);
      invalidateOnCourseDelete(queryClient, courseId);
      toast({ title: "Kurs gelöscht", description: result.courseTitle, duration: 3000 });
      // Wenn es Teilnehmende gibt, Dialog öffnen mit Notifications-Info
      if (result.emails && result.emails.length > 0) {
        setNotifyData(result);
        setNotifyDialogOpen(true);
      }
    },
    onError: (err) => {
      const errData = err.data || {};
      if (errData.error === 'course_has_bookings') {
        setDeleteError('Kurs kann nicht gelöscht werden, solange noch Buchungen vorhanden sind.');
      } else {
        setDeleteError(errData.error || 'Fehler beim Löschen des Kurses.');
      }
    },
  });

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      short_description: course.short_description || "",
      category: course.category || "CST Abdomen",
      instructor: course.instructor || "",
      date: course.date || "",
      time: course.time || "",
      duration_minutes: course.duration_minutes || 60,
      max_participants: course.max_participants || 10,
      location: course.location || "",
      image_url: course.image_url || "",
      level: course.level || "Alle Studienjahre",
      status: course.status || "active",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
    setForm(emptyCourse);
  };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      max_participants: Number(form.max_participants),
      duration_minutes: Number(form.duration_minutes),
    });
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const filteredCourses = useMemo(() => courses.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesTitle = c.title?.toLowerCase().includes(q);
      const matchesTutor = c.instructor?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesTutor) return false;
    }
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (filterDate && c.date !== filterDate) return false;
    return true;
  }), [courses, search, filterCategory, filterDate]);

  // Kurse ohne Datum bekommen eine eigene Gruppe. Vorher fielen sie aus beiden
  // Listen (undefined >= s und undefined < s sind beide false), zählten aber im
  // Zähler mit — sie waren schlicht unerreichbar.
  const today = getTodayStr();
  const upcomingCourses = filteredCourses.filter((c) => c.date && c.date >= today);
  const pastCourses = filteredCourses.filter((c) => c.date && c.date < today);
  const undatedCourses = filteredCourses.filter((c) => !c.date);

  const hasFilters = search || filterCategory !== "all" || filterDate;

  const rowProps = {
    onShowParticipants: (course) => {
      setSelectedCourse(course);
      setParticipantsDialogOpen(true);
    },
    onEdit: openEdit,
    onDelete: (id) => deleteMutation.mutate(id),
    deleteError,
    onResetDeleteError: () => setDeleteError(null),
    isDeleting: deleteMutation.isPending,
  };

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="psl-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Kurse verwalten</h1>
            <p className="text-muted-foreground mt-1">{courses.length} Kurse insgesamt</p>
          </div>
        </div>

        {/* Filter-Zeile */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Titel oder Tutor suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ height: 40, borderRadius: 11 }}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48" style={{ height: 40, borderRadius: 11 }}><SelectValue placeholder="Alle Kategorien" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full sm:w-44"
            style={{ height: 40, borderRadius: 11 }}
          />
          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={() => { setSearch(""); setFilterCategory("all"); setFilterDate(""); }}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-muted-foreground">{filteredCourses.length} von {courses.length} Kursen</p>

            {upcomingCourses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-foreground">Kommende Kurse ({upcomingCourses.length})</h2>
                <div className="space-y-3">
                  {upcomingCourses.map((course, i) => (
                    <AdminCourseRow key={course.id} course={course} index={i} {...rowProps} />
                  ))}
                </div>
              </div>
            )}

            {undatedCourses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-foreground">Ohne Datum ({undatedCourses.length})</h2>
                <div className="space-y-3">
                  {undatedCourses.map((course, i) => (
                    <AdminCourseRow key={course.id} course={course} index={i} {...rowProps} />
                  ))}
                </div>
              </div>
            )}

            {pastCourses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Vergangene Kurse ({pastCourses.length})</h2>
                <div className="space-y-3 opacity-60">
                  {pastCourses.map((course, i) => (
                    <AdminCourseRow key={course.id} course={course} index={i} {...rowProps} />
                  ))}
                </div>
              </div>
            )}

            {filteredCourses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Keine Kurse gefunden</p>
            )}
          </div>
        )}

      {/* Participants Dialog */}
      <Dialog open={participantsDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setParticipantsDialogOpen(false);
          setSelectedCourse(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teilnehmende: {selectedCourse?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedCourse && (
              <ParticipantsList course={selectedCourse} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notify Participants Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teilnehmende benachrichtigen</DialogTitle>
          </DialogHeader>
          {notifyData && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-semibold">E-Mail-Adressen ({notifyData.emails.length})</Label>
                <textarea
                  readOnly
                  value={notifyData.emails.join('; ')}
                  className="mt-2 w-full h-20 p-2 border rounded text-xs font-mono bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(notifyData.emails.join('; '));
                    toast({ title: "E-Mails kopiert", duration: 2000 });
                  }}
                  className="mt-2"
                >
                  E-Mails kopieren
                </Button>
              </div>

              <div>
                <Label className="text-sm font-semibold">Nachrichtentext</Label>
                <textarea
                  readOnly
                  value={`Liebe Teilnehmende\n\nLeider muss der Kurs „${notifyData.courseTitle}" (${notifyData.courseDate}) abgesagt werden.\n\nWir entschuldigen uns für die Unannehmlichkeiten.\n\nFreundliche Grüsse\nPeer Skills Lab`}
                  className="mt-2 w-full h-32 p-2 border rounded text-sm bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = `Liebe Teilnehmende\n\nLeider muss der Kurs „${notifyData.courseTitle}" (${notifyData.courseDate}) abgesagt werden.\n\nWir entschuldigen uns für die Unannehmlichkeiten.\n\nFreundliche Grüsse\nPeer Skills Lab`;
                    navigator.clipboard.writeText(text);
                    toast({ title: "Text kopiert", duration: 2000 });
                  }}
                  className="mt-2"
                >
                  Text kopieren
                </Button>
              </div>

              <div
                className="rounded p-3 text-sm border"
                style={{ background: "var(--psl-accent-soft)", borderColor: "var(--psl-hairline-strong)" }}
              >
                <p className="font-semibold text-foreground">Wie versenden?</p>
                <p className="text-muted-foreground mt-1">1. E-Mail-Adressen kopieren → In dein E-Mail-Programm einfügen</p>
                <p className="text-muted-foreground">2. Text kopieren → In dein E-Mail-Programm einfügen</p>
                <p className="text-muted-foreground">3. Nachricht versenden</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kurs bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Titel *</Label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Kursleiter:in</Label>
                <Select value={form.instructor} onValueChange={(v) => updateField("instructor", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Person auswählen…" /></SelectTrigger>
                  <SelectContent>
                    {[...new Set([...instructorOptions, ...(form.instructor && !instructorOptions.includes(form.instructor) ? [form.instructor] : [])])].map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Kurzbeschreibung</Label>
              <Input value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="mt-1.5 h-24" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Kategorie *</Label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="cancelled">Abgesagt</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Uhrzeit</Label>
                <Input value={form.time} onChange={(e) => updateField("time", e.target.value)} placeholder="10:00 - 12:00" className="mt-1.5" />
              </div>
              <div>
                <Label>Dauer (Min.)</Label>
                <Input type="number" value={form.duration_minutes} onChange={(e) => updateField("duration_minutes", e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Max. Teilnehmer *</Label>
                <Input type="number" value={form.max_participants} onChange={(e) => updateField("max_participants", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Ort</Label>
                <Input value={form.location} onChange={(e) => updateField("location", e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Bild-URL</Label>
              <Input value={form.image_url} onChange={(e) => updateField("image_url", e.target.value)} placeholder="https://..." className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.date || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCourse ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}