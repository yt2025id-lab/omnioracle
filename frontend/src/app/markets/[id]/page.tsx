"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS, FACTORY_ABI, PipelineLabel, CategoryLabel, StatusLabel, OutcomeLabel } from "@/lib/contracts";

const PIPE_NODES: Record<number,{steps:string[];colors:string[]}> = {
  0:{steps:["Data Feed","Threshold","Resolve"],colors:["var(--accent-blue)","#f59e0b","#00e5a0"]},
  1:{steps:["Data Stream","Real-time","Resolve"],colors:["#ff6b2b","#ea580c","#00e5a0"]},
  2:{steps:["Functions JS","API Call","Parse","Resolve"],colors:["#e040fb","#db2777","#be185d","#00e5a0"]},
  3:{steps:["Gemini AI","Web Search","Verify","Resolve"],colors:["#06d6f0","#0891b2","#0e7490","#00e5a0"]},
  4:{steps:["Data Feed","Gemini AI","Consensus","Resolve"],colors:["var(--accent-blue)","#06d6f0","#e040fb","#00e5a0"]},
};
const P_COLORS: Record<string,string> = {"Price Feed":"var(--accent-blue)","Data Stream":"#ff6b2b","Functions API":"#e040fb","AI Grounded":"#06d6f0","Composite":"#00e5a0"};
const S_COLORS: Record<string,{fg:string;bg:string}> = {
  "Open":{fg:"#00e5a0",bg:"rgba(0,229,160,0.08)"},
  "Resolution Requested":{fg:"#06d6f0",bg:"rgba(6,214,240,0.08)"},
  "Resolving":{fg:"var(--accent-blue)",bg:"rgba(77,163,255,0.08)"},
  "Resolved":{fg:"#9b7fff",bg:"rgba(155,127,255,0.08)"},
  "Disputed":{fg:"#ff4560",bg:"rgba(255,69,96,0.08)"},
  "Expired":{fg:"#444",bg:"rgba(68,68,68,0.08)"},
};

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = Number(params.id);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [betAmount, setBetAmount] = useState("0.01");
  const [side, setSide] = useState<"yes"|"no">("yes");

  const { data: market, isLoading } = useReadContract({
    address: CONTRACTS.marketFactory, abi: FACTORY_ABI, functionName: "getMarket", args: [BigInt(marketId)],
  });

  if (isLoading || !market) return (
    <div style={{ maxWidth:960, margin:"0 auto", paddingTop:48 }} className="page-enter">
      <div className="skeleton" style={{ height:14, width:"20%", marginBottom:24 }} />
      <div className="skeleton" style={{ height:40, width:"80%", marginBottom:40 }} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
        <div>
          {[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{ height:100, borderRadius:18, marginBottom:10 }} />)}
        </div>
        <div className="skeleton" style={{ height:360, borderRadius:22 }} />
      </div>
    </div>
  );

  const status = StatusLabel[market.status] || "Unknown";
  const pipeline = PipelineLabel[market.pipelineType] || "Unknown";
  const pColor = P_COLORS[pipeline] || "#555";
  const sc = S_COLORS[status] || {fg:"#555",bg:"rgba(85,85,85,0.08)"};
  const yesP = market.totalPool > 0n ? Math.round(Number((market.yesPool * 100n)/market.totalPool)) : 50;
  const pViz = PIPE_NODES[market.pipelineType] || PIPE_NODES[3];

  const predict = (isYes:boolean) => writeContract({ address:CONTRACTS.marketFactory, abi:FACTORY_ABI, functionName:"predict", args:[BigInt(marketId),isYes], value:parseEther(betAmount) });
  const reqResolve = () => writeContract({ address:CONTRACTS.marketFactory, abi:FACTORY_ABI, functionName:"requestResolution", args:[BigInt(marketId)] });
  const claim = () => writeContract({ address:CONTRACTS.marketFactory, abi:FACTORY_ABI, functionName:"claim", args:[BigInt(marketId)] });

  return (
    <div style={{ maxWidth:960, margin:"0 auto", paddingTop:48, paddingBottom:80 }} className="page-enter">

      {/* Breadcrumb */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        <a href="/markets" style={{ textDecoration:"none", fontSize:13, color:"var(--text-muted)", transition:"color 0.2s" }}
          onMouseEnter={e=>(e.target as HTMLElement).style.color="rgba(255,255,255,0.6)"}
          onMouseLeave={e=>(e.target as HTMLElement).style.color="var(--text-muted)"}
        >Markets</a>
        <span style={{ color:"color-mix(in srgb, var(--text-primary) 18%, transparent)" }}>›</span>
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:"var(--text-muted)" }}>#{String(marketId).padStart(3,"0")}</span>
        <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99, color:pColor, background:pColor+"12", border:`1px solid ${pColor}25`, fontFamily:"'JetBrains Mono', monospace" }}>{pipeline}</span>
        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:600, padding:"3px 10px", borderRadius:99, color:sc.fg, background:sc.bg }}>
          <span style={{ width:4, height:4, borderRadius:"50%", background:sc.fg, display:"inline-block" }} />
          {status}
        </span>
      </div>

      {/* Question */}
      <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:"clamp(22px, 3vw, 32px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:48, color:"var(--text-primary)" }}>
        {market.question}
      </h1>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, alignItems:"start" }}>
        {/* Left */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[
              { label:"Total Pool", val:`${parseFloat(formatEther(market.totalPool)).toFixed(4)} ETH`, color:"var(--text-primary)" },
              { label:"YES Pool",   val:`${parseFloat(formatEther(market.yesPool)).toFixed(4)} ETH`,   color:"#00e5a0" },
              { label:"NO Pool",    val:`${parseFloat(formatEther(market.noPool)).toFixed(4)} ETH`,    color:"#ff4560" },
            ].map(s=>(
              <div key={s.label} style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"20px", textAlign:"center" }}>
                <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:18, fontWeight:800, color:s.color, letterSpacing:"-0.03em", marginBottom:6 }}>{s.val}</p>
                <p style={{ fontSize:10, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'JetBrains Mono', monospace" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* YES/NO bar */}
          <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:18, padding:"22px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:32, fontWeight:800, color:"#00e5a0", letterSpacing:"-0.04em" }}>{yesP}%</span>
                <span style={{ fontSize:12, color:"#00e5a0", marginLeft:6, fontWeight:600 }}>YES</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:12, color:"#ff4560", marginRight:6, fontWeight:600 }}>NO</span>
                <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:32, fontWeight:800, color:"#ff4560", letterSpacing:"-0.04em" }}>{100-yesP}%</span>
              </div>
            </div>
            <div style={{ height:8, background:"rgba(255,69,96,0.12)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${yesP}%`, background:"linear-gradient(90deg,#00e5a0,#00b87a)", borderRadius:99, transition:"width 0.6s ease", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:"-120%", width:"60%", height:"100%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)", animation:"slideRight 2s linear infinite" }} />
              </div>
            </div>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:10, fontFamily:"'JetBrains Mono', monospace" }}>
              {market.totalPool > 0n ? "live market consensus" : "no predictions yet"}
            </p>
          </div>

          {/* Pipeline viz */}
          <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:18, padding:"22px" }}>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:16, fontFamily:"'JetBrains Mono', monospace" }}>
              Oracle Pipeline — <span style={{ color:pColor }}>{pipeline}</span>
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6, overflowX:"auto", paddingBottom:4 }}>
              {pViz.steps.map((step,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                  <div style={{ padding:"7px 16px", borderRadius:99, fontSize:12, fontWeight:700, color:pViz.colors[i], background:pViz.colors[i]+"12", border:`1px solid ${pViz.colors[i]}25`, whiteSpace:"nowrap", fontFamily:"'JetBrains Mono', monospace" }}>
                    {step}
                  </div>
                  {i < pViz.steps.length-1 && <span style={{ color:"color-mix(in srgb, var(--text-primary) 18%, transparent)", fontSize:12 }}>→</span>}
                </div>
              ))}
            </div>
            <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:16, lineHeight:1.7 }}>
              {market.pipelineType===0&&"Resolved via Chainlink Data Feeds — deterministic, tamper-proof price data."}
              {market.pipelineType===1&&"Resolved via sub-second Chainlink Data Streams for time-sensitive markets."}
              {market.pipelineType===2&&"Resolved via custom JavaScript on Chainlink Functions — calls any external API."}
              {market.pipelineType===3&&"Resolved via Gemini AI with live search grounding for real-world fact verification."}
              {market.pipelineType===4&&"Resolved via composite pipeline — multiple sources must agree (2-of-3 consensus)."}
            </p>
          </div>

          {/* Details */}
          <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:18, padding:"22px" }}>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:18, fontFamily:"'JetBrains Mono', monospace" }}>Details</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
              {[
                { label:"Creator",  val:`${market.creator.slice(0,6)}...${market.creator.slice(-4)}`, mono:true },
                { label:"Status",   val:status, color:sc.fg },
                { label:"Created",  val:new Date(Number(market.createdAt)*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) },
                { label:"Deadline", val:new Date(Number(market.deadline)*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) },
              ].map(item=>(
                <div key={item.label}>
                  <p style={{ fontSize:10, color:"var(--text-muted)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'JetBrains Mono', monospace" }}>{item.label}</p>
                  <p style={{ fontSize:13, fontWeight:600, color:item.color||"var(--text-primary)", fontFamily:item.mono?"'JetBrains Mono', monospace":"inherit" }}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Trade panel */}
        <div style={{ position:"sticky", top:80 }}>
          {status === "Open" ? (
            <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:22, overflow:"hidden" }}>
              <div style={{ padding:"20px 22px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(255,255,255,0.02)" }}>
                <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:16, letterSpacing:"-0.02em", marginBottom:2 }}>Place Prediction</p>
                <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'JetBrains Mono', monospace" }}>2% fee · proportional payout</p>
              </div>
              <div style={{ padding:"20px 22px" }}>
                {/* YES/NO toggle */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:3, gap:3, marginBottom:16 }}>
                  {(["yes","no"] as const).map(s=>(
                    <button key={s} onClick={()=>setSide(s)} style={{
                      padding:"11px", borderRadius:9, fontSize:13, fontWeight:800, cursor:"pointer",
                      color: side===s ? "white" : "var(--text-muted)",
                      background: side===s ? (s==="yes"?"linear-gradient(135deg,#00b87a,#00955e)":"linear-gradient(135deg,#cc1c38,#a31530)") : "transparent",
                      border:"none", transition:"all 0.2s ease",
                      fontFamily:"'Space Grotesk', sans-serif",
                      boxShadow: side===s ? (s==="yes"?"0 0 20px rgba(0,229,160,0.2)":"0 0 20px rgba(255,69,96,0.2)") : "none",
                    }}>
                      {s==="yes"?`YES ${yesP}%`:`NO ${100-yesP}%`}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:8, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace" }}>Amount</label>
                <div style={{ display:"flex", marginBottom:10 }}>
                  <input type="text" value={betAmount} onChange={e=>setBetAmount(e.target.value)} style={{
                    flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                    borderRight:"none", borderRadius:"10px 0 0 10px", padding:"12px 14px",
                    fontSize:16, fontWeight:700, color:"var(--text-primary)",
                    fontFamily:"'JetBrains Mono', monospace", outline:"none",
                  }}
                    onFocus={e=>{(e.target as HTMLElement).style.borderColor="rgba(77,163,255,0.4)";(e.target as HTMLElement).style.background="rgba(77,163,255,0.04)";}}
                    onBlur={e=>{(e.target as HTMLElement).style.borderColor="var(--border-default)";(e.target as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
                  />
                  <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"0 10px 10px 0", padding:"12px 14px", fontSize:12, fontWeight:700, color:"var(--text-muted)", fontFamily:"'JetBrains Mono', monospace" }}>ETH</div>
                </div>
                <div style={{ display:"flex", gap:6, marginBottom:18 }}>
                  {["0.01","0.05","0.1","0.5"].map(v=>(
                    <button key={v} onClick={()=>setBetAmount(v)} style={{
                      flex:1, padding:"6px 0", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer",
                      background: betAmount===v ? "rgba(77,163,255,0.12)" : "rgba(255,255,255,0.04)",
                      border: betAmount===v ? "1px solid rgba(77,163,255,0.35)" : "1px solid rgba(255,255,255,0.07)",
                      color: betAmount===v ? "var(--accent-blue)" : "var(--text-muted)",
                      fontFamily:"'JetBrains Mono', monospace",
                    }}>{v}</button>
                  ))}
                </div>

                {address ? (
                  <button onClick={()=>predict(side==="yes")} style={{
                    width:"100%", padding:"14px", borderRadius:12, fontSize:14, fontWeight:800,
                    cursor:"pointer", color:"white", border:"none",
                    background: side==="yes" ? "linear-gradient(135deg,#00b87a,#00955e)" : "linear-gradient(135deg,#cc1c38,#a31530)",
                    boxShadow: side==="yes" ? "0 0 28px rgba(0,229,160,0.2)" : "0 0 28px rgba(255,69,96,0.2)",
                    transition:"all 0.2s ease", fontFamily:"'Space Grotesk', sans-serif",
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";}}
                  >
                    {side==="yes" ? `Buy YES · ${betAmount} ETH` : `Buy NO · ${betAmount} ETH`}
                  </button>
                ) : (
                  <div style={{ textAlign:"center", padding:"14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12 }}>
                    <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'JetBrains Mono', monospace" }}>Connect wallet to predict</p>
                  </div>
                )}
              </div>
            </div>
          ) : status === "Resolved" ? (
            <div style={{ background:"var(--bg-card)", border:"1px solid rgba(155,127,255,0.2)", borderRadius:22, padding:"28px 22px", textAlign:"center" }}>
              <p style={{ fontSize:36, marginBottom:12 }}>🏆</p>
              <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:18, color:"#9b7fff", letterSpacing:"-0.02em", marginBottom:8 }}>Market Resolved</p>
              <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:24 }}>
                Outcome: <strong style={{ color:"#9b7fff" }}>{OutcomeLabel[market.resolvedOutcome]||"—"}</strong>
              </p>
              {address && (
                <button onClick={claim} style={{
                  width:"100%", padding:"14px", borderRadius:12, fontSize:14, fontWeight:800,
                  color:"white", border:"none", background:"linear-gradient(135deg,#00b87a,#00955e)",
                  cursor:"pointer", boxShadow:"0 0 28px rgba(0,229,160,0.2)", fontFamily:"'Space Grotesk', sans-serif",
                }}>Claim Winnings</button>
              )}
            </div>
          ) : (
            <div style={{ background:"var(--bg-card)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:22, padding:"28px 22px", textAlign:"center" }}>
              <p style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>⏳</p>
              <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:800, fontSize:16, marginBottom:8 }}>{status}</p>
              <p style={{ fontSize:13, color:"var(--text-muted)" }}>No longer accepting predictions.</p>
            </div>
          )}

          {status === "Open" && (
            <button onClick={reqResolve} style={{
              width:"100%", marginTop:8, padding:"12px", borderRadius:12, fontSize:12, fontWeight:600,
              cursor:"pointer", color:"rgba(6,214,240,0.7)",
              background:"transparent", border:"1px solid rgba(6,214,240,0.15)",
              transition:"all 0.2s ease", fontFamily:"'JetBrains Mono', monospace",
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(6,214,240,0.06)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}
            >Request Resolution</button>
          )}
        </div>
      </div>
    </div>
  );
}
