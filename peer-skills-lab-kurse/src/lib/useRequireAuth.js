import { useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useAuth } from "@/lib/AuthContext";

// Rollen-Prüfungen für useRequireAuth
export const isAdminUser = (u) => u.role === "admin";
export const isTutorOrAdmin = (u) => u.role === "admin" || u.role === "tutor";
export const canEditContent = (u) => u.role === "admin" && !!u.can_edit_content;

/**
 * Ohne Login → zur Anmeldung (mit Rücksprung), ohne passende Rolle → Kursübersicht.
 * `allowed(user)` ist optional. Gibt `user` und `isLoadingAuth` aus useAuth zurück.
 * Der eigentliche Schutz liegt im Backend; das hier spart nur leere Seiten.
 */
export function useRequireAuth(allowed) {
  const auth = useAuth();
  const { user, isLoadingAuth } = auth;

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      peerskillslab.auth.redirectToLogin(window.location.href);
    } else if (allowed && !allowed(user)) {
      window.location.href = "/";
    }
    // allowed ist pro Seite eine feste Funktion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoadingAuth]);

  return auth;
}
