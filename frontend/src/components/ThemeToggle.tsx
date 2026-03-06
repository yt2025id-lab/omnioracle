"use client";

import { useEffect, useState } from "react";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const next = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    setTheme(next);
    applyTheme(next);
    setReady(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      aria-label={ready ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={toggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 40,
        padding: "0 14px",
        borderRadius: 999,
        border: "1px solid var(--border-default)",
        background: "var(--theme-toggle-bg)",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "translateY(-1px)";
        el.style.borderColor = "var(--accent-purple)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "var(--border-default)";
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {theme === "dark" ? "☾" : "☀"}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
