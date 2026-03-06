import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OmniOracle — Composable Prediction Markets",
  description: "Create prediction markets with custom oracle pipelines. Powered by 8 Chainlink services.",
  icons: {
    icon: "/logo_omnioracle.png",
    shortcut: "/logo_omnioracle.png",
    apple: "/logo_omnioracle.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.classList.toggle("light",t==="light");}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.classList.add("dark");}})();` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif", transition: "background 0.25s ease, color 0.25s ease" }}>

        {/* Subtle dot grid */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--text-primary) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Providers>
            <Navbar />
            <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
              {children}
            </main>

            {/* Footer */}
            <footer style={{
              borderTop: "1px solid var(--border-default)",
              marginTop: 80,
            }}>
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 16, color: "var(--accent-blue)", letterSpacing: "-0.03em" }}>OmniOracle</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>· Powered by Chainlink</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["CRE","CCIP","VRF","Functions","Data Feeds","Automation"].map(s => (
                    <span key={s} style={{
                      fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
                      padding: "3px 10px", borderRadius: 99,
                      background: "var(--bg-soft)",
                      border: "1px solid var(--border-default)",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.04em",
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            </footer>
          </Providers>
        </div>
      </body>
    </html>
  );
}
