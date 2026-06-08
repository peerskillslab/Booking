// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { peerskillslab } from "@/api/peerskillslabClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyProfile() {
  const { user, navigateToLogin, checkAppState } = useAuth();
  const [fullName, setFullName] = useState("");
  const [studienjahr, setStudienjahr] = useState("1");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // success | error
  const [message, setMessage] = useState("");


  const handleDeleteAccount = () => {
    // Opens the user's email client with a pre-filled deletion request
    const subject = encodeURIComponent("Kontolöschung: " + (user?.email || ""));
    const body = encodeURIComponent(
      `Hallo,\n\nIch möchte mein Konto mit der E-Mail-Adresse "${user?.email}" dauerhaft löschen.\n\nBitte bestätigt mir die Löschung aller meiner Daten.\n\nFreundliche Grüsse`
    );
    window.location.href = `mailto:support@peerskillslab.ch?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    if (!user) {
      navigateToLogin();
      return;
    }
    setFullName(user.full_name || "");
    setStudienjahr((user.studienjahr || 1).toString());
  }, [user]);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      setStatus("error");
      setMessage("Name darf nicht leer sein.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await peerskillslab.auth.updateMe({
        full_name: fullName,
        studienjahr: parseInt(studienjahr)
      });
      await checkAppState();
      setStatus("success");
      setMessage("Profil erfolgreich aktualisiert!");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
      setStatus("error");
      setMessage("Fehler beim Speichern der Änderungen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Mein Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <Label className="text-muted-foreground">E-Mail</Label>
                <div className="mt-1.5 p-3 bg-muted rounded-lg text-foreground font-medium">
                  {user.email}
                </div>
              </div>

              {/* Full Name (editable) */}
              <div>
                <Label htmlFor="fullName">Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dein voller Name"
                  className="mt-1.5"
                />
              </div>

              {/* Studienjahr (editable) */}
              <div>
                <Label htmlFor="studienjahr">Studienjahr</Label>
                <Select value={studienjahr} onValueChange={setStudienjahr}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {[1, 2, 3, 4, 5, 6].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}. Jahr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {status === "success" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Speichert..." : "Änderungen speichern"}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="mt-6 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Konto löschen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Dein Konto und alle zugehörigen Daten werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Konto dauerhaft löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm mx-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Diese Aktion ist <strong className="text-foreground">unwiderruflich</strong>. Folgende Daten werden dauerhaft gelöscht:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Dein Profil und Kontozugang</li>
                          <li>Alle deine Kursbuchungen</li>
                          <li>Alle persönlichen Daten</li>
                        </ul>
                        <p>Klicke auf „Löschung beantragen", um eine E-Mail an unseren Support zu öffnen. Wir löschen dein Konto innerhalb von 48 Stunden.</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel className="mt-0">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Löschung beantragen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}