import { useState, useRef, useEffect } from "react";

// ── Change this if your backend runs on a different port ──────
const API_BASE = "https://serenity-ai-2.onrender.com";
const USER_ID = "user_001";

const INSTANT_JOY = [
  { tag: "⚡ Quick boost", text: "Watch a funny animal video for 2 minutes" },
  { tag: "🎵 Music", text: "Play your favourite upbeat song right now" },
  { tag: "🌬️ Breathe", text: "Take 3 slow deep breaths — in for 4, out for 6" },
  { tag: "🌿 Nature", text: "Step outside or open a window for fresh air" },
  { tag: "💧 Hydrate", text: "Drink a full glass of water mindfully" },
  { tag: "🕯️ Calm", text: "Light a candle or diffuse lavender oil" },
  { tag: "📝 Write", text: "Jot down 3 things you're grateful for" },
  { tag: "🤸 Move", text: "Do 10 jumping jacks to reset your energy" },
  { tag: "😊 Smile", text: "Smile at yourself in a mirror for 30 seconds" },
  { tag: "🎨 Create", text: "Doodle freely for 5 minutes — no judgement" },
];

const AFFIRMATIONS = [
  "Rest is not a reward — it's a requirement.",
  "You are doing better than you think.",
  "It's okay to not have everything figured out.",
  "Your feelings are valid. You are not alone.",
  "Small steps are still steps forward.",
  "You've survived 100% of your hard days so far.",
  "Be gentle with yourself today.",
  "Healing isn't linear — and that's perfectly okay.",
];

const MOOD_OPTIONS = [
  {
    label: "😔",
    value: "sad",
    color: "#7A9EC2",
    bg: "rgba(122,158,194,0.15)",
    text: "Feeling sad",
  },
  {
    label: "😐",
    value: "neutral",
    color: "#8B9E7A",
    bg: "rgba(139,158,122,0.15)",
    text: "Just okay",
  },
  {
    label: "🙂",
    value: "calm",
    color: "#6BAE8A",
    bg: "rgba(107,174,138,0.15)",
    text: "Feeling calm",
  },
  {
    label: "😊",
    value: "happy",
    color: "#A8C97F",
    bg: "rgba(168,201,127,0.15)",
    text: "Feeling happy",
  },
  {
    label: "😄",
    value: "great",
    color: "#C5D97A",
    bg: "rgba(197,217,122,0.15)",
    text: "Feeling great!",
  },
];

const QUICK_CHIPS = [
  { label: "Feeling anxious", msg: "I'm feeling really anxious right now" },
  { label: "Overwhelmed", msg: "I'm completely overwhelmed" },
  { label: "Need to vent", msg: "I just need to vent about something" },
  { label: "Can't sleep", msg: "I can't sleep and it's really affecting me" },
  { label: "Feeling lonely", msg: "I'm feeling really lonely lately" },
  { label: "Low motivation", msg: "I have zero motivation today" },
];

const TABS = [
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "joy", icon: "⚡", label: "Instant Joy" },
  { id: "mood", icon: "📊", label: "Mood Log" },
  { id: "memory", icon: "🧠", label: "Memory" },
];

const MOOD_COLORS = {
  anxious: "#D4956A",
  sad: "#7A9EC2",
  overwhelmed: "#C27AA0",
  calm: "#6BAE8A",
  happy: "#A8C97F",
  neutral: "#8B9E7A",
  angry: "#C27A7A",
  lonely: "#9A8FBA",
  great: "#C5D97A",
};
const MOOD_EMOJIS = {
  anxious: "😰",
  sad: "😔",
  overwhelmed: "😫",
  calm: "🌿",
  happy: "😊",
  neutral: "😐",
  angry: "😤",
  lonely: "🥺",
  great: "😄",
};
const MOOD_LABELS = {
  anxious: "Anxious",
  sad: "Feeling sad",
  overwhelmed: "Overwhelmed",
  calm: "Feeling calm",
  happy: "Feeling happy",
  neutral: "Just okay",
  angry: "Feeling angry",
  lonely: "Feeling lonely",
  great: "Feeling great!",
};

// ── CSS ────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0C1410;--bg2:#121A14;--bg3:#172019;--bg4:#1D2920;
    --card:#1A2318;--card2:#202C1F;
    --b1:rgba(100,150,80,0.10);--b2:rgba(100,150,80,0.20);--b3:rgba(100,150,80,0.35);
    --g:#6EBF7A;--gdim:#3D6B42;--gglow:rgba(110,191,122,0.12);
    --t1:#E2EAE0;--t2:#8FA888;--t3:#4A6148;--t4:#2E4030;
    --serif:'Fraunces',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;
  }
  html,body,#root{height:100%;overflow:hidden}
  body{background:var(--bg);font-family:var(--sans);color:var(--t1)}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}

  .app{display:flex;flex-direction:column;height:100vh;overflow:hidden;
    background:var(--bg);
    background-image:radial-gradient(ellipse 70% 50% at 90% 0%,rgba(40,80,30,0.22),transparent 55%),
    radial-gradient(ellipse 50% 60% at 0% 100%,rgba(30,60,25,0.15),transparent 55%)}

  /* Header */
  .hdr{display:flex;align-items:center;justify-content:space-between;
    padding:12px 24px;border-bottom:1px solid var(--b1);
    background:rgba(12,20,16,0.92);backdrop-filter:blur(20px);flex-shrink:0}
  .hdr-l{display:flex;align-items:center;gap:12px}
  .logo{width:40px;height:40px;border-radius:14px;flex-shrink:0;
    background:linear-gradient(145deg,#1E3A1A,#3A6E32);
    display:flex;align-items:center;justify-content:center;font-size:20px;
    box-shadow:0 0 0 1px rgba(110,191,122,0.25),0 6px 20px rgba(58,110,50,0.35)}
  .brand{font-family:var(--serif);font-size:24px;color:var(--t1);letter-spacing:-0.01em;line-height:1}
  .bsub{font-size:10.5px;color:var(--t3);letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;font-weight:400}
  .spill{display:flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;font-size:11.5px;border:1px solid}
  .spill.on{color:var(--g);border-color:rgba(110,191,122,0.25);background:rgba(110,191,122,0.07)}
  .spill.off{color:#C27A7A;border-color:rgba(194,122,122,0.25);background:rgba(194,122,122,0.07)}
  .spill.chk{color:var(--t3);border-color:var(--b1)}
  .sdot{width:5px;height:5px;border-radius:50%;background:currentColor}
  .sdot.on{animation:blink 2s ease-in-out infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}

  /* Offline banner — shown when backend is down */
  .offline-banner{background:rgba(30,10,10,0.85);border-bottom:1px solid rgba(194,100,100,0.2);
    padding:10px 24px;display:flex;align-items:center;gap:12px;flex-shrink:0}
  .offline-banner-icon{font-size:16px;flex-shrink:0}
  .offline-banner-msg{font-size:12.5px;color:#E09090;line-height:1.5}
  .offline-banner-msg strong{color:#F0A0A0}
  .offline-banner-code{font-family:monospace;background:rgba(255,255,255,0.07);
    padding:2px 7px;border-radius:4px;font-size:11.5px;color:#F0A0A0}

  /* Tabs */
  .tabs{display:flex;padding:0 20px;border-bottom:1px solid var(--b1);
    background:rgba(12,20,16,0.7);flex-shrink:0;gap:2px}
  .tb{padding:11px 16px;font-size:13px;border:none;background:none;cursor:pointer;
    font-family:var(--sans);font-weight:400;display:flex;align-items:center;gap:7px;
    transition:all .15s;border-bottom:2px solid transparent;margin-bottom:-1px;color:var(--t3)}
  .tb:hover{color:var(--t2)}
  .tb.act{color:var(--g);border-bottom-color:var(--g);font-weight:500}

  .content{flex:1;overflow:hidden;display:flex}

  /* Chat */
  .chat-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .msgs{flex:1;overflow-y:auto;padding:28px 32px;display:flex;flex-direction:column;gap:20px}
  .mrow{display:flex;gap:12px;max-width:78%;animation:rise .28s ease}
  .mrow.user{align-self:flex-end;flex-direction:row-reverse}
  .mrow.bot{align-self:flex-start}
  @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .av{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;
    align-items:center;justify-content:center;font-size:15px;margin-top:2px}
  .av.bot{background:linear-gradient(145deg,#1E3A1A,#2E5828);border:1px solid rgba(110,191,122,0.25)}
  .av.user{background:var(--bg4);border:1px solid var(--b2)}
  .bub{padding:13px 17px;font-size:14px;line-height:1.7;white-space:pre-wrap}
  .bub.bot{background:var(--card);border:1px solid var(--b1);
    border-radius:4px 16px 16px 16px;color:var(--t1)}
  .bub.user{background:linear-gradient(145deg,#1E3C1A,#2A5022);
    border:1px solid rgba(110,191,122,0.18);
    border-radius:16px 4px 16px 16px;color:#CEE8C6}
  .meta{display:flex;align-items:center;gap:6px;margin-top:6px;padding-left:2px;flex-wrap:wrap}
  .mtag{font-size:10.5px;color:var(--t3);display:flex;align-items:center;gap:3px}
  .nb{display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 8px;
    border-radius:20px;border:1px solid var(--b1);color:var(--t3);background:rgba(255,255,255,0.02)}
  .nb.neg{border-color:rgba(194,122,122,0.25);color:#C27A7A;background:rgba(194,122,122,0.05)}
  .nb.pos{border-color:rgba(168,201,127,0.25);color:#A8C97F;background:rgba(168,201,127,0.05)}
  .nb.cri{border-color:rgba(220,80,60,0.35);color:#E07060;background:rgba(220,80,60,0.07);font-weight:500}
  .eb{font-size:10px;padding:2px 8px;border-radius:20px;
    background:rgba(110,191,122,0.07);border:1px solid rgba(110,191,122,0.18);color:var(--g)}
  .typing{display:flex;gap:12px;align-items:flex-end}
  .tybub{background:var(--card);border:1px solid var(--b1);
    border-radius:4px 16px 16px 16px;padding:15px 20px;display:flex;gap:5px;align-items:center}
  .dot{width:6px;height:6px;border-radius:50%;background:var(--gdim);
    animation:dotpulse 1.2s ease-in-out infinite}
  .dot:nth-child(2){animation-delay:.22s}.dot:nth-child(3){animation-delay:.44s}
  @keyframes dotpulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
  .chips{padding:8px 28px 0;display:flex;gap:7px;overflow-x:auto;flex-shrink:0}
  .chips::-webkit-scrollbar{display:none}
  .ch{padding:6px 14px;border-radius:20px;font-size:12px;white-space:nowrap;cursor:pointer;
    border:1px solid var(--b2);background:rgba(110,191,122,0.04);
    color:var(--t2);font-family:var(--sans);transition:all .15s}
  .ch:hover{border-color:var(--gdim);background:var(--gglow);color:var(--g)}
  .inp-wrap{padding:12px 24px 16px;border-top:1px solid var(--b1);
    background:rgba(12,20,16,0.85);backdrop-filter:blur(12px);
    display:flex;gap:10px;align-items:flex-end;flex-shrink:0}
  .inp{flex:1;background:var(--card);border:1px solid var(--b2);border-radius:24px;
    padding:12px 20px;font-size:14px;color:var(--t1);font-family:var(--sans);
    resize:none;outline:none;line-height:1.55;min-height:46px;max-height:130px;transition:border-color .2s}
  .inp::placeholder{color:var(--t4)}
  .inp:focus{border-color:var(--gdim)}
  .sbtn{width:46px;height:46px;border-radius:50%;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
  .sbtn.on{background:linear-gradient(145deg,#2E5828,#4A8C3E);box-shadow:0 4px 18px rgba(74,140,62,.4)}
  .sbtn.on:hover{transform:scale(1.06)}
  .sbtn.off{background:var(--bg3);border:1px solid var(--b1);cursor:default}

  /* Panels */
  .panel{flex:1;overflow-y:auto;padding:28px 32px;max-width:740px;margin:0 auto;width:100%}
  .ph{font-family:var(--serif);font-size:26px;color:var(--t1);font-weight:300;margin-bottom:4px}
  .ps{font-size:13px;color:var(--t3);margin-bottom:26px;font-weight:300;line-height:1.5}
  .plbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;
    color:var(--t3);margin-bottom:12px;font-weight:500;margin-top:24px}
  .row-sb{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
  .ghost{padding:6px 15px;border-radius:20px;border:1px solid var(--b1);
    background:none;color:var(--t3);font-size:12px;cursor:pointer;
    font-family:var(--sans);transition:all .15s}
  .ghost:hover{border-color:var(--b2);color:var(--t2)}

  /* Joy */
  .jgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
  .jcard{background:var(--card);border:1px solid var(--b1);border-radius:16px;
    padding:18px;cursor:pointer;transition:all .2s}
  .jcard:hover{border-color:var(--b3);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
  .jtag{font-size:10.5px;color:var(--g);font-weight:600;margin-bottom:8px;letter-spacing:.04em}
  .jtxt{font-size:13.5px;color:var(--t2);line-height:1.5}
  .affm{background:linear-gradient(145deg,#101A0E,#141E12);
    border:1px solid rgba(110,191,122,0.18);border-radius:16px;
    padding:22px 26px;margin-bottom:22px;position:relative;overflow:hidden}
  .affm::after{content:"❝";position:absolute;right:20px;bottom:-8px;
    font-size:80px;color:rgba(110,191,122,0.04);font-family:serif;line-height:1}
  .affm-lbl{font-size:10px;color:var(--gdim);letter-spacing:.12em;
    text-transform:uppercase;margin-bottom:12px;font-weight:600}
  .affm-txt{font-family:var(--serif);font-style:italic;font-size:18px;
    color:var(--g);line-height:1.6;position:relative;z-index:1}
  .bcard{background:var(--card);border:1px solid var(--b1);border-radius:16px;
    padding:24px;display:flex;flex-direction:column;align-items:center;gap:16px}
  .btitle{font-size:13px;font-weight:500;color:var(--t2);letter-spacing:.03em}
  .bbtn{padding:9px 28px;border-radius:20px;border:1px solid var(--gdim);
    background:rgba(110,191,122,0.09);color:var(--g);font-size:13px;cursor:pointer;
    font-family:var(--sans);font-weight:500;transition:all .2s}
  .bbtn:hover{background:rgba(110,191,122,0.18)}

  /* Mood log */
  .mpick{background:var(--card);border:1px solid var(--b1);border-radius:16px;padding:24px;margin-bottom:20px}
  .mq{font-size:14px;color:var(--t2);margin-bottom:18px;font-weight:300}
  .memojis{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .mbtn{display:flex;flex-direction:column;align-items:center;gap:6px;
    cursor:pointer;padding:10px 12px;border-radius:12px;
    border:2px solid transparent;background:var(--bg3);
    transition:all .2s;font-family:var(--sans)}
  .mbtn:hover{transform:scale(1.08);border-color:var(--b2)}
  .mbtn.sel{border-color:var(--g);background:rgba(110,191,122,.1);transform:scale(1.1)}
  .mej{font-size:26px;line-height:1}
  .mlbl-s{font-size:10px;color:var(--t3);white-space:nowrap}
  .mconf{text-align:center;font-size:12.5px;color:var(--g);margin-top:14px;
    padding:8px;background:rgba(110,191,122,.07);border-radius:8px}
  .mchart{background:var(--card);border:1px solid var(--b1);border-radius:16px;padding:20px;margin-bottom:16px}
  .mchart-t{font-size:10px;color:var(--t3);margin-bottom:16px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
  .mbars{display:flex;align-items:flex-end;gap:8px;height:80px}
  .mbar-c{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}
  .mbar{width:100%;border-radius:4px 4px 0 0;min-height:4px;transition:height .4s ease}
  .mbar-l{font-size:11px;color:var(--t3);text-align:center}
  .ment{display:flex;align-items:center;justify-content:space-between;
    padding:14px 18px;background:var(--card);border:1px solid var(--b1);
    border-radius:12px;margin-bottom:8px;transition:border-color .15s}
  .ment:hover{border-color:var(--b2)}
  .ment-l{display:flex;align-items:center;gap:12px}
  .mej2{font-size:24px}
  .mname{font-size:14px;color:var(--t1);font-weight:500}
  .mtime{font-size:11px;color:var(--t3);margin-top:2px;font-weight:300}
  .mdot{width:10px;height:10px;border-radius:50%;flex-shrink:0}

  /* Memory */
  .mem{display:flex;gap:14px;padding:16px 18px;background:var(--card);
    border:1px solid var(--b1);border-radius:12px;margin-bottom:10px;
    transition:all .15s;animation:rise .25s ease}
  .mem:hover{border-color:var(--b2)}
  .mem-bar{width:2px;background:linear-gradient(to bottom,var(--gdim),transparent);
    border-radius:2px;flex-shrink:0;align-self:stretch;min-height:24px}
  .mem-txt{font-size:13.5px;color:var(--t2);line-height:1.55}
  .mem-time{font-size:11px;color:var(--t4);margin-top:5px;font-weight:300}
  .priv{background:rgba(110,191,122,0.04);border:1px solid rgba(110,191,122,.12);
    border-radius:12px;padding:16px 18px;margin-bottom:22px;
    font-size:12.5px;color:var(--t3);line-height:1.65}
  .empty{text-align:center;padding:56px 24px;color:var(--t3)}
  .ei{font-size:40px;margin-bottom:14px;opacity:.4}
  .empty p{font-size:13.5px;font-weight:300;line-height:1.6;max-width:280px;margin:0 auto}
`;

// ── API helpers ────────────────────────────────────────────────
async function apiPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

// ── Box Breathing ──────────────────────────────────────────────
function BoxBreathing() {
  const [phase, setPhase] = useState(null);
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const phases = [
    { label: "Inhale", dur: 4, color: "#6BAE8A" },
    { label: "Hold", dur: 4, color: "#C8B86A" },
    { label: "Exhale", dur: 4, color: "#7A9EC2" },
    { label: "Hold", dur: 4, color: "#8B9E7A" },
  ];
  useEffect(() => {
    if (!running) return;
    let pi = 0,
      c = 1;
    setPhase(0);
    setCount(1);
    const tick = () => {
      c++;
      if (c > phases[pi].dur) {
        c = 1;
        pi = (pi + 1) % 4;
      }
      setPhase(pi);
      setCount(c);
      ref.current = setTimeout(tick, 1000);
    };
    ref.current = setTimeout(tick, 1000);
    return () => clearTimeout(ref.current);
  }, [phases, running]);
  function toggle() {
    if (running) {
      clearTimeout(ref.current);
      setRunning(false);
      setPhase(null);
      setCount(0);
    } else setRunning(true);
  }
  const cur = phase !== null ? phases[phase] : null;
  const prog = cur ? count / cur.dur : 0;
  const R = 42,
    C = 2 * Math.PI * R;
  return (
    <div className="bcard">
      <div className="btitle">Box Breathing · 4 – 4 – 4 – 4</div>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={R}
          fill="none"
          stroke="rgba(110,191,122,0.10)"
          strokeWidth="6"
        />
        {cur && (
          <circle
            cx="55"
            cy="55"
            r={R}
            fill="none"
            stroke={cur.color}
            strokeWidth="6"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - prog)}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.9s linear,stroke 0.3s",
            }}
          />
        )}
        <text
          x="55"
          y="49"
          textAnchor="middle"
          fill="rgba(200,220,190,0.45)"
          fontSize="11"
          fontFamily="Plus Jakarta Sans"
        >
          {cur?.label || "Ready"}
        </text>
        <text
          x="55"
          y="70"
          textAnchor="middle"
          fill="rgba(220,235,215,0.9)"
          fontSize="26"
          fontFamily="Fraunces"
        >
          {cur ? count : "·"}
        </text>
      </svg>
      <button className="bbtn" onClick={toggle}>
        {running ? "Stop" : "Begin"}
      </button>
    </div>
  );
}

// ── NLP Badges ─────────────────────────────────────────────────
const EMOTION_EMOJI = {
  crisis: "🆘",
  overwhelmed: "😫",
  anxious: "😰",
  sad: "😔",
  angry: "😤",
  lonely: "🥺",
  happy: "😊",
  calm: "🌿",
  neutral: "😐",
};

function NlpBadges({ nlp }) {
  if (!nlp) return null;
  const s = nlp.sentiment_score || 0;
  const cls = s >= 0.15 ? "pos" : s <= -0.1 ? "neg" : "";
  // Don't show a badge if crisis is already shown via crisis_detected
  const emotions = (nlp.emotions || [])
    .filter((e) => e !== "crisis")
    .slice(0, 3);
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      <span className={`nb ${cls}`}>
        {nlp.sentiment_label} {s > 0 ? "+" : ""}
        {s}
      </span>
      {emotions.map((e) => (
        <span key={e} className="eb">
          {EMOTION_EMOJI[e] || ""} {e}
        </span>
      ))}
      {nlp.crisis_detected && (
        <span className="nb cri">🆘 crisis detected</span>
      )}
    </div>
  );
}

// ── Mood Chart ─────────────────────────────────────────────────
function MoodChart({ moodLog }) {
  if (moodLog.length < 3) return null;
  const order = ["sad", "neutral", "calm", "happy", "great"];
  const recent = [...moodLog].slice(0, 7).reverse();
  return (
    <div className="mchart">
      <div className="mchart-t">Last {recent.length} mood entries</div>
      <div className="mbars">
        {recent.map((e, i) => {
          const idx = order.indexOf(e.mood) + 1;
          const h = idx > 0 ? Math.round((idx / 5) * 68) : 6;
          return (
            <div key={i} className="mbar-c">
              <div
                className="mbar"
                style={{
                  height: h,
                  background: MOOD_COLORS[e.mood] || "#555",
                  opacity: 0.75,
                }}
              />
              <div className="mbar-l">{MOOD_EMOJIS[e.mood] || "😐"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function Serenity() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello, I'm Serenity 🌿\n\nI'm your personal wellness companion — here to listen without judgment, help you find calm, and support you through whatever you're carrying. How are you feeling right now?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [moodLog, setMoodLog] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [joyItems, setJoyItems] = useState(() =>
    [...INSTANT_JOY].sort(() => Math.random() - 0.5).slice(0, 4),
  );
  const [affirmation] = useState(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)],
  );
  const [apiStatus, setApiStatus] = useState("checking");
  const bottomRef = useRef(null);

  // ── Health check on load ──────────────────────────────────
  useEffect(() => {
    apiGet("/health")
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  // ── Load data when switching tabs ─────────────────────────
  useEffect(() => {
    if (tab === "memory") {
      apiGet(`/memories/${USER_ID}`)
        .then((d) => setMemories(d.memories || []))
        .catch(() => setMemories([]));
    }
    if (tab === "mood") {
      apiGet(`/mood/${USER_ID}`)
        .then((d) => setMoodLog(d.moods || []))
        .catch(() => setMoodLog([]));
    }
  }, [tab]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Send message — NO token needed, backend uses .env ─────
  async function send(text) {
    if (!text.trim() || loading) return;
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const data = await apiPost("/chat", { user_id: USER_ID, message: text });
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: data.reply,
          mood: data.mood,
          nlp: data.nlp,
        },
      ]);
      // Silently refresh memory after each chat
      apiGet(`/memories/${USER_ID}`)
        .then((d) => setMemories(d.memories || []))
        .catch(() => {});
    } catch (e) {
      const code = e.message;
      let msg = "";
      if (code === "402") {
        msg =
          "HuggingFace free tier credits are used up for this month 🙏. Try again tomorrow or add HF_TOKEN with PRO credits in your backend .env file.";
      } else if (code === "401" || code === "403") {
        msg =
          "HuggingFace token in your backend .env file appears invalid or expired. Please update HF_TOKEN in backend/.env and restart the server.";
      } else {
        msg =
          "Backend server is not reachable. Please make sure it's running:\n\ncd backend\nuvicorn main:app --reload --port 8000";
      }
      setMessages((p) => [...p, { role: "assistant", content: msg }]);
      setApiStatus("offline");
    }
    setLoading(false);
  }

  // ── Log mood ──────────────────────────────────────────────
  async function logMood(val) {
    setTodayMood(val);
    try {
      await apiPost("/mood", { user_id: USER_ID, mood: val });
      const d = await apiGet(`/mood/${USER_ID}`);
      setMoodLog(d.moods || []);
    } catch {}
  }

  // ── Clear memory ──────────────────────────────────────────
  async function clearMem() {
    try {
      await apiPost("/memories/clear", { user_id: USER_ID });
      setMemories([]);
    } catch {}
  }

  const canSend = !!input.trim() && !loading;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* ── Header ── */}
        <div className="hdr">
          <div className="hdr-l">
            <div className="logo">🌿</div>
            <div>
              <div className="brand">Serenity</div>
              <div className="bsub">Your mental wellness companion</div>
            </div>
          </div>
          <div
            className={`spill ${apiStatus === "online" ? "on" : apiStatus === "offline" ? "off" : "chk"}`}
          >
            <div className={`sdot ${apiStatus === "online" ? "on" : ""}`} />
            {apiStatus === "checking"
              ? "Connecting…"
              : apiStatus === "online"
                ? "Server online"
                : "Server offline"}
          </div>
        </div>

        {/* ── Offline Banner — only shown when server is down ── */}
        {apiStatus === "offline" && (
          <div className="offline-banner">
            <div className="offline-banner-icon">⚠️</div>
            <div className="offline-banner-msg">
              <strong>Backend server is offline.</strong> Start it by running:{" "}
              <span className="offline-banner-code">
                cd backend && uvicorn main:app --reload --port 8000
              </span>{" "}
              — then make sure{" "}
              <span className="offline-banner-code">HF_TOKEN=hf_...</span> is in
              your <span className="offline-banner-code">backend/.env</span>{" "}
              file.
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tb ${tab === t.id ? "act" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="content">
          {/* ════ CHAT ════ */}
          {tab === "chat" && (
            <div className="chat-wrap">
              <div className="msgs">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mrow ${msg.role === "user" ? "user" : "bot"}`}
                  >
                    <div
                      className={`av ${msg.role === "user" ? "user" : "bot"}`}
                    >
                      {msg.role === "user" ? "✦" : "🌿"}
                    </div>
                    <div>
                      <div
                        className={`bub ${msg.role === "user" ? "user" : "bot"}`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "assistant" && (msg.mood || msg.nlp) && (
                        <div className="meta">
                          {msg.mood && (
                            <span className="mtag">
                              {MOOD_EMOJIS[msg.mood] || "🌿"} {msg.mood}
                            </span>
                          )}
                          {msg.nlp && <NlpBadges nlp={msg.nlp} />}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="typing">
                    <div className="av bot">🌿</div>
                    <div className="tybub">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="chips">
                {QUICK_CHIPS.map((c) => (
                  <button
                    key={c.label}
                    className="ch"
                    onClick={() => send(c.msg)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="inp-wrap">
                <textarea
                  className="inp"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Share how you're feeling…"
                />
                <button
                  className={`sbtn ${canSend ? "on" : "off"}`}
                  onClick={() => send(input)}
                  disabled={!canSend}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={canSend ? "white" : "#2E4030"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ════ INSTANT JOY ════ */}
          {tab === "joy" && (
            <div className="panel">
              <div className="row-sb">
                <div>
                  <div className="ph">Instant Joy</div>
                  <div className="ps">
                    Small acts that can shift your mood right now
                  </div>
                </div>
                <button
                  className="ghost"
                  onClick={() =>
                    setJoyItems(
                      [...INSTANT_JOY]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 4),
                    )
                  }
                >
                  🔀 Shuffle
                </button>
              </div>
              <div className="jgrid">
                {joyItems.map((item, i) => (
                  <div key={i} className="jcard">
                    <div className="jtag">{item.tag}</div>
                    <div className="jtxt">{item.text}</div>
                  </div>
                ))}
              </div>
              <div className="affm">
                <div className="affm-lbl">✦ Today's affirmation</div>
                <div className="affm-txt">"{affirmation}"</div>
              </div>
              <div className="plbl">Guided breathing exercise</div>
              <BoxBreathing />
            </div>
          )}

          {/* ════ MOOD LOG ════ */}
          {tab === "mood" && (
            <div className="panel">
              <div className="ph">Mood Log</div>
              <div className="ps">
                Track how you feel — patterns reveal themselves over time
              </div>

              <div className="mpick">
                <div className="mq">How are you feeling right now?</div>
                <div className="memojis">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      className={`mbtn ${todayMood === m.value ? "sel" : ""}`}
                      style={
                        todayMood === m.value
                          ? { borderColor: m.color, background: m.bg }
                          : {}
                      }
                      onClick={() => logMood(m.value)}
                    >
                      <span className="mej">{m.label}</span>
                      <span className="mlbl-s">{m.text}</span>
                    </button>
                  ))}
                </div>
                {todayMood && (
                  <div className="mconf">
                    {MOOD_EMOJIS[todayMood] || todayMood} Logged —{" "}
                    {MOOD_LABELS[todayMood] || todayMood}
                  </div>
                )}
              </div>

              <MoodChart moodLog={moodLog} />

              <div className="plbl" style={{ marginTop: 8 }}>
                Recent entries
              </div>
              {moodLog.length === 0 ? (
                <div className="empty">
                  <div className="ei">📊</div>
                  <p>
                    No mood entries yet. Select how you're feeling above to
                    start tracking.
                  </p>
                </div>
              ) : (
                moodLog.map((e, i) => (
                  <div key={i} className="ment">
                    <div className="ment-l">
                      <div className="mej2">{MOOD_EMOJIS[e.mood] || "😐"}</div>
                      <div>
                        <div className="mname">
                          {MOOD_LABELS[e.mood] || e.mood}
                        </div>
                        <div className="mtime">{e.created_at}</div>
                      </div>
                    </div>
                    <div
                      className="mdot"
                      style={{ background: MOOD_COLORS[e.mood] || "#555" }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ════ MEMORY ════ */}
          {tab === "memory" && (
            <div className="panel">
              <div className="row-sb">
                <div>
                  <div className="ph">Memory</div>
                  <div className="ps">
                    What Serenity remembers from your conversations
                  </div>
                </div>
                {memories.length > 0 && (
                  <button className="ghost" onClick={clearMem}>
                    Clear all
                  </button>
                )}
              </div>

              <div className="priv">
                <strong style={{ color: "var(--g)" }}>
                  🔒 Private by design.
                </strong>{" "}
                All memories are stored in{" "}
                <strong>SQLite on your own machine</strong> — never sent to any
                external server. Auto-saved from chat messages to give Serenity
                context over time.
              </div>

              {memories.length === 0 ? (
                <div className="empty">
                  <div className="ei">🧠</div>
                  <p>
                    No memories yet. Start chatting and your conversations will
                    be remembered here automatically.
                  </p>
                </div>
              ) : (
                memories.map((m, i) => (
                  <div key={i} className="mem">
                    <div className="mem-bar" />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        {m.category && m.category !== "general" && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: "rgba(110,191,122,0.08)",
                              border: "1px solid rgba(110,191,122,0.2)",
                              color: "var(--g)",
                              fontWeight: 500,
                              textTransform: "capitalize",
                            }}
                          >
                            {m.category}
                          </span>
                        )}
                      </div>
                      <div className="mem-txt">{m.snippet}</div>
                      <div className="mem-time">{m.created_at}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
