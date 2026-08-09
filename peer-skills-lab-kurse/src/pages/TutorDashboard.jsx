// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, CalendarPlus, Pencil, Trash2, Loader2, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import TemplateDialog from "@/components/tutor/TemplateDialog";
import PublishCourseDialog from "@/components/tutor/PublishCourseDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getCategoryOklch } from "@/lib/categoryStyles";

const CATEGORY_DEFAULTS = {
  "CST Abdomen": {
    short_description: "Repetition der Abdomenuntersuchung",
    description: "Im Repetitionskurs 'CST-Abdomen' wird die Untersuchung des Abdomens wiederholt. Neben den Grundlagen der Inspektion, Auskultation, Perkussion und Palpation werden auch spezielle Untersuchungen (z. B. bei Peritonitis oder Appendizitis) thematisiert. Ziel des Kurses ist es, eure praktischen Fertigkeiten zu festigen und euch ein fundiertes Verständnis für die differenzierte Abdomenuntersuchung zu vermitteln.",
    level: "Alle Studienjahre",
  },
  "CST HKL": {
    short_description: "Herzkreislauf-Untersuchung verstehen und üben",
    description: "Im Repetitionskurs 'CST-Herzkreislauf' werden die wesentlichen Untersuchungsmethoden des Herzens und des Kreislaufsystems wiederholt und vertieft. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, eure praktischen Fertigkeiten in der Untersuchung des kardiovaskulären Systems zu festigen.",
    level: "Alle Studienjahre",
  },
  "CST Gynäkologie": {
    short_description: "Gynäkologische Untersuchungen sicher durchführen",
    description: "Im Repetitionskurs CST-Gynäkologie werden gynäkologische Untersuchungen wiederholt. Dazu gehören die Brustuntersuchung sowie die Spekulumuntersuchung. Dabei gehen Sie alle Schritte strukturiert durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Gynäkologie zu festigen.",
    level: "Alle Studienjahre",
  },
  "CST Lunge": {
    short_description: "Lungenauskultation und Atemwegsuntersuchung",
    description: "Im Repetitionskurs 'CST-Lunge' wiederholen Sie die Untersuchung der Lunge und der Atemwege. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Untersuchung des respiratorischen Systems zu festigen.",
    level: "Alle Studienjahre",
  },
  "CST Neurologie": {
    short_description: "Neurologische Grunduntersuchung systematisch üben",
    description: "Neurologische Grunduntersuchung: Reflexe, Sensibilität, Koordination und Hirnnerven strukturiert üben.",
    level: "Alle Studienjahre",
  },
  "CST Bewegungsapparat": {
    short_description: "Gelenk- und Muskeluntersuchungen trainieren",
    description: "Untersuchung von Gelenken und Muskeln – orientiert an häufigen OSCE-Stationen und klinischen Tests.",
    level: "Alle Studienjahre",
  },
  "POCUS": {
    short_description: "Notfallsonografie und Ultraschallfertigkeiten",
    description: "E-FAST ist eine schnelle Ultraschalluntersuchung bei Traumapatienten, mit der sich freie Flüssigkeit im Abdomen, im Perikard und im Thorax sowie ein Pneumothorax nachweisen lassen. Sie ist lebensrettend in der Notfallversorgung. Bei POCUS Abdomen stehen die Gallenblase, die Nieren und die Harnblase im Mittelpunkt. Mithilfe standardisierter Untersuchungsschritte werden typische Krankheitsbilder erkannt. Aufbauend auf die Kurse 'E-FAST' und 'POCUS Abdomen' vermitteln wir theoretische und praktische Ultraschallfertigkeiten anhand der Untersuchung der Aorta, der Vena cava inferior sowie der tiefen Beinvenen. Durchführung einer sonografisch gesteuerten Punktion in 'in-plane'- und 'out-of-plane'-Technik werden geübt.",
    level: "Alle Studienjahre",
  },
  "Venenpunktion": {
    short_description: "Blutentnahme und periphere Venenkatheter anlegen",
    description: "In unserem Repetitionskurs zur Venenpunktion wiederholen wir die wichtigsten Grundlagen der Blutentnahme und der Anlage eines peripheren Venenkatheters. Dazu gehören auch das vorbereitende Gespräch, die Hygiene und die Technik. Ihr habt die Gelegenheit, an einem Modell zu üben. Der Kurs wird von erfahrenen Tutor:innen geleitet, die seit mehreren Jahren auch die Erstjahreskurse betreuen.",
    level: "Alle Studienjahre",
  },
  "YSSA": {
    short_description: "",
    description: "",
    level: "ab 4. Studienjahr",
  },
};

export default function TutorDashboard() {
  const [user, setUser] = useState(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    peerskillslab.auth.me().then((u) => {
      if (u.role !== "admin" && u.role !== "tutor") {
        window.location.href = "/";
        return;
      }
      setUser(u);
    }).catch(() => {
      peerskillslab.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["courseTemplates"],
    queryFn: () => peerskillslab.entities.CourseTemplate.list("-created_date"),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.CourseTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseTemplates() });
      toast({ title: "Vorlage gelöscht", duration: 2000 });
    },
    onError: (err) => {
      toast({
        title: "Fehler beim Löschen",
        description: err.data?.error || "Bitte versuche es später erneut.",
        variant: "destructive",
        duration: 3000
      });
    },
  });

  const missingCategories = Object.keys(CATEGORY_DEFAULTS).filter(
    (cat) => !templates.some((t) => t.category === cat)
  );

  const seedMutation = useMutation({
    mutationFn: async () => {
      for (const cat of missingCategories) {
        await peerskillslab.entities.CourseTemplate.create({
          title: cat,
          category: cat,
          ...CATEGORY_DEFAULTS[cat],
          duration_minutes: 60,
          max_participants: 10,
          session_count: 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courseTemplates() });
      toast({ title: `${missingCategories.length} Vorlagen erstellt`, duration: 3000 });
    },
    onError: (err) => {
      toast({
        title: "Fehler beim Erstellen",
        description: err.data?.error || "Bitte versuche es später erneut.",
        variant: "destructive",
        duration: 3000
      });
    },
  });

  const openCreateTemplate = () => { setEditingTemplate(null); setTemplateDialogOpen(true); };
  const openEditTemplate = (t) => { setEditingTemplate(t); setTemplateDialogOpen(true); };
  const openPublish = (t) => { setSelectedTemplate(t); setPublishDialogOpen(true); };

  if (!user) return null;

  return (
    <div className="psl-page">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{templates.length} Vorlagen</p>
        <div className="flex gap-2 flex-wrap">
          {user.role === "admin" && missingCategories.length > 0 && (
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              variant="secondary"
              size="sm"
            >
              {seedMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {seedMutation.isPending ? "Erstelle..." : `Fehlende Vorlagen erstellen (${missingCategories.length})`}
            </Button>
          )}
          {user.role === "admin" && (
            <Button onClick={openCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" /> Neue Vorlage
            </Button>
          )}
        </div>
      </div>

      {templatesLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">Noch keine Vorlagen</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {user.role === "admin"
              ? "Erstelle eine Vorlage, um daraus schnell Kurse auszuschreiben."
              : "Ein Admin muss zuerst Kursvorlagen erstellen."}
          </p>
          {user.role === "admin" && (
            <Button onClick={openCreateTemplate} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Erste Vorlage erstellen
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {templates.map((template, i) => (
            <motion.div key={template.id} className="h-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="h-full flex flex-col border-border/60 transition-colors">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground leading-tight truncate">{template.title}</h3>
                      {(() => {
                        const colors = getCategoryOklch(template.category);
                        return <Badge className="text-xs mt-1 border" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>{template.category}</Badge>;
                      })()}
                    </div>
                  </div>
                  {template.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{template.short_description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 mt-auto">
                    {template.duration_minutes && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{template.duration_minutes} Min.</span>
                    )}
                    {template.max_participants && (
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />max. {template.max_participants}</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button className="flex-1 sm:flex-1" onClick={() => openPublish(template)} title="Ausschreiben" style={{ height: 32, borderRadius: 9 }}>
                      <CalendarPlus className="w-3.5 h-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Ausschreiben</span>
                    </Button>
                    {user.role === "admin" && (
                      <>
                        <Button variant="outline" onClick={() => openEditTemplate(template)} style={{ height: 32, borderRadius: 9 }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="text-destructive hover:bg-destructive/10" style={{ height: 32, borderRadius: 9 }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
                              <AlertDialogDescription>„{template.title}" wird unwiderruflich gelöscht.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTemplateMutation.mutate(template.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        editingTemplate={editingTemplate}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["courseTemplates"] })}
      />

      {selectedTemplate && (
        <PublishCourseDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          template={selectedTemplate}
          user={user}
          onPublished={() => queryClient.invalidateQueries({ queryKey: ["tutorCourses", user?.email] })}
        />
      )}
    </div>
  );
}
