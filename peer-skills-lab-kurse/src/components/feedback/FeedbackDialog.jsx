import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function FeedbackDialog({ open, onOpenChange, course, user, onSubmitted }) {
  const [step, setStep] = useState("form");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setStep("form");
      setQ1("");
      setQ2("");
      setQ3(0);
      setQ4("");
    }
  }, [open]);

  const feedbackMutation = useMutation({
    mutationFn: () => {
      return peerskillslab.entities.CourseFeedback.create({
        course_id: course.id,
        course_title: course.title,
        instructor: course.instructor || "Unbekannt",
        q1_good: q1,
        q2_improve: q2,
        q3_helpful: q3,
        q4_recommend: q4,
      });
    },
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["feedbacks", course.id] });
      setTimeout(() => {
        onOpenChange(false);
        if (onSubmitted) onSubmitted();
      }, 2000);
    },
    onError: (err) => {
      alert(err?.message || "Fehler beim Speichern der Rückmeldung");
    },
  });

  const isValid = q3 > 0 && q4;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {step === "form" && !feedbackMutation.isPending ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Rückmeldung zu „{course.title}"</DialogTitle>
                <DialogDescription>
                  Deine Antworten helfen uns, den Kurs zu verbessern (anonym)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Q1 */}
                <div>
                  <Label className="text-sm font-medium">Was hat am Kurs besonders gut gefallen?</Label>
                  <Textarea
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    placeholder="Deine Gedanken..."
                    className="mt-1.5 min-h-20"
                  />
                </div>

                {/* Q2 */}
                <div>
                  <Label className="text-sm font-medium">Was könnte verbessert werden?</Label>
                  <Textarea
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    placeholder="Konstruktives Feedback..."
                    className="mt-1.5 min-h-20"
                  />
                </div>

                {/* Q3 - Stars */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Wie hilfreich war der Kurs für dein Studium?</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQ3(num)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            num <= q3
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4 - Radio Buttons */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Würdest du diesen Kurs weiterempfehlen?</Label>
                  <div className="space-y-2">
                    {["Ja", "Eher ja", "Eher nein", "Nein"].map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recommend"
                          value={option}
                          checked={q4 === option}
                          onChange={(e) => setQ4(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                <Button
                  onClick={() => feedbackMutation.mutate()}
                  disabled={!isValid || feedbackMutation.isPending}
                >
                  {feedbackMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Absenden
                </Button>
              </DialogFooter>
            </motion.div>
          ) : feedbackMutation.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold">Danke für deine Rückmeldung!</h3>
              <p className="text-sm text-muted-foreground">Deine Antworten helfen uns, besser zu werden.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
