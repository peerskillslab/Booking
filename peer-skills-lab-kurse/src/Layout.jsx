import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { peerskillslab } from "@/api/peerskillslabClient";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarCheck, Settings, LogOut, Menu, X, User, TrendingUp, PlusCircle, ArrowLeft, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

// Root pages that show the logo; anything else shows a Back button on mobile
const ROOT_PAGES = ["/", "/MyBookings", "/TutorDashboard", "/MyProfile", "/AdminCourses", "/AdminUsers", "/AdminStats", "/AboutUs", "/Datenschutz", "/Impressum"];

export default function Layout({ children, currentPageName }) {
  const { user, navigateToLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isRootPage = ROOT_PAGES.includes(location.pathname);

  const bottomTabs = [
    { label: "Kurse", path: "/", icon: BookOpen },
    { label: "Buchungen", path: "/MyBookings", icon: CalendarCheck },
    ...(user?.role === "admin" || user?.role === "tutor" ? [{ label: "Kurs ausschreiben", path: "/TutorDashboard", icon: PlusCircle }] : []),
    { label: "Profil", path: "/MyProfile", icon: User },
  ];

  const handleTabClick = (e, path) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navItems = user ? [
    { label: "Kurse", page: "Home", icon: BookOpen },
    { label: "Meine Buchungen", page: "MyBookings", icon: CalendarCheck },
    ...(user?.role === "admin" || user?.role === "tutor" ? [{ label: "Kurs ausschreiben", page: "TutorDashboard", icon: PlusCircle }] : []),
    ...(user?.role === "admin" ? [
      { label: "Verwaltung", page: "AdminCourses", icon: Settings },
      { label: "Nutzer:innen", page: "AdminUsers", icon: User },
      { label: "Statistiken", page: "AdminStats", icon: TrendingUp },
    ] : []),
  ] : [];


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 lg:h-20 flex items-center justify-between">
          {/* On mobile: show Back button on sub-pages, logo on root pages */}
          <div className="flex items-center">
            {!isRootPage && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-1 -ml-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Link to={createPageUrl("Home")} className="flex items-center">
              <img
                src="/images/PSL_Logo.jpeg.png"
                alt="Peer Skills Lab"
                className="h-10 md:h-12 lg:h-16 w-auto object-contain"
              />
            </Link>
            <Link to={createPageUrl("AboutUs")} className="hidden md:block ml-2">
              <Button
                variant={currentPageName === "AboutUs" ? "secondary" : "ghost"}
                size="sm"
                className="text-sm lg:text-base px-3"
              >
                <Info className="w-4 h-4 mr-1.5" />
                Über uns
              </Button>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Button
                  variant={currentPageName === item.page ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm lg:text-base px-3"
                >
                  <item.icon className="w-4 h-4 mr-1.5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!user && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#4A5A30", whiteSpace: "nowrap" }}>
                  Jetzt anmelden & Kurse buchen
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#466E0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            {user ? (
              <>
                <Link to="/MyProfile">
                  <Button variant="ghost" size="sm" className="text-sm lg:text-base px-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    {user.full_name || user.email}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => peerskillslab.auth.logout()}
                  className="text-muted-foreground"
                >
                  <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="text-sm lg:text-base px-3">Anmelden</Button>
              </Link>
            )}
          </div>

          {/* Mobile annotation - only when not logged in */}
          {!user && (
            <div className="md:hidden flex items-center gap-1">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4A5A30", whiteSpace: "nowrap" }}>
                Anmelden
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#466E0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 select-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/40 overflow-hidden"
            >
              <nav className="p-4 space-y-1">
                <Link to={createPageUrl("AboutUs")} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={currentPageName === "AboutUs" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Über uns
                  </Button>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={currentPageName === item.page ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  {user ? (
                    <>
                      <Link to="/MyProfile" onClick={() => setMobileMenuOpen(false)} className="w-full block">
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="w-4 h-4 mr-2" />
                          {user.full_name || user.email}
                        </Button>
                      </Link>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => peerskillslab.auth.logout()}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Abmelden
                      </Button>
                    </>
                  ) : (
                    <Link to="/login" className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Anmelden</Button>
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content - add bottom padding on mobile for tab bar */}
      <main style={{ paddingBottom: user ? 'calc(64px + env(safe-area-inset-bottom))' : undefined }}>
        {children}
      </main>

      {/* Global Footer – desktop only */}
      <footer className="hidden md:flex border-t border-border/40 px-14 py-8 justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
          <span>Peer Skills Lab</span>
          <Link to="/Datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
          <Link to="/Impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        </div>
        <span>Made with ♥ by med students.</span>
      </footer>

      {/* Bottom Tab Bar – mobile only */}
      {user && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/40 flex"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {bottomTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={(e) => handleTabClick(e, tab.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 select-none transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}