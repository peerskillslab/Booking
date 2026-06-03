// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, CalendarPlus, Pencil, Trash2, Loader2, Users, Clock, Archive, Mail, Calendar } from "lucide-react";
import { downloadICalFile } from "@/lib/icalGenerator";
import { format, isPast, endOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import TemplateDialog from "@/components/tutor/TemplateDialog";
import PublishCourseDialog from "@/components/tutor/PublishCourseDialog";
import BookingsDialog from "@/components/tutor/BookingsDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from
"@/components/ui/alert-dialog";

export default function TutorDashboard() {
  const [user, setUser] = useState(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
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
    queryFn: () => peerskillslab.entities.CourseTemplate.list("-created_date")
  });

  const { data: myCourses = [], isLoading: coursesLoading, refetch: refetchCourses } = useQuery({
    queryKey: ["tutorCourses", user?.email],
    queryFn: async () => {
      const allCourses = await peerskillslab.entities.Course.list();
      return allCourses
        .filter(c => c.instructor === (user?.full_name || user?.email))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    },
    enabled: !!user
  });

  useEffect(() => {
    const unsubscribe = peerskillslab.entities.Course.subscribe(() => {
      setTimeout(() => refetchCourses(), 1000);
    });
    return unsubscribe;
  }, [refetchCourses]);

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.CourseTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courseTemplates"] })
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.Course.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tutorCourses", user?.email] })
  });

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const openPublish = (template) => {
    setSelectedTemplate(template);
    setPublishDialogOpen(true);
  };

  const openBookings = (course) => {
    setSelectedCourse(course);
    setBookingsDialogOpen(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Kurse ausschreiben</h1>
          <p className="text-muted-foreground mt-1">
            Willkommen, {user.full_name || user.email}
          </p>
        </div>

        <Tabs defaultValue="templates">
          <TabsList className="mb-6">
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Kursvorlagen
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4" /> Meine Kurse
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{templates.length} Vorlagen</p>
              {user.role === "admin" &&
              <Button onClick={openCreateTemplate}>
                  <Plus className="w-4 h-4 mr-2" /> Neue Vorlage
                </Button>
              }
            </div>

            {templatesLoading ?
            <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div> :
            templates.length === 0 ?
            <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Noch keine Vorlagen</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {user.role === "admin" ?
                "Erstelle eine Vorlage, um daraus schnell Kurse auszuschreiben." :
                "Ein Admin muss zuerst Kursvorlagen erstellen."}
                </p>
                {user.role === "admin" &&
              <Button onClick={openCreateTemplate} variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Erste Vorlage erstellen
                  </Button>
              }
              </div> :

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, i) =>
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                
                    <Card className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground leading-tight">{template.title}</h3>
                            <Badge variant="secondary" className="text-xs mt-1">{template.category}</Badge>
                          </div>
                        </div>
                        {template.short_description &&
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{template.short_description}</p>
                    }
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                          {template.duration_minutes &&
                      <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{template.duration_minutes} Min.
                            </span>
                      }
                          {template.max_participants &&
                      <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />max. {template.max_participants}
                            </span>
                      }

                        </div>
                        <div className="flex gap-2">
                          <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => openPublish(template)}>
                        
                            <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Ausschreiben
                          </Button>
                          {user.role === "admin" &&
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
                                    <AlertDialogDescription>
                                      „{template.title}" wird unwiderruflich gelöscht.
                                    </AlertDialogDescription>
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
                      }
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
              )}
              </div>
            }
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="courses">
            {coursesLoading ? (
            <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : myCourses.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <CalendarPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Noch keine Kurse ausgeschrieben</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gehe zu „Kursvorlagen" und schreibe deinen ersten Kurs aus.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming/Active Courses */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Kommende Kurse</h3>
                  {myCourses.filter((c) => !isPast(endOfDay(new Date(c.date)))).length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">Keine kommenden Kurse</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myCourses.filter((c) => !isPast(endOfDay(new Date(c.date)))).map((course, i) =>
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}>

                          <Card className="border-border/60">
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold truncate">{course.title}</span>
                                  <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                                  <Badge
                              className={`text-xs border ${
                              course.status === "active" ?
                              "bg-primary/10 text-primary border-primary/20" :
                              course.status === "cancelled" ?
                              "bg-destructive/10 text-destructive border-destructive/20" :
                              "bg-muted text-muted-foreground border-border"}`
                              }>

                                    {course.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {course.date &&
                            <span>{format(new Date(course.date), "dd.MM.yyyy", { locale: de })}</span>
                            }
                                  {course.time && <span>{course.time}</span>}
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {course.current_participants || 0}/{course.max_participants}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadICalFile(course)}
                              title="Zu Kalender hinzufügen">
                                  <Calendar className="w-3.5 h-3.5 mr-1" /> Kalendereintrag hinzufügen
                                </Button>
                                <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBookings(course)}>

                                  <Mail className="w-3.5 h-3.5 mr-1" /> Buchungen
                                </Button>
                                {(course.current_participants || 0) === 0 && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
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
                                      onClick={() => deleteCourseMutation.mutate(course.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90">

                                          Löschen
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                  )}
                    </div>
                  )}
                </div>

                {/* Past Courses */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Archive className="w-5 h-5" /> Vergangene Kurse
                  </h3>
                  {myCourses.filter((c) => isPast(endOfDay(new Date(c.date)))).length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">Keine vergangenen Kurse</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myCourses.filter((c) => isPast(endOfDay(new Date(c.date)))).map((course, i) =>
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}>

                          <Card className="border-border/60 opacity-75">
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold truncate text-muted-foreground">{course.title}</span>
                                  <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                                  <Badge className="text-xs border bg-muted text-muted-foreground border-border">
                                    Abgeschlossen
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {course.date &&
                            <span>{format(new Date(course.date), "dd.MM.yyyy", { locale: de })}</span>
                            }
                                  {course.time && <span>{course.time}</span>}
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {course.current_participants || 0}/{course.max_participants}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                  )}
                    </div>
                  )}
                </div>
              </div>
              )}
              </TabsContent>
        </Tabs>
      </div>

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        editingTemplate={editingTemplate}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["courseTemplates"] })} />
      

      {selectedTemplate &&
      <PublishCourseDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        template={selectedTemplate}
        user={user}
        onPublished={() => queryClient.invalidateQueries({ queryKey: ["tutorCourses", user?.email] })} />

      }

      {selectedCourse &&
      <BookingsDialog
        open={bookingsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCourse(null);
            queryClient.invalidateQueries({ queryKey: ["tutorCourses", user?.email] });
          }
          setBookingsDialogOpen(open);
        }}
        course={selectedCourse} />

      }

    </div>);

}