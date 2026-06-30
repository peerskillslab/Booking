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
  const [email, setEmail] = useState("");
  const [studienjahr, setStudienjahr] = useState("1");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // success | error
  const [message, setMessage] = useState("");
  const [emailConfirmDialogOpen, setEmailConfirmDialogOpen] = useState(false);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null); // success | error
  const [passwordMessage, setPasswordMessage] = useState("");


  const handleChangePassword = async () => {
    // Validate
    if (!currentPassword.trim()) {
      setPasswordStatus("error");
      setPasswordMessage("Gib dein aktuelles Passwort ein.");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 8) {
      setPasswordStatus("error");
      setPasswordMessage("Neues Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMessage("Neue Passwörter stimmen nicht überein.");
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus(null);

    try {
      await peerskillslab.auth.updateMe({
        current_password: currentPassword,
        password: newPassword
      });
      setPasswordStatus("success");
      setPasswordMessage("Passwort erfolgreich geändert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus(null), 3000);
    } catch (error) {
      console.error("Fehler beim Passwort ändern:", error);
      const errorMsg = error.response?.data?.error || "Fehler beim Ändern des Passworts.";
      setPasswordStatus("error");
      setPasswordMessage(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

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
    setEmail(user.email || "");
    setStudienjahr((user.studienjahr || 1).toString());
  }, [user]);

  if (!user) {
    return null;
  }

  const attemptSave = () => {
    if (!fullName.trim()) {
      setStatus("error");
      setMessage("Name darf nicht leer sein.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus("error");
      setMessage("E-Mail darf nicht leer sein.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Gültige E-Mail-Adresse eingeben.");
      return;
    }

    // Prüfe, ob E-Mail geändert wurde
    if (trimmedEmail !== user?.email) {
      setEmailConfirmDialogOpen(true);
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    const trimmedEmail = email.trim();

    setLoading(true);
    setStatus(null);

    try {
      await peerskillslab.auth.updateMe({
        full_name: fullName,
        email: trimmedEmail,
        studienjahr: parseInt(studienjahr)
      });
      await checkAppState();
      setStatus("success");
      setMessage("Profil erfolgreich aktualisiert!");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
      const errorMsg = error.data?.error || "Fehler beim Speichern der Änderungen.";
      if (errorMsg === 'email_taken') {
        setMessage("E-Mail-Adresse ist bereits vergeben.");
      } else {
        setMessage(errorMsg);
      }
      setStatus("error");
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
              {/* Email (editable) */}
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Dies ist deine Login-E-Mail-Adresse.</p>
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
                onClick={attemptSave}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Speichert..." : "Änderungen speichern"}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Passwort ändern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div>
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Dein aktuelles Passwort"
                  className="mt-1.5"
                />
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                  className="mt-1.5"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Wiederhole dein neues Passwort"
                  className="mt-1.5"
                />
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {passwordStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      passwordStatus === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {passwordStatus === "success" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{passwordMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Change Password Button */}
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="w-full"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {passwordLoading ? "Ändert..." : "Passwort ändern"}
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

        {/* Email Change Confirmation Dialog */}
        <AlertDialog open={emailConfirmDialogOpen} onOpenChange={setEmailConfirmDialogOpen}>
          <AlertDialogContent className="max-w-sm mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>E-Mail-Adresse wirklich ändern?</AlertDialogTitle>
              <AlertDialogDescription>
                Deine E-Mail-Adresse ist dein Login-Passwort. Nach der Änderung musst du dich mit der neuen E-Mail-Adresse anmelden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel className="mt-0">Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setEmailConfirmDialogOpen(false); handleSave(); }}>
                Ja, E-Mail ändern
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}