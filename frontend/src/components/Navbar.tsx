"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "./ConnectWallet";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/create", label: "Create" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/explorer", label: "Explorer" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border-default)",
        background: "color-mix(in srgb, var(--bg-surface) 82%, transparent)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          minHeight: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <img
              src="/logo_omnioracle.png"
              alt="OmniOracle Logo"
              style={{
                width: 34,
                height: 34,
                objectFit: "contain",
                display: "block",
                filter:
                  "drop-shadow(0 0 10px rgba(176,124,255,0.22)) drop-shadow(0 0 22px rgba(102,216,255,0.12))",
              }}
            />

            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                background: "var(--accent-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              OmniOracle
            </span>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: 4,
              borderRadius: 999,
              background: "var(--bg-soft)",
              border: "1px solid var(--border-default)",
              flexWrap: "wrap",
            }}
          >
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      padding: "9px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? "white" : "var(--text-secondary)",
                      transition: "all 0.18s ease",
                      letterSpacing: "-0.01em",
                      borderRadius: 999,
                      background: isActive ? "var(--accent-gradient)" : "transparent",
                      boxShadow: isActive
                        ? "0 12px 28px rgba(109, 79, 255, 0.28)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "var(--text-primary)";
                        el.style.background =
                          "color-mix(in srgb, var(--accent-purple) 9%, transparent)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "var(--text-secondary)";
                        el.style.background = "transparent";
                      }
                    }}
                  >
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <ThemeToggle />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
              height: 40,
              borderRadius: 999,
              border: "1px solid rgba(177, 120, 255, 0.22)",
              background:
                "linear-gradient(135deg, rgba(124, 77, 255, 0.12), rgba(255, 85, 187, 0.08))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-pink)",
                boxShadow: "0 0 12px rgba(255, 96, 149, 0.8)",
              }}
              className="dot-pulse"
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--accent-purple-soft)",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Base Sepolia
            </span>
          </div>

          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}