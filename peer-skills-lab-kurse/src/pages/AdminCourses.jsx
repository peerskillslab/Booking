// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Users, Eye, Search, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import ParticipantsList from "../components/admin/ParticipantsList";

const CATEGORIES = ["CST Abdomen", "CST HKL", "CST Gynäkologie", "CST Lunge", "CST Neurologie", "CST Bewegungsapparat", "POCUS", "Venenpunktion", "YSSA"];
const LEVELS = ["Alle Studienjahre", "ab 1. Studienjahr", "ab 2. Studienjahr", "ab 3. Studienjahr", "ab 4. Studienjahr", "ab 5. Studienjahr", "ab 6. Studienjahr"];

const emptyCourse = {
  title: "", description: "", short_description: "", category: "CST Abdomen",
  instructor: "", date: "", time: "", duration_minutes: 60,
  max_participants: 10, location: "", image_url: "",
  level: "Alle Studienjahre", status: "active",
};

export default function AdminCourses() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    peerskillslab.auth.me().then(setUser).catch(() => {
      peerskillslab.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: courses = [], isLoading, refetch: refetchCourses } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: () => peerskillslab.entities.Course.list("date"),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["usersForInstructor"],
    queryFn: () => peerskillslab.entities.User.list("-created_date", 500),
    enabled: !!user,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["adminTemplates"],
    queryFn: () => peerskillslab.entities.CourseTemplate.list(),
    enabled: !!user,
  });

  const missingCategories = CATEGORIES.filter(
    (cat) => !templates.some((t) => t.category === cat)
  );

  const [seeding, setSeeding] = useState(false);
  const seedTemplates = async () => {
    setSeeding(true);
    for (const cat of missingCategories) {
      await peerskillslab.entities.CourseTemplate.create({
        title: cat,
        category: cat,
        level: "Alle Studienjahre",
        duration_minutes: 60,
        max_participants: 10,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["adminTemplates"] });
    queryClient.invalidateQueries({ queryKey: ["tutorTemplates"] });
    toast({ title: `${missingCategories.length} Vorlagen erstellt`, duration: 3000 });
    setSeeding(false);
  };
  const instructorOptions = allUsers
    .filter((u) => (u.role === "tutor" || u.role === "admin") && u.full_name)
    .map((u) => u.full_name)
    .sort();

  useEffect(() => {
    const unsubscribe = peerskillslab.entities.Course.subscribe(() => {
      setTimeout(() => refetchCourses(), 1000);
    });
    return unsubscribe;
  }, [refetchCourses]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCourse) {
        await peerskillslab.entities.Course.update(editingCourse.id, data);
      } else {
        await peerskillslab.entities.Course.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      queryClient.invalidateQueries({ queryKey: ["tutorCourses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ id: "course-save", title: editingCourse ? "Kurs gespeichert" : "Kurs erstellt", description: form.title, duration: 3000 });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.Course.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminCourses"] }),
  });

  const openCreate = () => {
    setEditingCourse(null);
    setForm(emptyCourse);
    setDialogOpen(true);
  };

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

  const dateIsInPast = !editingCourse && !!form.date && form.date < getTodayStr();

  const handleSave = () => {
    if (dateIsInPast) return;
    saveMutation.mutate({
      ...form,
      max_participants: Number(form.max_participants),
      duration_minutes: Number(form.duration_minutes),
    });
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const filteredCourses = courses.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesTitle = c.title?.toLowerCase().includes(q);
      const matchesTutor = c.instructor?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesTutor) return false;
    }
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (filterDate && c.date !== filterDate) return false;
    return true;
  });

  const today = getTodayStr();
  const upcomingCourses = filteredCourses.filter((c) => c.date >= today);
  const pastCourses = filteredCourses.filter((c) => c.date < today);

  const hasFilters = search || filterCategory !== "all" || filterDate;

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
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Alle Kategorien" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-44"
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
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-border/60">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {course.kurs_nr && (
                          <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">K-{String(course.kurs_nr).padStart(3, '0')}</span>
                        )}
                        <span className="font-semibold truncate">{course.title}</span>
                        <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                        <Badge
                          className={`text-xs border ${
                            course.status === "active"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : course.status === "cancelled"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {course.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {course.date && (
                          <span>{format(new Date(course.date), "dd.MM.yyyy", { locale: de })}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {course.current_participants || 0}/{course.max_participants}
                        </span>
                        {course.instructor && (
                          <span>Tutor: {course.instructor}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedCourse(course);
                        setParticipantsDialogOpen(true);
                      }}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> Teilnehmende
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(course)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Bearbeiten
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              „{course.title}" wird unwiderruflich gelöscht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(course.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
                  </motion.div>
                  ))}
                </div>
              </div>
            )}

            {pastCourses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Vergangene Kurse ({pastCourses.length})</h2>
                <div className="space-y-3 opacity-60">
                  {pastCourses.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="border-border/60">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {course.kurs_nr && (
                          <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">K-{String(course.kurs_nr).padStart(3, '0')}</span>
                        )}
                        <span className="font-semibold truncate">{course.title}</span>
                              <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                              <Badge
                                className={`text-xs border ${
                                  course.status === "active"
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : course.status === "cancelled"
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {course.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              {course.date && (
                                <span>{format(new Date(course.date), "dd.MM.yyyy", { locale: de })}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {course.current_participants || 0}/{course.max_participants}
                              </span>
                              {course.instructor && (
                                <span>Tutor: {course.instructor}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedCourse(course);
                              setParticipantsDialogOpen(true);
                            }}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Teilnehmende
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEdit(course)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Bearbeiten
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    „{course.title}" wird unwiderruflich gelöscht.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(course.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Löschen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
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
      <Dialog open={participantsDialogOpen} onOpenChange={() => {
        setParticipantsDialogOpen(false);
        setSelectedCourse(null);
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

      {/* Course Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Kurs bearbeiten" : "Neuen Kurs erstellen"}</DialogTitle>
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
                <Input type="date" value={form.date} min={!editingCourse ? getTodayStr() : undefined} onChange={(e) => updateField("date", e.target.value)} className={`mt-1.5 ${dateIsInPast ? "border-destructive" : ""}`} />
                {dateIsInPast && (
                  <p className="text-xs text-destructive mt-1">Datum darf nicht in der Vergangenheit liegen.</p>
                )}
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
            <Button onClick={handleSave} disabled={!form.title || !form.date || dateIsInPast || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCourse ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}