import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "https://serenity-ai-1.onrender.com";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const INSTANT_JOY = [
  { tag:"⚡ Quick boost", text:"Watch a funny animal video for 2 minutes" },
  { tag:"🎵 Music",       text:"Play your favourite upbeat song right now" },
  { tag:"🌿 Nature",      text:"Step outside or open a window for fresh air" },
  { tag:"💧 Hydrate",     text:"Drink a full glass of water mindfully" },
  { tag:"🕯️ Calm",       text:"Light a candle or diffuse lavender oil" },
  { tag:"📝 Write",       text:"Jot down 3 things you're grateful for" },
  { tag:"🤸 Move",        text:"Do 10 jumping jacks to reset your energy" },
  { tag:"😊 Smile",       text:"Smile at yourself in a mirror for 30 seconds" },
  { tag:"🎨 Create",      text:"Doodle freely for 5 minutes — no judgement" },
  { tag:"☕ Pause",       text:"Make a hot drink and sit with it, phones away" },
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
  "You don't have to earn rest.",
  "One breath at a time is enough.",
];

const MOOD_OPTIONS = [
  { label:"😔", value:"sad",       color:"#7A9EC2", bg:"rgba(122,158,194,0.15)", text:"Feeling sad" },
  { label:"😐", value:"neutral",   color:"#8B9E7A", bg:"rgba(139,158,122,0.15)", text:"Just okay" },
  { label:"🙂", value:"calm",      color:"#6BAE8A", bg:"rgba(107,174,138,0.15)", text:"Feeling calm" },
  { label:"😊", value:"happy",     color:"#A8C97F", bg:"rgba(168,201,127,0.15)", text:"Feeling happy" },
  { label:"😄", value:"great",     color:"#C5D97A", bg:"rgba(197,217,122,0.15)", text:"Feeling great!" },
];

const QUICK_CHIPS = [
  { label:"Feeling anxious",   msg:"I'm feeling really anxious right now" },
  { label:"Overwhelmed",       msg:"I'm completely overwhelmed and don't know where to start" },
  { label:"Need to vent",      msg:"I just need to vent about something" },
  { label:"Can't sleep",       msg:"I can't sleep and it's really affecting me" },
  { label:"Feeling lonely",    msg:"I'm feeling really lonely lately" },
  { label:"Low motivation",    msg:"I have zero motivation today" },
  { label:"Work stress",       msg:"Work is really stressing me out" },
  { label:"Feeling lost",      msg:"I feel lost and don't know what to do with my life" },
];

const BREATHING_EXERCISES = [
  { id:"box",    name:"Box Breathing",    desc:"For anxiety & focus",    phases:[{l:"Inhale",d:4,c:"#6BAE8A"},{l:"Hold",d:4,c:"#C8B86A"},{l:"Exhale",d:4,c:"#7A9EC2"},{l:"Hold",d:4,c:"#8B9E7A"}] },
  { id:"478",    name:"4-7-8 Breathing",  desc:"For sleep & calm",       phases:[{l:"Inhale",d:4,c:"#6BAE8A"},{l:"Hold",d:7,c:"#C8B86A"},{l:"Exhale",d:8,c:"#7A9EC2"}] },
  { id:"deep",   name:"Deep Breathing",   desc:"For quick stress relief", phases:[{l:"Inhale",d:5,c:"#6BAE8A"},{l:"Exhale",d:6,c:"#7A9EC2"}] },
];

const TABS = [
  { id:"chat",    icon:"💬", label:"Chat" },
  { id:"joy",     icon:"⚡", label:"Instant Joy" },
  { id:"mood",    icon:"📊", label:"Mood Log" },
  { id:"memory",  icon:"🧠", label:"Memory" },
  { id:"stats",   icon:"📈", label:"Insights" },
];

const MOOD_COLORS  = { anxious:"#D4956A",sad:"#7A9EC2",overwhelmed:"#C27AA0",calm:"#6BAE8A",happy:"#A8C97F",neutral:"#8B9E7A",angry:"#C27A7A",lonely:"#9A8FBA",great:"#C5D97A" };
const MOOD_EMOJIS  = { anxious:"😰",sad:"😔",overwhelmed:"😫",calm:"🌿",happy:"😊",neutral:"😐",angry:"😤",lonely:"🥺",great:"😄" };
const MOOD_LABELS  = { anxious:"Anxious",sad:"Feeling sad",overwhelmed:"Overwhelmed",calm:"Feeling calm",happy:"Feeling happy",neutral:"Just okay",angry:"Feeling angry",lonely:"Feeling lonely",great:"Feeling great!" };
const EMOTION_EMOJI= { crisis:"🆘",overwhelmed:"😫",anxious:"😰",sad:"😔",angry:"😤",lonely:"🥺",happy:"😊",calm:"🌿",neutral:"😐" };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0C1410;--bg2:#121A14;--bg3:#172019;--bg4:#1D2920;
    --card:#1A2318;--card2:#1E2B1C;
    --b1:rgba(100,150,80,0.10);--b2:rgba(100,150,80,0.20);--b3:rgba(100,150,80,0.38);
    --g:#6EBF7A;--gdim:#3D6B42;--gglow:rgba(110,191,122,0.10);
    --t1:#E2EAE0;--t2:#8FA888;--t3:#4A6148;--t4:#2A3C2A;
    --serif:'Fraunces',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;
    --err:#E07070;--err-bg:rgba(220,80,80,0.08);--err-b:rgba(220,80,80,0.25);
    --gold:#C8B86A;--gold-bg:rgba(200,184,106,0.10);
    --r8:8px;--r12:12px;--r16:16px;--r20:20px;--r24:24px;
  }
  html,body,#root{height:100%;overflow:hidden}
  body{background:var(--bg);font-family:var(--sans);color:var(--t1);-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}

  /* ── Auth ── */
  .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
    background:var(--bg);
    background-image:radial-gradient(ellipse 70% 50% at 85% 10%,rgba(40,80,30,0.28),transparent 55%),
    radial-gradient(ellipse 50% 60% at 5% 90%,rgba(30,60,25,0.20),transparent 55%)}
  .auth-card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--b2);
    border-radius:var(--r24);padding:44px 40px;box-shadow:0 32px 80px rgba(0,0,0,0.55)}
  .auth-logo{display:flex;align-items:center;gap:14px;margin-bottom:36px}
  .auth-logo-icon{width:48px;height:48px;border-radius:var(--r16);flex-shrink:0;
    background:linear-gradient(145deg,#1E3A1A,#3A6E32);font-size:24px;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 0 1px rgba(110,191,122,0.3),0 8px 24px rgba(58,110,50,0.4)}
  .auth-brand{font-family:var(--serif);font-size:28px;color:var(--t1);line-height:1}
  .auth-brand-sub{font-size:10px;color:var(--t3);letter-spacing:0.10em;text-transform:uppercase;margin-top:4px}
  .auth-h{font-family:var(--serif);font-size:22px;color:var(--t1);font-weight:300;margin-bottom:6px}
  .auth-s{font-size:13px;color:var(--t3);margin-bottom:28px;line-height:1.6}
  .auth-field{margin-bottom:18px}
  .auth-label{font-size:11px;color:var(--t2);font-weight:600;letter-spacing:0.06em;
    text-transform:uppercase;margin-bottom:8px;display:block}
  .auth-inp{width:100%;background:var(--bg3);border:1px solid var(--b2);border-radius:var(--r12);
    padding:12px 15px;font-size:14px;color:var(--t1);font-family:var(--sans);
    outline:none;transition:border-color .2s,box-shadow .2s}
  .auth-inp:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(110,191,122,0.10)}
  .auth-inp::placeholder{color:var(--t4)}
  .auth-inp.e{border-color:var(--err-b)}
  .auth-btn{width:100%;padding:14px;border-radius:var(--r12);border:none;cursor:pointer;
    background:linear-gradient(145deg,#2E5828,#4A8C3E);color:white;
    font-size:15px;font-family:var(--sans);font-weight:600;letter-spacing:0.02em;
    transition:all .2s;margin-top:4px}
  .auth-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(74,140,62,.45)}
  .auth-btn:disabled{opacity:0.45;cursor:default}
  .auth-err{background:var(--err-bg);border:1px solid var(--err-b);border-radius:var(--r8);
    padding:10px 14px;font-size:12.5px;color:var(--err);margin-bottom:16px;line-height:1.55}
  .auth-sw{text-align:center;margin-top:24px;font-size:13px;color:var(--t3)}
  .auth-sw-btn{color:var(--g);background:none;border:none;cursor:pointer;
    font-size:13px;font-family:var(--sans);font-weight:600;text-decoration:underline;
    text-decoration-color:rgba(110,191,122,0.35)}

  /* ── App shell ── */
  .app{display:flex;flex-direction:column;height:100vh;overflow:hidden;background:var(--bg);
    background-image:radial-gradient(ellipse 60% 40% at 90% 0%,rgba(40,80,30,0.18),transparent 50%),
    radial-gradient(ellipse 40% 50% at 0% 100%,rgba(30,60,25,0.12),transparent 50%)}

  /* Header */
  .hdr{display:flex;align-items:center;justify-content:space-between;padding:11px 24px;
    border-bottom:1px solid var(--b1);background:rgba(10,18,12,0.94);
    backdrop-filter:blur(24px);flex-shrink:0;position:relative;z-index:10}
  .hdr-l{display:flex;align-items:center;gap:12px}
  .logo{width:38px;height:38px;border-radius:12px;flex-shrink:0;
    background:linear-gradient(145deg,#1E3A1A,#3A6E32);font-size:19px;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 0 1px rgba(110,191,122,0.22),0 4px 14px rgba(58,110,50,0.30)}
  .brand{font-family:var(--serif);font-size:22px;color:var(--t1);letter-spacing:-0.01em;line-height:1}
  .bsub{font-size:10px;color:var(--t3);letter-spacing:0.08em;text-transform:uppercase;margin-top:2px}
  .hdr-r{display:flex;align-items:center;gap:8px}
  .uchip{display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:20px;
    background:rgba(110,191,122,0.06);border:1px solid rgba(110,191,122,0.16)}
  .uav{width:22px;height:22px;border-radius:50%;background:var(--gdim);
    display:flex;align-items:center;justify-content:center;font-size:10px;color:#CEE8C6;font-weight:700}
  .uname{font-size:12px;color:var(--g);font-weight:500}
  .pill{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;border:1px solid}
  .pill.on{color:var(--g);border-color:rgba(110,191,122,0.22);background:rgba(110,191,122,0.06)}
  .pill.off{color:#C27A7A;border-color:rgba(194,122,122,0.22);background:rgba(194,122,122,0.06)}
  .pill.chk{color:var(--t3);border-color:var(--b1)}
  .pdot{width:5px;height:5px;border-radius:50%;background:currentColor}
  .pdot.on{animation:blink 2s ease-in-out infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
  .lbtn{padding:5px 13px;border-radius:20px;border:1px solid var(--b2);background:none;
    color:var(--t3);font-size:11.5px;cursor:pointer;font-family:var(--sans);transition:all .15s}
  .lbtn:hover{border-color:var(--err-b);color:var(--err)}

  /* Banners */
  .banner{padding:9px 24px;display:flex;align-items:center;gap:10px;flex-shrink:0;font-size:12.5px}
  .banner.offline{background:rgba(28,8,8,0.8);border-bottom:1px solid rgba(194,80,80,0.18);color:#E09090}
  .banner.wake{background:rgba(28,22,8,0.8);border-bottom:1px solid rgba(200,180,80,0.18);color:var(--gold)}
  .banner code{background:rgba(255,255,255,0.07);padding:1px 7px;border-radius:4px;font-size:11px}

  /* Tabs */
  .tabs{display:flex;padding:0 16px;border-bottom:1px solid var(--b1);
    background:rgba(10,18,12,0.75);flex-shrink:0;gap:0;overflow-x:auto}
  .tabs::-webkit-scrollbar{display:none}
  .tb{padding:10px 14px;font-size:12.5px;border:none;background:none;cursor:pointer;
    font-family:var(--sans);font-weight:400;display:flex;align-items:center;gap:6px;
    transition:all .15s;border-bottom:2px solid transparent;margin-bottom:-1px;
    color:var(--t3);white-space:nowrap;flex-shrink:0}
  .tb:hover{color:var(--t2)}
  .tb.act{color:var(--g);border-bottom-color:var(--g);font-weight:500}

  .content{flex:1;overflow:hidden;display:flex}

  /* Chat */
  .chat-w{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .msgs{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:18px}
  .mrow{display:flex;gap:10px;max-width:80%;animation:rise .25s ease}
  .mrow.u{align-self:flex-end;flex-direction:row-reverse}
  .mrow.b{align-self:flex-start}
  @keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .av{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;
    align-items:center;justify-content:center;font-size:13px;margin-top:2px}
  .av.b{background:linear-gradient(145deg,#1A3216,#2A5224);border:1px solid rgba(110,191,122,0.22)}
  .av.u{background:var(--bg4);border:1px solid var(--b2);font-size:11px;font-weight:700;color:var(--t2)}
  .bub{padding:12px 16px;font-size:14px;line-height:1.72;white-space:pre-wrap;word-break:break-word}
  .bub.b{background:var(--card);border:1px solid var(--b1);border-radius:3px var(--r16) var(--r16) var(--r16);color:var(--t1)}
  .bub.u{background:linear-gradient(145deg,#1C3818,#264E20);border:1px solid rgba(110,191,122,0.16);border-radius:var(--r16) 3px var(--r16) var(--r16);color:#D0E8C8}
  .meta{display:flex;align-items:center;gap:5px;margin-top:5px;padding-left:2px;flex-wrap:wrap}
  .mtag{font-size:10px;color:var(--t3);display:flex;align-items:center;gap:3px}
  .nb{display:inline-flex;align-items:center;font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid var(--b1);color:var(--t3);background:rgba(255,255,255,0.015)}
  .nb.neg{border-color:rgba(194,122,122,0.25);color:#C27A7A;background:rgba(194,122,122,0.05)}
  .nb.pos{border-color:rgba(168,201,127,0.22);color:#9BC870;background:rgba(168,201,127,0.05)}
  .nb.cri{border-color:rgba(220,70,50,0.35);color:#E06050;background:rgba(220,70,50,0.07);font-weight:600}
  .etag{font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(110,191,122,0.06);border:1px solid rgba(110,191,122,0.16);color:var(--g)}
  .typing{display:flex;gap:10px;align-items:flex-end}
  .tybub{background:var(--card);border:1px solid var(--b1);border-radius:3px var(--r16) var(--r16) var(--r16);padding:14px 18px;display:flex;gap:5px;align-items:center}
  .dot{width:6px;height:6px;border-radius:50%;background:var(--gdim);animation:dp 1.2s ease-in-out infinite}
  .dot:nth-child(2){animation-delay:.22s}.dot:nth-child(3){animation-delay:.44s}
  @keyframes dp{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.12)}}
  .chips{padding:8px 24px 0;display:flex;gap:6px;overflow-x:auto;flex-shrink:0}
  .chips::-webkit-scrollbar{display:none}
  .chip{padding:5px 13px;border-radius:20px;font-size:11.5px;white-space:nowrap;cursor:pointer;
    border:1px solid var(--b2);background:rgba(110,191,122,0.03);
    color:var(--t2);font-family:var(--sans);transition:all .15s}
  .chip:hover{border-color:var(--gdim);background:var(--gglow);color:var(--g)}
  .inp-row{padding:10px 20px 14px;border-top:1px solid var(--b1);
    background:rgba(10,18,12,0.88);backdrop-filter:blur(16px);
    display:flex;gap:8px;align-items:flex-end;flex-shrink:0}
  .inp{flex:1;background:var(--card);border:1px solid var(--b2);border-radius:var(--r20);
    padding:11px 18px;font-size:14px;color:var(--t1);font-family:var(--sans);
    resize:none;outline:none;line-height:1.55;min-height:44px;max-height:120px;transition:border-color .2s}
  .inp::placeholder{color:var(--t4)}
  .inp:focus{border-color:var(--gdim)}
  .sbtn{width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
  .sbtn.on{background:linear-gradient(145deg,#2A5224,#428C38);box-shadow:0 4px 16px rgba(66,140,56,.4)}
  .sbtn.on:hover{transform:scale(1.08)}
  .sbtn.off{background:var(--bg3);border:1px solid var(--b1);cursor:default}

  /* Panels */
  .panel{flex:1;overflow-y:auto;padding:26px 28px;max-width:760px;margin:0 auto;width:100%}
  .ph{font-family:var(--serif);font-size:24px;color:var(--t1);font-weight:300;margin-bottom:4px}
  .ps{font-size:13px;color:var(--t3);margin-bottom:24px;font-weight:300;line-height:1.55}
  .plbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:10px;font-weight:600;margin-top:22px}
  .rsb{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
  .ghost{padding:5px 14px;border-radius:20px;border:1px solid var(--b1);background:none;
    color:var(--t3);font-size:11.5px;cursor:pointer;font-family:var(--sans);transition:all .15s}
  .ghost:hover{border-color:var(--b2);color:var(--t2)}

  /* Joy */
  .jgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
  .jcard{background:var(--card);border:1px solid var(--b1);border-radius:var(--r16);
    padding:18px;cursor:pointer;transition:all .22s}
  .jcard:hover{border-color:var(--b3);transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.32)}
  .jtag{font-size:10px;color:var(--g);font-weight:700;margin-bottom:8px;letter-spacing:.06em}
  .jtxt{font-size:13px;color:var(--t2);line-height:1.5}
  .affm{background:linear-gradient(145deg,#0E1A0C,#131C10);border:1px solid rgba(110,191,122,0.16);
    border-radius:var(--r16);padding:22px 24px;margin-bottom:20px;position:relative;overflow:hidden}
  .affm::after{content:"❝";position:absolute;right:16px;bottom:-10px;font-size:72px;
    color:rgba(110,191,122,0.035);font-family:serif;line-height:1}
  .affm-lbl{font-size:9.5px;color:var(--gdim);letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px;font-weight:700}
  .affm-txt{font-family:var(--serif);font-style:italic;font-size:17px;color:var(--g);line-height:1.65;position:relative;z-index:1}

  /* Breathing */
  .brex-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
  .brex-tab{padding:7px 16px;border-radius:20px;border:1px solid var(--b2);background:none;
    font-size:12px;color:var(--t3);cursor:pointer;font-family:var(--sans);transition:all .15s}
  .brex-tab:hover{color:var(--t2);border-color:var(--b3)}
  .brex-tab.act{border-color:var(--g);background:rgba(110,191,122,0.08);color:var(--g);font-weight:500}
  .brex-card{background:var(--card);border:1px solid var(--b1);border-radius:var(--r16);
    padding:24px;display:flex;flex-direction:column;align-items:center;gap:14px}
  .brex-desc{font-size:12px;color:var(--t3);text-align:center}
  .brex-btn{padding:9px 28px;border-radius:20px;border:1px solid var(--gdim);
    background:rgba(110,191,122,0.08);color:var(--g);font-size:13px;cursor:pointer;
    font-family:var(--sans);font-weight:500;transition:all .2s}
  .brex-btn:hover{background:rgba(110,191,122,0.16)}
  .brex-cycles{font-size:11px;color:var(--t3)}

  /* Mood log */
  .mpick{background:var(--card);border:1px solid var(--b1);border-radius:var(--r16);padding:22px;margin-bottom:18px}
  .mq{font-size:14px;color:var(--t2);margin-bottom:16px;font-weight:300}
  .memojis{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .mbtn{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;
    padding:10px 12px;border-radius:var(--r12);border:2px solid transparent;
    background:var(--bg3);transition:all .18s;font-family:var(--sans)}
  .mbtn:hover{transform:scale(1.08);border-color:var(--b2)}
  .mbtn.sel{border-color:var(--g);background:rgba(110,191,122,.08);transform:scale(1.1)}
  .mej{font-size:26px;line-height:1}
  .mlbl{font-size:9.5px;color:var(--t3);white-space:nowrap}
  .mconf{text-align:center;font-size:12.5px;color:var(--g);margin-top:12px;
    padding:8px;background:rgba(110,191,122,.06);border-radius:var(--r8);border:1px solid rgba(110,191,122,.14)}
  .mchart{background:var(--card);border:1px solid var(--b1);border-radius:var(--r16);padding:20px;margin-bottom:14px}
  .mchart-t{font-size:10px;color:var(--t3);margin-bottom:14px;font-weight:600;letter-spacing:.10em;text-transform:uppercase}
  .mbars{display:flex;align-items:flex-end;gap:6px;height:72px}
  .mbar-c{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}
  .mbar{width:100%;border-radius:3px 3px 0 0;min-height:3px;transition:height .45s ease}
  .mbar-l{font-size:12px;color:var(--t3);text-align:center}
  .ment{display:flex;align-items:center;justify-content:space-between;
    padding:13px 16px;background:var(--card);border:1px solid var(--b1);
    border-radius:var(--r12);margin-bottom:7px;transition:border-color .15s}
  .ment:hover{border-color:var(--b2)}
  .ment-l{display:flex;align-items:center;gap:11px}
  .mej2{font-size:22px}
  .mname{font-size:13.5px;color:var(--t1);font-weight:500}
  .mtime{font-size:10.5px;color:var(--t3);margin-top:1px;font-weight:300}
  .mdot{width:9px;height:9px;border-radius:50%;flex-shrink:0}

  /* Memory */
  .mem{display:flex;gap:12px;padding:14px 16px;background:var(--card);
    border:1px solid var(--b1);border-radius:var(--r12);margin-bottom:9px;
    transition:all .15s;animation:rise .22s ease}
  .mem:hover{border-color:var(--b2)}
  .mem-bar{width:2px;background:linear-gradient(to bottom,var(--gdim),transparent);
    border-radius:2px;flex-shrink:0;align-self:stretch;min-height:20px}
  .mem-txt{font-size:13px;color:var(--t2);line-height:1.55}
  .mem-time{font-size:10.5px;color:var(--t4);margin-top:4px;font-weight:300}
  .cat-tag{font-size:9.5px;padding:2px 8px;border-radius:20px;
    background:rgba(110,191,122,0.07);border:1px solid rgba(110,191,122,0.18);
    color:var(--g);font-weight:600;text-transform:capitalize;display:inline-block;margin-bottom:5px}
  .priv{background:rgba(110,191,122,0.03);border:1px solid rgba(110,191,122,.10);
    border-radius:var(--r12);padding:14px 16px;margin-bottom:20px;
    font-size:12.5px;color:var(--t3);line-height:1.65}

  /* Insights */
  .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
  .stat-card{background:var(--card);border:1px solid var(--b1);border-radius:var(--r16);padding:20px}
  .stat-val{font-family:var(--serif);font-size:36px;color:var(--g);line-height:1;margin-bottom:4px}
  .stat-lbl{font-size:11.5px;color:var(--t3);font-weight:400}
  .stat-sub{font-size:11px;color:var(--t4);margin-top:4px}
  .trend-card{background:var(--card);border:1px solid var(--b1);border-radius:var(--r16);padding:20px;margin-bottom:14px}
  .trend-h{font-size:12px;color:var(--t2);font-weight:500;margin-bottom:14px}
  .trend-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)}
  .trend-row:last-child{border-bottom:none}
  .trend-k{font-size:12.5px;color:var(--t2)}
  .trend-v{font-size:12.5px;color:var(--g);font-weight:500}

  /* Empty */
  .empty{text-align:center;padding:48px 24px;color:var(--t3)}
  .ei{font-size:36px;margin-bottom:12px;opacity:.38}
  .empty p{font-size:13px;font-weight:300;line-height:1.65;max-width:260px;margin:0 auto}

  /* Wake-up spinner */
  .waking{display:flex;flex-direction:column;align-items:center;justify-content:center;
    height:100%;gap:16px;color:var(--t3)}
  .waking-spin{width:32px;height:32px;border:2px solid var(--b2);border-top-color:var(--g);
    border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getToken() { return localStorage.getItem("s_token") || ""; }

async function apiFetch(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = `Bearer ${getToken()}`;
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000), // 30s timeout for cold starts
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw Object.assign(new Error(String(r.status)), { detail: err.detail || "" });
  }
  return r.json();
}

const api = {
  get:  (path, auth) => apiFetch("GET", path, null, auth),
  post: (path, body, auth) => apiFetch("POST", path, body, auth),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BREATHING COMPONENT — completely rewritten, bug-free
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BreathingExercise() {
  const [exIdx,    setExIdx]    = useState(0);
  const [running,  setRunning]  = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count,    setCount]    = useState(0);
  const [cycles,   setCycles]   = useState(0);

  // Use refs so timer callbacks always have fresh values
  const runRef    = useRef(false);
  const phRef     = useRef(0);
  const cntRef    = useRef(0);
  const cycRef    = useRef(0);
  const timerRef  = useRef(null);
  const exIdxRef  = useRef(0);

  // Stop timer cleanly
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  // Tick function — runs every second
  const tick = useCallback(() => {
    if (!runRef.current) return;
    const ex     = BREATHING_EXERCISES[exIdxRef.current];
    const phases = ex.phases;
    const phase  = phases[phRef.current];

    cntRef.current += 1;
    setCount(cntRef.current);

    if (cntRef.current >= phase.d) {
      // Move to next phase
      const nextPh = (phRef.current + 1) % phases.length;
      phRef.current = nextPh;
      cntRef.current = 0;
      setPhaseIdx(nextPh);
      setCount(0);
      if (nextPh === 0) {
        cycRef.current += 1;
        setCycles(cycRef.current);
      }
    }
    timerRef.current = setTimeout(tick, 1000);
  }, []);

  function start() {
    phRef.current   = 0;
    cntRef.current  = 0;
    cycRef.current  = 0;
    exIdxRef.current = exIdx;
    runRef.current  = true;
    setPhaseIdx(0); setCount(0); setCycles(0); setRunning(true);
    timerRef.current = setTimeout(tick, 1000);
  }

  function stop() {
    runRef.current = false;
    stopTimer();
    setRunning(false); setPhaseIdx(0); setCount(0); setCycles(0);
  }

  function switchEx(i) {
    stop();
    setExIdx(i);
    exIdxRef.current = i;
  }

  // Cleanup on unmount
  useEffect(() => () => { runRef.current = false; stopTimer(); }, [stopTimer]);

  const ex    = BREATHING_EXERCISES[exIdx];
  const phase = ex.phases[phaseIdx];
  const prog  = running ? count / phase.d : 0;
  const R = 44, C = 2 * Math.PI * R;

  return (
    <div>
      <div className="brex-tabs">
        {BREATHING_EXERCISES.map((e, i) => (
          <button key={e.id} className={`brex-tab ${exIdx===i?"act":""}`} onClick={() => switchEx(i)}>
            {e.name}
          </button>
        ))}
      </div>
      <div className="brex-card">
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:13, color:"var(--t1)", fontWeight:500, marginBottom:3 }}>{ex.name}</div>
          <div className="brex-desc">{ex.desc}</div>
        </div>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(110,191,122,0.08)" strokeWidth="7"/>
          {running && (
            <circle cx="60" cy="60" r={R} fill="none" stroke={phase.c} strokeWidth="7"
              strokeDasharray={C} strokeDashoffset={C * (1 - prog)} strokeLinecap="round"
              style={{ transform:"rotate(-90deg)", transformOrigin:"50% 50%", transition:"stroke-dashoffset 0.95s linear, stroke 0.3s ease" }}
            />
          )}
          {!running && (
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(110,191,122,0.14)" strokeWidth="7"
              strokeDasharray="4 8" strokeLinecap="round"
            />
          )}
          <text x="60" y="54" textAnchor="middle" fill="rgba(200,220,190,0.4)" fontSize="11" fontFamily="Plus Jakarta Sans">
            {running ? phase.l : "Ready"}
          </text>
          <text x="60" y="76" textAnchor="middle" fill="rgba(220,235,215,0.92)" fontSize="28" fontFamily="Fraunces">
            {running ? (phase.d - count) : "·"}
          </text>
        </svg>
        <button className="brex-btn" onClick={running ? stop : start}>
          {running ? "Stop" : "Begin"}
        </button>
        {cycles > 0 && <div className="brex-cycles">{cycles} cycle{cycles>1?"s":""} completed 🌿</div>}
        {!running && (
          <div style={{ fontSize:11, color:"var(--t3)", textAlign:"center", lineHeight:1.6 }}>
            {ex.phases.map(p => `${p.l} ${p.d}s`).join(" → ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NLP BADGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function NlpBadges({ nlp }) {
  if (!nlp) return null;
  const s   = nlp.sentiment_score || 0;
  const cls = s >= 0.15 ? "pos" : s <= -0.1 ? "neg" : "";
  const emotions = (nlp.emotions || []).filter(e => e !== "crisis").slice(0, 3);
  return (
    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
      <span className={`nb ${cls}`}>{nlp.sentiment_label} {s > 0 ? "+" : ""}{s}</span>
      {emotions.map(e => <span key={e} className="etag">{EMOTION_EMOJI[e] || ""} {e}</span>)}
      {nlp.crisis_detected && <span className="nb cri">🆘 crisis detected</span>}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOOD CHART
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MoodChart({ moodLog }) {
  if (moodLog.length < 2) return null;
  const order = ["sad", "neutral", "calm", "happy", "great"];
  const recent = [...moodLog].slice(0, 8).reverse();
  return (
    <div className="mchart">
      <div className="mchart-t">Mood trend — last {recent.length} entries</div>
      <div className="mbars">
        {recent.map((e, i) => {
          const idx = order.indexOf(e.mood) + 1;
          const h   = idx > 0 ? Math.round((idx / 5) * 64) : 4;
          return (
            <div key={i} className="mbar-c">
              <div className="mbar" style={{ height:h, background:MOOD_COLORS[e.mood]||"#444", opacity:0.72 }} title={e.mood} />
              <div className="mbar-l">{MOOD_EMOJIS[e.mood]||"😐"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSIGHTS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function InsightsPanel({ moodLog, memories, messageCount }) {
  if (moodLog.length === 0 && memories.length === 0) {
    return (
      <div className="panel">
        <div className="ph">Insights</div>
        <div className="ps">Your wellness patterns will appear here after a few days of use.</div>
        <div className="empty"><div className="ei">📈</div><p>Start chatting and logging your mood — Serenity will build a picture of your patterns over time.</p></div>
      </div>
    );
  }

  const moodOrder  = { sad:1, neutral:2, calm:3, happy:4, great:5 };
  const moodCounts = {};
  moodLog.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood]||0)+1; });
  const topMood    = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0];

  const recent4 = moodLog.slice(0,4).map(m => moodOrder[m.mood]||3);
  const older4  = moodLog.slice(4,8).map(m => moodOrder[m.mood]||3);
  const rAvg    = recent4.length ? recent4.reduce((a,b)=>a+b,0)/recent4.length : 3;
  const oAvg    = older4.length  ? older4.reduce((a,b)=>a+b,0)/older4.length  : 3;
  const trend   = rAvg > oAvg+0.4 ? "📈 Improving" : rAvg < oAvg-0.4 ? "📉 Needs attention" : "➡️ Stable";

  const catCounts = {};
  memories.forEach(m => { if(m.category) catCounts[m.category]=(catCounts[m.category]||0)+1; });
  const topTheme = Object.entries(catCounts).sort((a,b)=>b[1]-a[1])[0];

  const anxiousCount = moodLog.filter(m => m.mood==="anxious"||m.mood==="overwhelmed").length;
  const calmCount    = moodLog.filter(m => m.mood==="calm"||m.mood==="happy"||m.mood==="great").length;

  return (
    <div className="panel">
      <div className="ph">Insights</div>
      <div className="ps">Your wellness patterns, based on your logs and conversations.</div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-val">{moodLog.length}</div>
          <div className="stat-lbl">Mood entries logged</div>
          <div className="stat-sub">Keep it up 🌿</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{messageCount}</div>
          <div className="stat-lbl">Conversations</div>
          <div className="stat-sub">You're not alone</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{memories.length}</div>
          <div className="stat-lbl">Memories stored</div>
          <div className="stat-sub">Serenity remembers you</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{calmCount}</div>
          <div className="stat-lbl">Good days logged</div>
          <div className="stat-sub">out of {moodLog.length} total</div>
        </div>
      </div>

      <div className="trend-card">
        <div className="trend-h">📊 Pattern Summary</div>
        {topMood && (
          <div className="trend-row">
            <span className="trend-k">Most frequent mood</span>
            <span className="trend-v">{MOOD_EMOJIS[topMood[0]]||""} {MOOD_LABELS[topMood[0]]||topMood[0]} ({topMood[1]}×)</span>
          </div>
        )}
        <div className="trend-row">
          <span className="trend-k">Recent trend</span>
          <span className="trend-v">{trend}</span>
        </div>
        {topTheme && (
          <div className="trend-row">
            <span className="trend-k">Top conversation theme</span>
            <span className="trend-v" style={{ textTransform:"capitalize" }}>{topTheme[0]}</span>
          </div>
        )}
        {anxiousCount > 0 && (
          <div className="trend-row">
            <span className="trend-k">Difficult days</span>
            <span className="trend-v" style={{ color:"#C27A7A" }}>{anxiousCount} logged</span>
          </div>
        )}
      </div>

      <MoodChart moodLog={moodLog} />

      <div style={{ background:"var(--card)", border:"1px solid var(--b1)", borderRadius:"var(--r16)", padding:18, marginTop:8 }}>
        <div style={{ fontSize:11, color:"var(--gdim)", fontWeight:700, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:12 }}>💡 Serenity's note</div>
        <div style={{ fontSize:13.5, color:"var(--t2)", lineHeight:1.7, fontFamily:"var(--serif)", fontStyle:"italic" }}>
          {calmCount > anxiousCount
            ? `Your good days outnumber the hard ones — ${calmCount} vs ${anxiousCount}. That's something worth remembering on tough days.`
            : anxiousCount > 3
            ? `You've had ${anxiousCount} difficult days logged. That's okay — and it's brave to track it. Consider talking to Serenity about what's been driving those feelings.`
            : `You're ${moodLog.length < 5 ? "just getting started" : "building a solid picture of yourself"}. Every entry helps Serenity understand you better.`
          }
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AuthScreen({ onLogin }) {
  const [mode,    setMode]    = useState("login");
  const [user,    setUser]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [waking,  setWaking]  = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const path = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register" ? { username:user, email, password:pass } : { username:user, password:pass };
      const data = await api.post(path, body, false);
      localStorage.setItem("s_token",    data.token);
      localStorage.setItem("s_username", data.username);
      onLogin(data.username);
    } catch (e) {
      // 503 likely means Render is waking up
      if (e.message === "503" || e.message === "Failed to fetch") {
        setWaking(true);
        setErr("Server is waking up (Render free tier). Please wait 20-30 seconds and try again.");
      } else {
        setErr(e.detail || (mode==="login" ? "Invalid username or password." : "Registration failed. Please try again."));
      }
    }
    setLoading(false);
  }

  function toggle() { setMode(m => m==="login"?"register":"login"); setErr(""); setUser(""); setEmail(""); setPass(""); setWaking(false); }

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🌿</div>
            <div>
              <div className="auth-brand">Serenity</div>
              <div className="auth-brand-sub">Your mental wellness companion</div>
            </div>
          </div>

          <div className="auth-h">{mode==="login" ? "Welcome back" : "Create your space"}</div>
          <div className="auth-s">
            {mode==="login"
              ? "Sign in to continue your wellness journey."
              : "Your memories, mood patterns, and chats — private and yours."}
          </div>

          {err && (
            <div className="auth-err">
              {waking && <div style={{ marginBottom:6 }}>⏳ <strong>Server waking up...</strong></div>}
              {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-field">
              <label className="auth-label">{mode==="login" ? "Username or email" : "Username"}</label>
              <input className={`auth-inp${err?" e":""}`} type="text" value={user}
                placeholder={mode==="login" ? "your username or email" : "choose a username"}
                onChange={e => { setUser(e.target.value); setErr(""); }} required autoComplete="username" />
            </div>
            {mode==="register" && (
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input className={`auth-inp${err?" e":""}`} type="email" value={email}
                  placeholder="your@email.com"
                  onChange={e => { setEmail(e.target.value); setErr(""); }} required autoComplete="email" />
              </div>
            )}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className={`auth-inp${err?" e":""}`} type="password" value={pass}
                placeholder={mode==="register" ? "at least 6 characters" : "your password"}
                onChange={e => { setPass(e.target.value); setErr(""); }} required
                autoComplete={mode==="login" ? "current-password" : "new-password"} />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Please wait…" : mode==="login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <div className="auth-sw">
            {mode==="login" ? "New here? " : "Already have an account? "}
            <button className="auth-sw-btn" onClick={toggle}>
              {mode==="login" ? "Create an account" : "Sign in instead"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MainApp({ username, onLogout }) {
  const [tab,        setTab]        = useState("chat");
  const [messages,   setMessages]   = useState([{
    role:"assistant",
    content:`Hello, I'm Serenity 🌿\n\nGood to see you, ${username}. I'm here to listen without judgment, support you through whatever you're carrying, and help you find calm. How are you feeling right now?`,
  }]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [memories,   setMemories]   = useState([]);
  const [moodLog,    setMoodLog]    = useState([]);
  const [todayMood,  setTodayMood]  = useState(null);
  const [joyItems,   setJoyItems]   = useState(() => [...INSTANT_JOY].sort(()=>Math.random()-.5).slice(0,4));
  const [affirmation]               = useState(() => AFFIRMATIONS[Math.floor(Math.random()*AFFIRMATIONS.length)]);
  const [apiStatus,  setApiStatus]  = useState("checking");
  const [msgCount,   setMsgCount]   = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const bottomRef = useRef(null);

  // Health check with retry for Render cold starts
  useEffect(() => {
    let attempts = 0;
    const check = async () => {
      try {
        await api.get("/health", false);
        setApiStatus("online");
      } catch {
        attempts++;
        if (attempts < 3) { setTimeout(check, 5000); }
        else { setApiStatus("offline"); }
      }
    };
    check();
  }, [retryCount]);

  // Load data on tab change
  useEffect(() => {
    if (tab==="memory")  api.get("/memories").then(d=>setMemories(d.memories||[])).catch(()=>setMemories([]));
    if (tab==="mood"||tab==="stats") api.get("/mood").then(d=>setMoodLog(d.moods||[])).catch(()=>setMoodLog([]));
  }, [tab]);

  // Load message count for insights
  useEffect(() => {
    api.get("/history?limit=200").then(d => setMsgCount(Math.floor((d.messages||[]).length/2))).catch(()=>{});
  }, [messages.length]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  // Auto-resize textarea
  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  async function send(text) {
    const msg = text.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { role:"user", content:msg }]);
    setInput(""); setLoading(true);
    // reset textarea height
    const ta = document.querySelector(".inp");
    if (ta) ta.style.height = "auto";

    try {
      const data = await api.post("/chat", { message:msg });
      setMessages(p => [...p, { role:"assistant", content:data.reply, mood:data.mood, nlp:data.nlp }]);
      // Refresh memories silently
      api.get("/memories").then(d=>setMemories(d.memories||[])).catch(()=>{});
      if (apiStatus !== "online") setApiStatus("online");
    } catch (e) {
      const code = e.message;
      let reply = "Backend isn't reachable right now. If deployed on Render, it may be waking up — please wait 20 seconds and try again.";
      if (code==="401") { reply="Session expired. Please sign in again."; onLogout(); return; }
      if (code==="402") reply="HuggingFace free tier credits used up for this month. Try again tomorrow.";
      setMessages(p => [...p, { role:"assistant", content:reply }]);
      setApiStatus("offline");
    }
    setLoading(false);
  }

  async function logMood(val) {
    setTodayMood(val);
    try {
      await api.post("/mood", { mood:val });
      const d = await api.get("/mood");
      setMoodLog(d.moods||[]);
    } catch {}
  }

  async function clearMem() {
    try { await api.post("/memories/clear", {}); setMemories([]); } catch {}
  }

  const canSend = !!input.trim() && !loading;

  return (
    <div className="app">
      {/* Header */}
      <div className="hdr">
        <div className="hdr-l">
          <div className="logo">🌿</div>
          <div>
            <div className="brand">Serenity</div>
            <div className="bsub">Your mental wellness companion</div>
          </div>
        </div>
        <div className="hdr-r">
          <div className="uchip">
            <div className="uav">{username[0].toUpperCase()}</div>
            <div className="uname">{username}</div>
          </div>
          <div className={`pill ${apiStatus==="online"?"on":apiStatus==="offline"?"off":"chk"}`}>
            <div className={`pdot ${apiStatus==="online"?"on":""}`}/>
            {apiStatus==="checking"?"Connecting…":apiStatus==="online"?"Online":"Offline"}
          </div>
          <button className="lbtn" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      {/* Banners */}
      {apiStatus==="offline" && (
        <div className="banner offline">
          ⚠️&nbsp;
          <span>Backend offline. If using Render free tier, it may be waking up — wait 30s and{" "}
            <button onClick={() => { setRetryCount(c=>c+1); setApiStatus("checking"); }}
              style={{ color:"#F0A0A0", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", font:"inherit" }}>
              retry
            </button>. Or set <code>API_BASE</code> in App.jsx to your backend URL.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tb ${tab===t.id?"act":""}`} onClick={()=>setTab(t.id)}>
            <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="content">

        {/* ══════════════ CHAT ══════════════ */}
        {tab==="chat" && (
          <div className="chat-w">
            <div className="msgs">
              {messages.map((msg,i) => (
                <div key={i} className={`mrow ${msg.role==="user"?"u":"b"}`}>
                  <div className={`av ${msg.role==="user"?"u":"b"}`}>
                    {msg.role==="user" ? username[0].toUpperCase() : "🌿"}
                  </div>
                  <div>
                    <div className={`bub ${msg.role==="user"?"u":"b"}`}>{msg.content}</div>
                    {msg.role==="assistant" && (msg.mood||msg.nlp) && (
                      <div className="meta">
                        {msg.mood && <span className="mtag">{MOOD_EMOJIS[msg.mood]||"🌿"} {msg.mood}</span>}
                        {msg.nlp && <NlpBadges nlp={msg.nlp}/>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="typing">
                  <div className="av b">🌿</div>
                  <div className="tybub"><div className="dot"/><div className="dot"/><div className="dot"/></div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div className="chips">
              {QUICK_CHIPS.map(c => (
                <button key={c.label} className="chip" onClick={()=>send(c.msg)}>{c.label}</button>
              ))}
            </div>

            <div className="inp-row">
              <textarea className="inp" rows={1} value={input}
                onChange={handleInput}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);} }}
                placeholder="Share how you're feeling… (Enter to send, Shift+Enter for new line)"
              />
              <button className={`sbtn ${canSend?"on":"off"}`} onClick={()=>send(input)} disabled={!canSend}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={canSend?"white":"#2A3C2A"} strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ INSTANT JOY ══════════════ */}
        {tab==="joy" && (
          <div className="panel">
            <div className="rsb">
              <div>
                <div className="ph">Instant Joy</div>
                <div className="ps">Small acts that can shift your mood right now</div>
              </div>
              <button className="ghost" onClick={()=>setJoyItems([...INSTANT_JOY].sort(()=>Math.random()-.5).slice(0,4))}>
                🔀 Shuffle
              </button>
            </div>
            <div className="jgrid">
              {joyItems.map((item,i) => (
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

            <div className="plbl">Breathing exercises</div>
            <BreathingExercise />
          </div>
        )}

        {/* ══════════════ MOOD LOG ══════════════ */}
        {tab==="mood" && (
          <div className="panel">
            <div className="ph">Mood Log</div>
            <div className="ps">Track how you feel — patterns reveal themselves over time</div>

            <div className="mpick">
              <div className="mq">How are you feeling right now?</div>
              <div className="memojis">
                {MOOD_OPTIONS.map(m => (
                  <button key={m.value} className={`mbtn ${todayMood===m.value?"sel":""}`}
                    style={todayMood===m.value?{borderColor:m.color,background:m.bg}:{}}
                    onClick={()=>logMood(m.value)}>
                    <span className="mej">{m.label}</span>
                    <span className="mlbl">{m.text}</span>
                  </button>
                ))}
              </div>
              {todayMood && (
                <div className="mconf">
                  {MOOD_EMOJIS[todayMood]||todayMood} Logged — {MOOD_LABELS[todayMood]||todayMood}
                </div>
              )}
            </div>

            <MoodChart moodLog={moodLog}/>

            <div className="plbl" style={{ marginTop:6 }}>Recent entries</div>
            {moodLog.length===0
              ? <div className="empty"><div className="ei">📊</div><p>No entries yet. Select how you're feeling above to start.</p></div>
              : moodLog.map((e,i) => (
                <div key={i} className="ment">
                  <div className="ment-l">
                    <div className="mej2">{MOOD_EMOJIS[e.mood]||"😐"}</div>
                    <div>
                      <div className="mname">{MOOD_LABELS[e.mood]||e.mood}</div>
                      <div className="mtime">{e.created_at}</div>
                    </div>
                  </div>
                  <div className="mdot" style={{ background:MOOD_COLORS[e.mood]||"#555" }}/>
                </div>
              ))
            }
          </div>
        )}

        {/* ══════════════ MEMORY ══════════════ */}
        {tab==="memory" && (
          <div className="panel">
            <div className="rsb">
              <div>
                <div className="ph">Memory</div>
                <div className="ps">What Serenity remembers from your conversations</div>
              </div>
              {memories.length>0 && <button className="ghost" onClick={clearMem}>Clear all</button>}
            </div>
            <div className="priv">
              <strong style={{ color:"var(--g)" }}>🔒 Private by design.</strong>{" "}
              Stored in SQLite tied to your account. Never shared, never used to train models. Serenity uses these to give you personalised, context-aware responses.
            </div>
            {memories.length===0
              ? <div className="empty"><div className="ei">🧠</div><p>No memories yet. Start chatting and Serenity will remember what matters.</p></div>
              : memories.map((m,i) => (
                <div key={i} className="mem">
                  <div className="mem-bar"/>
                  <div style={{ flex:1 }}>
                    {m.category && m.category!=="general" && <div className="cat-tag">{m.category}</div>}
                    <div className="mem-txt">{m.snippet}</div>
                    <div className="mem-time">{m.created_at}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ══════════════ INSIGHTS ══════════════ */}
        {tab==="stats" && (
          <InsightsPanel moodLog={moodLog} memories={memories} messageCount={msgCount}/>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [username, setUsername] = useState(()=>localStorage.getItem("s_username")||"");
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(()=>{
    const token = localStorage.getItem("s_token");
    if (!token) { setChecking(false); return; }
    api.get("/me")
      .then(d=>{ setUsername(d.username); setVerified(true); setChecking(false); })
      .catch(()=>{ localStorage.removeItem("s_token"); localStorage.removeItem("s_username"); setChecking(false); });
  },[]);

  function handleLogin(uname) { setUsername(uname); setVerified(true); }
  function handleLogout() {
    localStorage.removeItem("s_token"); localStorage.removeItem("s_username");
    setVerified(false); setUsername("");
  }

  if (checking) return (
    <>
      <style>{css}</style>
      <div style={{ height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--bg)",gap:16 }}>
        <div style={{ fontFamily:"var(--serif)",fontSize:28,color:"var(--g)",opacity:0.75 }}>Serenity 🌿</div>
        <div style={{ width:24,height:24,border:"2px solid var(--b2)",borderTopColor:"var(--g)",borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
      </div>
    </>
  );

  if (!verified) return <AuthScreen onLogin={handleLogin}/>;

  return (
    <>
      <style>{css}</style>
      <MainApp username={username} onLogout={handleLogout}/>
    </>
  );
}
