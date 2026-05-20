import React from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Star, MessageCircle } from "lucide-react";

export default function FeedbacksViewDialog({ open, onOpenChange, course }) {
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["feedbacks", course.id],
    queryFn: () => peerskillslab.entities.CourseFeedback.filter({ course_id: course.id }),
    enabled: open && !!course.id,
  });

  const avgHelpfulness = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.q3_helpful || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  const recommendCount = {
    "Ja": feedbacks.filter(f => f.q4_recommend === "Ja").length,
    "Eher ja": feedbacks.filter(f => f.q4_recommend === "Eher ja").length,
    "Eher nein": feedbacks.filter(f => f.q4_recommend === "Eher nein").length,
    "Nein": feedbacks.filter(f => f.q4_recommend === "Nein").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rückmeldungen zu „{course.title}"</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Noch keine Rückmeldungen</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-border/60 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Durchschnittliche Hilfreichkeit</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{avgHelpfulness}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i <= Math.round(avgHelpfulness)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Weiterempfehlung</p>
                    <div className="space-y-1 text-sm">
                      {Object.entries(recommendCount).map(([option, count]) => (
                        <div key={option} className="flex justify-between">
                          <span>{option}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
                  Insgesamt {feedbacks.length} {feedbacks.length === 1 ? "Rückmeldung" : "Rückmeldungen"}
                </p>
              </CardContent>
            </Card>

            {/* Individual Feedbacks */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Einzelne Rückmeldungen</h3>
              {feedbacks.map((feedback, i) => (
                <Card key={feedback.id} className="border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        Rückmeldung {i + 1}
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <Star
                            key={num}
                            className={`w-3.5 h-3.5 ${
                              num <= feedback.q3_helpful
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {feedback.q1_good && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          ✓ Was hat besonders gut gefallen?
                        </p>
                        <p className="text-sm whitespace-pre-line">{feedback.q1_good}</p>
                      </div>
                    )}

                    {feedback.q2_improve && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          ⚡ Was könnte verbessert werden?
                        </p>
                        <p className="text-sm whitespace-pre-line">{feedback.q2_improve}</p>
                      </div>
                    )}

                    {feedback.q4_recommend && (
                      <div className="pt-2 border-t border-border/40 text-xs">
                        <span className="text-muted-foreground">
                          Weiterempfehlung: <span className="font-medium text-foreground">{feedback.q4_recommend}</span>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
