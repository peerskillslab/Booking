import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, User } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryGradients = {
  "CST Abdomen": "from-blue-500/10 to-cyan-500/10",
  "CST HKL": "from-red-500/10 to-rose-500/10",
  "CST Gynäkologie": "from-pink-500/10 to-fuchsia-500/10",
  "CST Lunge": "from-sky-500/10 to-blue-500/10",
  "CST Neurologie": "from-purple-500/10 to-indigo-500/10",
  "CST Bewegungsapparat": "from-amber-500/10 to-orange-500/10",
  "POCUS": "from-teal-500/10 to-emerald-500/10",
  "Venenpunktion": "from-green-500/10 to-lime-500/10",
};

const categoryColors = {
  "CST Abdomen": "bg-blue-100 text-blue-700 border-blue-200",
  "CST HKL": "bg-red-100 text-red-700 border-red-200",
  "CST Gynäkologie": "bg-pink-100 text-pink-700 border-pink-200",
  "CST Lunge": "bg-sky-100 text-sky-700 border-sky-200",
  "CST Neurologie": "bg-purple-100 text-purple-700 border-purple-200",
  "CST Bewegungsapparat": "bg-amber-100 text-amber-700 border-amber-200",
  "POCUS": "bg-teal-100 text-teal-700 border-teal-200",
  "Venenpunktion": "bg-green-100 text-green-700 border-green-200",
};

function CourseCard({ course, index = 0 }) {
  const spotsLeft = (course.max_participants || 0) - (course.current_participants || 0);
  const isFull = spotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={createPageUrl("CourseDetail") + `?id=${course.id}`}>
        <Card className="group overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer">
          {/* Image area */}
          <div className={`relative h-44 bg-gradient-to-br ${categoryGradients[course.category] || categoryGradients.Sonstiges} overflow-hidden`}>
            {course.image_url ? (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl opacity-30">📚</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge className={`${categoryColors[course.category] || categoryColors.Sonstiges} border text-xs font-medium`}>
                {course.category}
              </Badge>
            </div>
            {course.level && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-xs">
                  {course.level}
                </Badge>
              </div>
            )}
            {isFull ? (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-destructive/90 text-white border-0 text-xs font-semibold">Ausgebucht</Badge>
              </div>
            ) : spotsLeft <= 3 ? (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-amber-500/90 text-white border-0 text-xs font-semibold">Nur noch {spotsLeft} {spotsLeft === 1 ? "Platz" : "Plätze"} frei</Badge>
              </div>
            ) : null}
          </div>

          <CardContent className="p-5">
            <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {course.title}
            </h3>
            {course.short_description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {course.short_description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {course.date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(course.date), "dd. MMMM yyyy", { locale: de })}</span>
                </div>
              )}
              {course.time && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{course.time}</span>
                </div>
              )}
              {course.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{course.location}</span>
                </div>
              )}
              {course.instructor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{course.instructor}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-border/60">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={`text-sm font-medium ${isFull ? "text-destructive" : "text-muted-foreground"}`}>
                {isFull ? "Ausgebucht" : `${spotsLeft} Plätze frei`}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default CourseCard;