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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courseTemplates"] }),
  });

  const openCreateTemplate = () => { setEditingTemplate(null); setTemplateDialogOpen(true); };
  const openEditTemplate = (t) => { setEditingTemplate(t); setTemplateDialogOpen(true); };
  const openPublish = (t) => { setSelectedTemplate(t); setPublishDialogOpen(true); };

  if (!user) return null;

  return (
    <div className="psl-page">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{templates.length} Vorlagen</p>
        {user.role === "admin" && (
          <Button onClick={openCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" /> Neue Vorlage
          </Button>
        )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, i) => (
            <motion.div key={template.id} className="h-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="h-full flex flex-col border-border/60 hover:border-primary/30 hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground leading-tight truncate">{template.title}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">{template.category}</Badge>
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
                    <Button className="flex-1 sm:flex-1" size="sm" onClick={() => openPublish(template)} title="Ausschreiben">
                      <CalendarPlus className="w-3.5 h-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Ausschreiben</span>
                    </Button>
                    {user.role === "admin" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEditTemplate(template)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
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
