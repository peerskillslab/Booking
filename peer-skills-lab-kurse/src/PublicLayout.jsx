import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

function BrandMark({ size = 26 }) {
  return (
    <div className="psl-brand-mark" style={{ width: size, height: size, borderRadius: size * 0.27 }}>
      <svg viewBox="0 0 120 120" fill="none" className="psl-brand-glyph">
        <path d="M60 28 L102 46 L60 64 L18 46 Z" fill="currentColor" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
        <path d="M40 54 V68 C40 75, 80 75, 80 68 V54" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M95 50 L95 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <circle cx="95" cy="76" r="4.5" fill="currentColor" />
      </svg>
    </div>
  );
}

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

export default function PublicLayout({ children }) {
  const [theme, toggleTheme] = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: "var(--psl-content-bg)", fontFamily: "var(--psl-font)" }}>
      {/* Top bar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, padding: "0 20px",
        background: "var(--psl-sidebar-bg)",
        borderBottom: "0.5px solid var(--psl-hairline)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <BrandMark size={28} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--psl-text)", letterSpacing: "-0.01em" }}>
            PeerSkills Lab
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Helles Design" : "Dunkles Design"}
            style={{
              width: 28, height: 28, borderRadius: "50%", border: "none",
              background: "var(--psl-fill)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--psl-text-2)",
            }}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19 5l-1.8 1.8M6.8 17.2 5 19M19 19l-1.8-1.8M6.8 6.8 5 5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />
              </svg>
            )}
          </button>

          {/* Login button */}
          <Link
            to="/login"
            style={{
              height: 28, padding: "0 14px", borderRadius: 7, border: "none",
              background: "var(--psl-brand)", color: "#fff",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              textDecoration: "none", letterSpacing: "0.01em",
              boxShadow: "0 1px 4px rgba(0,0,0,.18)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l4-4-4-4M13 12H3" />
            </svg>
            Anmelden
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main>
        {children}
      </main>
    </div>
  );
}
