"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: isConnected ? "0 12px 0 10px" : "0 16px",
          borderRadius: 999,
          border: isConnected ? "1px solid var(--border-strong)" : "1px solid transparent",
          background: isConnected ? "var(--bg-card)" : "var(--accent-gradient)",
          color: isConnected ? "var(--text-primary)" : "white",
          cursor: "pointer",
          boxShadow: isConnected
            ? "0 10px 24px rgba(14, 8, 32, 0.16)"
            : "0 14px 38px rgba(109, 79, 255, 0.34)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = "translateY(-1px)";
          el.style.boxShadow = isConnected
            ? "0 14px 30px rgba(14, 8, 32, 0.24)"
            : "0 18px 44px rgba(109, 79, 255, 0.42)";
          if (isConnected) el.style.borderColor = "var(--accent-purple)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = isConnected
            ? "0 10px 24px rgba(14, 8, 32, 0.16)"
            : "0 14px 38px rgba(109, 79, 255, 0.34)";
          if (isConnected) el.style.borderColor = "var(--border-strong)";
        }}
      >
        {isConnected ? (
          <>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                boxShadow: "0 0 14px rgba(176, 106, 255, 0.55)",
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.02em",
              }}
            >
              {shortAddress}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>Connect Wallet</span>
        )}

        <span
          aria-hidden="true"
          style={{
            fontSize: 11,
            opacity: 0.8,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            minWidth: 280,
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid var(--border-default)",
            background: "color-mix(in srgb, var(--bg-surface) 82%, transparent)",
            boxShadow: "0 22px 70px rgba(8, 6, 20, 0.4)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 80,
          }}
        >
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid var(--border-default)",
              background: "linear-gradient(180deg, color-mix(in srgb, var(--accent-purple) 12%, transparent), transparent)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Wallet Access
            </div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {isConnected ? "Wallet Connected" : "Choose a wallet"}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              {isConnected
                ? "Manage your current session or disconnect safely."
                : "Select an available connector to continue into the app."}
            </div>
          </div>

          <div style={{ padding: 10, display: "grid", gap: 8 }}>
            {isConnected && address ? (
              <>
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-soft)",
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Active Wallet
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-pink), var(--accent-purple))",
                        boxShadow: "0 0 16px rgba(176, 106, 255, 0.45)",
                      }}
                    />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-primary)" }}>
                      {address}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                  style={{
                    height: 44,
                    borderRadius: 14,
                    border: "1px solid rgba(255, 96, 149, 0.2)",
                    background: "rgba(255, 96, 149, 0.08)",
                    color: "var(--accent-pink)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              connectors.map((connector) => (
                <button
                  key={connector.uid}
                  type="button"
                  onClick={() => {
                    connect({ connector });
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    minHeight: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "0 14px",
                    borderRadius: 16,
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-soft)",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, transform 0.2s ease, background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = "translateY(-1px)";
                    el.style.borderColor = "var(--accent-purple)";
                    el.style.background = "color-mix(in srgb, var(--accent-purple) 10%, var(--bg-soft))";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = "translateY(0)";
                    el.style.borderColor = "var(--border-default)";
                    el.style.background = "var(--bg-soft)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: "var(--accent-gradient-soft)",
                        border: "1px solid var(--border-default)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--text-primary)",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {(connector.name === "Injected" ? "W" : connector.name.charAt(0)).toUpperCase()}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {connector.name === "Injected" ? "Browser Wallet" : connector.name}
                      </div>
                      <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-secondary)" }}>
                        Secure connection via wallet provider
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Open</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
