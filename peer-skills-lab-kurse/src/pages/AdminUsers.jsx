// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Users, User, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const ROLES = [
  { value: "student", label: "Student:in" },
  { value: "tutor", label: "Tutor:in" },
  { value: "admin", label: "Admin" },
];

const roleBadgeClass = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  tutor: "bg-primary/10 text-primary border-primary/20",
  student: "bg-muted text-muted-foreground border-border",
};

export default function AdminUsers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    peerskillslab.auth.me().then((u) => {
      if (u?.role !== "admin") {
        window.location.href = "/";
      } else {
        setCurrentUser(u);
      }
    }).catch(() => peerskillslab.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => peerskillslab.entities.User.list("-created_date", 500),
    enabled: !!currentUser,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => peerskillslab.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setPendingRoleChange(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setPendingDelete(null);
    },
  });

  const filteredUsers = (group, role) => {
    let result = group;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    if (role === "student") {
      result = [...result].sort((a, b) => (a.studienjahr || 1) - (b.studienjahr || 1));
    }
    return result;
  };

  if (!currentUser) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="psl-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nutzerverwaltung</h1>
            <p className="text-muted-foreground mt-0.5">{users.length} registrierte Nutzer:innen</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {[
              { role: "tutor", label: "Tutor:innen" },
              { role: "admin", label: "Admins" },
              { role: "student", label: "Student:innen" },
            ].map(({ role, label }) => {
              const rawGroup = users.filter((u) => u.role === role);
              const group = filteredUsers(rawGroup, role);
              if (search && group.length === 0) return null;
              return (
                <div key={role}>
                  <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border">
                    {label} <span className="text-sm font-normal text-muted-foreground">({group.length})</span>
                  </h2>
                  {group.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Keine {label}</p>
                  ) : (
                    <div className="space-y-3">
                      {group.map((u, i) => (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Card className="border-border/60">
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                                    <span className="truncate">{u.full_name || "—"}</span>
                                    {u.studienjahr && (
                                      <span className="text-xs font-normal text-muted-foreground">{u.studienjahr}. Jahr</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Select
                                  value={u.role || "student"}
                                  onValueChange={(newRole) => {
                                    if (newRole === (u.role || "student")) return;
                                    setPendingRoleChange({ id: u.id, name: u.full_name || u.email, newRole });
                                  }}
                                  disabled={u.id === currentUser.id}
                                >
                                  <SelectTrigger className="w-36 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ROLES.map((r) => (
                                      <SelectItem key={r.value} value={r.value} className="text-xs">
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <button
                                  onClick={() => setPendingDelete({ id: u.id, name: u.full_name || u.email })}
                                  disabled={u.id === currentUser.id}
                                  title="Nutzer:in löschen"
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nutzer:in löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDelete?.name}</strong> wird unwiderruflich gelöscht. Alle Buchungen dieser Person bleiben in der Datenbank erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(pendingDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ja, löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role change confirmation dialog */}
      <AlertDialog open={!!pendingRoleChange} onOpenChange={(open) => { if (!open) setPendingRoleChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolle ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingRoleChange?.name}</strong> wird zur Rolle{" "}
              <strong>{ROLES.find((r) => r.value === pendingRoleChange?.newRole)?.label}</strong> geändert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateRoleMutation.mutate({ id: pendingRoleChange.id, role: pendingRoleChange.newRole })}>
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
