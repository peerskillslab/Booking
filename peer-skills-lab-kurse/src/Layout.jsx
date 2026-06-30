import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";

// ── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d={d} />
  </svg>
);

const icons = {
  book:     "M4 5.5A1.5 1.5 0 0 1 5.5 4H13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 20.5z M4 17.5A1.5 1.5 0 0 1 5.5 16H14",
  bookmark: "M6 4.5h12v16l-6-4-6 4z",
  gear:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3",
  pencil:   "M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19z M14 7l3 3",
  users:    "M9 8a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 8z M3.5 19a5.5 5.5 0 0 1 11 0 M16 5.5a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-1.4-3.7",
  chart:    "M4 20V4M20 20H4 M7 12h3v5H7z M12 8h3v9h-3z M17 5h3v12h-3z",
  logout:   "M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l4-4-4-4M13 12H3",
  sun:      "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19 5l-1.8 1.8M6.8 17.2 5 19M19 19l-1.8-1.8M6.8 6.8 5 5",
  moon:     "M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z",
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19, flexShrink: 0 }}>
      {icons[name]?.split(" M ").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M " + seg} />
      ))}
    </svg>
  );
}


// ── Theme logic ───────────────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.documentElement.classList.toggle("dark", t === "dark");
}

function useTheme() {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("psl-theme") : null;
  const [theme, setThemeState] = useState(stored || "light");

  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("psl-theme", next);
      return next;
    });
  }, []);

  return [theme, toggle];
}

// ── Nav model ─────────────────────────────────────────────────────────────────
function navGroups(user) {
  return [
    {
      label: "Lernen",
      items: [
        { label: "Kurse",          path: "/",           icon: "book" },
        { label: "Meine Buchungen",path: "/MyBookings",  icon: "bookmark" },
        { label: "Meine Statistik",path: "/MyStats",     icon: "chart" },
      ],
    },
    ...(user?.role === "admin" || user?.role === "tutor" ? [{
      label: "Verwaltung",
      items: [
        { label: "Meine Kurse",       path: "/MeineKurse",     icon: "bookmark" },
        { label: "Kurs ausschreiben", path: "/TutorDashboard", icon: "pencil" },
        ...(user?.role === "admin" ? [
          { label: "Kurse verwalten", path: "/AdminCourses",   icon: "gear" },
          { label: "Nutzer:innen",    path: "/AdminUsers",     icon: "users" },
          { label: "Statistiken",     path: "/AdminStats",     icon: "chart" },
        ] : []),
      ],
    }] : []),
  ];
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();

  const groups = navGroups(user);
  const initials = user?.full_name
    ? user.full_name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const isDark = theme === "dark";

  return (
    <div className="psl-app">
      {/* ── Sidebar ── */}
      <aside className="psl-sidebar">
        {/* Brand */}
        <div className="psl-brand">
          <Logo size={40} />
          <div>
            <div className="psl-brand-name">Peer Skills Lab</div>
            <div className="psl-brand-sub">Clinical Skills Training</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="psl-nav">
          {groups.map(group => (
            <div key={group.label}>
              <div className="psl-nav-group-label">{group.label}</div>
              {group.items.map(item => {
                const active = location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path));
                return (
                  <Link key={item.path} to={item.path} style={{ textDecoration: "none" }} title={item.label}>
                    <div className={`psl-nav-item${active ? " active" : ""}`}>
                      <NavIcon name={item.icon} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="psl-sidebar-foot">
          <Link to="/MyProfile" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, textDecoration: "none", borderRadius: 7, padding: "2px 4px", margin: "-2px -4px", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--psl-fill)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span className="psl-avatar">{initials}</span>
            <div style={{ minWidth: 0 }}>
              <div className="psl-foot-name">{user?.full_name || user?.email || "Gast"}</div>
              <div className="psl-foot-role" style={{ textTransform: "capitalize" }}>
                {user?.role === "admin" ? "Admin" : user?.role === "tutor" ? "Tutor:in" : "Student:in"}
              </div>
            </div>
          </Link>
          <button className="psl-foot-btn" onClick={() => peerskillslab.auth.logout()} title="Abmelden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l4-4-4-4M13 12H3" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="psl-content">
        {/* Toolbar */}
        <div className="psl-toolbar">
          <span className="psl-tb-title">{{
    "Home": "Kurse",
    "CourseDetail": "Kursdetails",
    "MyBookings": "Meine Buchungen",
    "MyStats": "Meine Statistik",
    "AdminCourses": "Kurse verwalten",
    "MeineKurse": "Meine Kurse",
    "TutorDashboard": "Kurs ausschreiben",
    "AdminUsers": "Nutzer:innen",
    "AdminStats": "Statistiken",
    "MyProfile": "Profil",
  }[currentPageName] || currentPageName || "Peer Skills Lab"}</span>
          <span className="psl-tb-spacer" />
          <Link to="/AboutUs" title="Zur Startseite" style={{ display: "flex" }}>
            <button className="psl-tb-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
              </svg>
            </button>
          </Link>
          <div className="psl-tb-divider" />
          <button
            className="psl-tb-icon-btn"
            onClick={toggleTheme}
            title={isDark ? "Hell darstellen" : "Dunkel darstellen"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              {isDark
                ? <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19 5l-1.8 1.8M6.8 17.2 5 19M19 19l-1.8-1.8M6.8 6.8 5 5" />
                : <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />
              }
            </svg>
          </button>
        </div>

        {/* Page content */}
        <div className="psl-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}
