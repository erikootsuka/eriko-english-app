import { useState, useEffect, useRef } from "react";
import mammoth from "mammoth";

// ===================== CONSTANTS =====================
const STORAGE = {
  phrases: "eriko_phrases_v2",
  vocab: "eriko_vocab_v2",
  goals: "eriko_goals_v2",
  progress: "eriko_progress_v2",
  diary: "eriko_diary_v2",
  weaknesses: "eriko_weaknesses_v2",
};

const LEVELS = ["初級", "中級", "上級"];
const PHRASE_CATS = ["すべて", "ビジネス挨拶", "規制対応", "締めくくり", "カジュアル表現", "日記表現", "インポート"];
const VOCAB_CATS = ["すべて", "一般", "医薬品", "規制", "ビジネス", "イディオム"];
const PARTS = ["名詞", "動詞", "形容詞", "副詞", "イディオム", "フレーズ"];

// ===================== VERSION =====================
const BUILD_VERSION = "2026-06-18";

// ===================== DESIGN TOKENS =====================
const C = {
  primary: "#0ea5e9",
  primaryDark: "#0284c7",
  primaryLight: "#e0f2fe",
  primaryMid: "#bae6fd",
  accent: "#f97316",
  accentLight: "#fff7ed",
  accentMid: "#fed7aa",
  success: "#16a34a",
  successLight: "#f0fdf4",
  successMid: "#bbf7d0",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  dangerMid: "#fca5a5",
  warn: "#d97706",
  warnLight: "#fffbeb",
  warnMid: "#fde68a",
  purple: "#7c3aed",
  purpleLight: "#f5f3ff",
  dark: "#0f172a",
  slate: "#1e293b",
  mid: "#475569",
  muted: "#64748b",
  subtle: "#94a3b8",
  border: "#e2e8f0",
  bg: "#f0f9ff",
  card: "#ffffff",
  surface: "#f8fafc",
};

const SAMPLE_PHRASES = [
  { id:"sp1", japanese:"ご返信ありがとうございます。", english:"Thank you for your response.", context:"断りへのお礼", category:"ビジネス挨拶", level:"初級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp2", japanese:"ご連絡いただきありがとうございます。", english:"Thank you for letting me know.", context:"断りへのお礼", category:"ビジネス挨拶", level:"初級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp3", japanese:"ご検討いただき、ありがとうございました。", english:"I appreciate your time and consideration.", context:"フォーマルなお礼", category:"ビジネス挨拶", level:"中級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp4", japanese:"またいつかご一緒できる機会があることを願っております。", english:"I hope we'll have the opportunity to work together in the future.", context:"関係継続の締めくくり", category:"締めくくり", level:"中級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp5", japanese:"以下の条件が満たされる場合において、規制当局に赴いてプレゼンとディスカッションを行いたいと思います。", english:"If the following conditions are met, we would like to visit the regulatory authority to conduct a presentation and engage in further discussion.", context:"規制当局へのアポイント", category:"規制対応", level:"上級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp6", japanese:"もし時期が遅れる場合は、ご都合の良い時期をお教えください。", english:"If a later date is necessary, we would appreciate it if you could kindly advise us of the available timing.", context:"日程調整", category:"規制対応", level:"中級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp7", japanese:"今後ともよろしくお願いします。", english:"We appreciate your continued support and cooperation.", context:"メール締め", category:"締めくくり", level:"初級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp8", japanese:"もしかしてAをBに紹介してくれたのはあなたですか？", english:"Was it you who kindly introduced A to B, by any chance?", context:"カジュアルな確認", category:"カジュアル表現", level:"中級", source:"コパイロット", addedDate:"2025-08-08" },
  { id:"sp9", japanese:"承知いたしました。改めてお時間をいただきありがとうございました。", english:"I understand, and thank you again for your time.", context:"フォーマルなお礼", category:"ビジネス挨拶", level:"初級", source:"コパイロット", addedDate:"2025-08-05" },
  { id:"sp10", japanese:"リジェクトの理由と今後の審査方法を明確にしたいと思います。", english:"Our intention is to understand the reasons behind the rejection and to clarify how the product would be evaluated in future reviews.", context:"規制当局への意図説明", category:"規制対応", level:"上級", source:"コパイロット", addedDate:"2025-08-05" },
];

const SAMPLE_VOCAB = [
  { id:"sv1", word:"regulatory authority", meaning:"規制当局", partOfSpeech:"名詞", example:"We visited the regulatory authority for a discussion.", category:"規制", level:"中級", addedDate:"2025-08-05" },
  { id:"sv2", word:"pharmacovigilance", meaning:"薬剤監視活動", partOfSpeech:"名詞", example:"Routine pharmacovigilance ensures patient safety.", category:"医薬品", level:"上級", addedDate:"2025-08-05" },
  { id:"sv3", word:"dossier", meaning:"申請資料・書類", partOfSpeech:"名詞", example:"The dossier was submitted to Thai FDA.", category:"規制", level:"中級", addedDate:"2025-08-05" },
  { id:"sv4", word:"come to terms with", meaning:"〜を受け入れる", partOfSpeech:"イディオム", example:"It took time to come to terms with the rejection.", category:"イディオム", level:"中級", addedDate:"2025-08-05" },
  { id:"sv5", word:"adverse drug reaction", meaning:"副作用", partOfSpeech:"名詞", example:"The adverse drug reaction was reported to PMDA.", category:"医薬品", level:"上級", addedDate:"2025-08-05" },
];

// ===================== UTILS =====================
const uid = () => "id" + Date.now() + Math.random().toString(36).slice(2,5);
const today = () => new Date().toISOString().slice(0,10);
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function getStreak(prog) {
  if (!prog.length) return 0;
  const dates = [...new Set(prog.map(p => p.date))].sort().reverse();
  let streak = 0, cur = new Date();
  for (const d of dates) {
    const diff = Math.round((cur - new Date(d)) / 86400000);
    if (diff <= 1) { streak++; cur = new Date(d); } else break;
  }
  return streak;
}

function levelColor(level) {
  return level === "初級" ? C.success : level === "中級" ? C.warn : C.danger;
}
function levelBg(level) {
  return level === "初級" ? C.successLight : level === "中級" ? C.warnLight : C.dangerLight;
}

// ===================== TTS =====================
function speak(text, onEnd) {
  if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith("en") && v.localService) || voices.find(v => v.lang.startsWith("en"));
  if (enVoice) utter.voice = enVoice;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ===================== API =====================
async function callClaude(systemPrompt, userMessage) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, message: userMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ===================== PDF TEXT EXTRACTION =====================
async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await loadPdfJs();
        const pdfLib = window.pdfjsLib;
        if (!pdfLib) { resolve(""); return; }
        pdfLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfLib.getDocument({ data: typedArray }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(" ") + "\n";
        }
        resolve(fullText);
      } catch { resolve(""); }
    };
    reader.onerror = () => resolve("");
    reader.readAsArrayBuffer(file);
  });
}

function loadPdfJs() {
  return new Promise((resolve) => {
    if (window.pdfjsLib) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

// ===================== DIARY QUIZ GENERATOR =====================
function buildDiaryQuizPool(diaryEntries) {
  const pool = [];
  diaryEntries.forEach(entry => {
    (entry.corrections || []).forEach(c => {
      if (c.original && c.corrected) {
        pool.push({
          id: `dq_${entry.id}_${uid()}`,
          english: c.corrected,
          japanese: c.explanation || "日記の添削より",
          context: `日記 ${entry.date} の修正表現`,
          level: "中級",
          source: "日記履歴",
          category: "日記表現",
          diaryOriginal: c.original,
          diaryDate: entry.date,
          isDiaryItem: true,
        });
      }
    });
    (entry.newPhrases || []).forEach(p => {
      if (p.english && p.japanese) {
        pool.push({
          id: `dp_${entry.id}_${uid()}`,
          english: p.english,
          japanese: p.japanese,
          context: p.context || `日記 ${entry.date} の表現`,
          level: p.level || "中級",
          source: "日記履歴",
          category: "日記表現",
          diaryDate: entry.date,
          isDiaryItem: true,
        });
      }
    });
  });
  return pool;
}

// ===================== COMPONENTS =====================

function Nav({ active, onChange }) {
  const tabs = [
    { id:"home", icon:"🏠", label:"ホーム" },
    { id:"phrases", icon:"📚", label:"表現集" },
    { id:"practice", icon:"🎤", label:"練習" },
    { id:"quiz", icon:"✏️", label:"クイズ" },
    { id:"diary", icon:"📔", label:"日記" },
    { id:"goals", icon:"🎯", label:"目標" },
  ];
  return (
    <nav style={{ display:"flex", borderTop:`1px solid ${C.border}`, background:C.card, position:"sticky", bottom:0, zIndex:20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex:1, padding:"8px 2px 6px", border:"none", background:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:1,
          color: active===t.id ? C.primary : C.subtle,
          borderTop: active===t.id ? `2px solid ${C.primary}` : "2px solid transparent",
          fontSize:10, fontWeight: active===t.id ? 700 : 400,
        }}>
          <span style={{ fontSize:17 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
  );
}

// ===================== HOME TAB =====================
function HomeTab({ phrases, vocab, progress, goals, onNavigate }) {
  const t = today();
  const todayCount = progress.filter(p => p.date===t).length;
  const streak = getStreak(progress);
  const mastered = [...new Set(progress.filter(p=>p.correct).map(p=>p.id))].length;
  const activeGoal = goals.find(g=>!g.completed);
  const levelCounts = { 初級:0, 中級:0, 上級:0 };
  phrases.forEach(p => levelCounts[p.level] = (levelCounts[p.level]||0)+1);

  return (
    <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{
          width:44, height:44, borderRadius:12,
          background:`linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, fontWeight:900, color:"#fff", flexShrink:0,
          boxShadow:`0 2px 8px ${C.primary}44`,
        }}>E</div>
        <div>
          <p style={{ margin:0, color:C.muted, fontSize:12 }}>おかえりなさい</p>
          <h2 style={{ margin:"2px 0 0", fontSize:20, color:C.slate, fontWeight:800, letterSpacing:"-0.5px" }}>Eriko's English</h2>
        </div>
        {/* FIX: バージョン表示 */}
        <div style={{ marginLeft:"auto", fontSize:9, color:C.subtle, textAlign:"right" }}>
          v{BUILD_VERSION}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { label:"連続学習", value:streak, unit:"日", color:C.accent },
          { label:"今日の演習", value:todayCount, unit:"回", color:C.primary },
          { label:"習得済み", value:mastered, unit:"表現", color:C.success },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, borderRadius:12, padding:"12px 6px", textAlign:"center", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:C.muted }}>{s.unit}</div>
            <div style={{ fontSize:9, color:C.subtle }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, borderRadius:12, padding:14, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.mid, marginBottom:10 }}>📊 レベル別表現数</div>
        {LEVELS.map(lv => (
          <div key={lv} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:700, color:levelColor(lv), width:28 }}>{lv}</span>
            <div style={{ flex:1, height:6, background:C.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ width:(Math.min(100,(levelCounts[lv]||0)/Math.max(1,phrases.length)*100)) + "%", height:"100%", background:levelColor(lv), borderRadius:99 }} />
            </div>
            <span style={{ fontSize:10, color:C.subtle, width:20, textAlign:"right" }}>{levelCounts[lv]||0}</span>
          </div>
        ))}
      </div>

      {activeGoal && (
        <div style={{ background:`linear-gradient(135deg,${C.primaryLight},${C.primaryMid})`, borderRadius:12, padding:14, border:`1px solid ${C.primaryMid}` }}>
          <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:4 }}>🎯 進行中の目標</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.slate }}>{activeGoal.title}</div>
          <div style={{ marginTop:8, background:C.primaryMid, borderRadius:99, height:6, overflow:"hidden" }}>
            <div style={{ width:Math.min(100,Math.round((activeGoal.current/activeGoal.target)*100)) + "%", height:"100%", background:C.primary, borderRadius:99, transition:"width 0.4s" }} />
          </div>
          <div style={{ fontSize:11, color:C.primaryDark, marginTop:4 }}>{activeGoal.current} / {activeGoal.target} {activeGoal.unit}</div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { label:"クイズを解く", icon:"✏️", tab:"quiz", color:C.primary, bg:C.primaryLight },
          { label:"日記を書く", icon:"📔", tab:"diary", color:C.purple, bg:C.purpleLight },
          { label:"練習する", icon:"🎤", tab:"practice", color:C.accent, bg:C.accentLight },
          { label:"表現集を見る", icon:"📚", tab:"phrases", color:C.success, bg:C.successLight },
          { label:"語彙を覚える", icon:"🔤", tab:"vocab", color:C.warn, bg:C.warnLight },
          { label:"＋語彙を追加", icon:"📖", tab:"vocab_add", color:C.purple, bg:C.purpleLight },
        ].map(a => (
          <button key={a.tab} onClick={() => onNavigate(a.tab)} style={{
            background:a.bg, border:`1px solid ${a.color}22`, borderRadius:12,
            padding:"14px 10px", cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{ fontSize:20 }}>{a.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color:a.color }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===================== PHRASE EDIT MODAL =====================
function PhraseEditModal({ phrase, onSave, onClose }) {
  const [edited, setEdited] = useState({ ...phrase });
  const [autoLevelLoading, setAutoLevelLoading] = useState(false);
  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", outline:"none" };

  async function autoLevel() {
    setAutoLevelLoading(true);
    try {
      const sys = `You are an English level assessor for a Japanese pharmaceutical professional.
Classify the difficulty using STRICT criteria:
- 初級: Short phrases, common everyday words only, junior high school English level, simple greetings or very basic business expressions (under ~10 words, no complex grammar)
- 中級: Multiple clauses OR business-specific vocabulary OR conditional forms OR compound sentences
- 上級: Long complex sentences AND/OR regulatory/pharmaceutical/legal/scientific terminology AND/OR complex grammar
Return ONLY one word: 初級, 中級, or 上級`;
      const resp = (await callClaude(sys, edited.english)).trim();
      if (LEVELS.includes(resp)) setEdited(e => ({ ...e, level: resp }));
    } catch {}
    setAutoLevelLoading(false);
  }

  return (
    <Modal onClose={onClose}>
      <h4 style={{ margin:"0 0 12px", fontSize:15 }}>表現を編集</h4>
      <Field label="英語 *">
        <input value={edited.english} onChange={e => setEdited(p => ({ ...p, english: e.target.value }))} style={inp} />
      </Field>
      <Field label="日本語訳">
        <input value={edited.japanese} onChange={e => setEdited(p => ({ ...p, japanese: e.target.value }))} placeholder="日本語訳" style={inp} />
      </Field>
      <Field label="使う場面">
        <input value={edited.context} onChange={e => setEdited(p => ({ ...p, context: e.target.value }))} placeholder="例: メールの締め" style={inp} />
      </Field>
      <Field label="カテゴリー">
        <select value={edited.category} onChange={e => setEdited(p => ({ ...p, category: e.target.value }))} style={inp}>
          {PHRASE_CATS.filter(c => c !== "すべて").map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="難易度">
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => setEdited(p => ({ ...p, level: l }))} style={{
              flex:1, padding:"6px 0", borderRadius:8, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:700,
              background: edited.level === l ? levelColor(l) : C.surface,
              color: edited.level === l ? "#fff" : levelColor(l),
            }}>{l}</button>
          ))}
          <button onClick={autoLevel} disabled={autoLevelLoading} style={{
            padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`,
            background:C.surface, cursor:"pointer", fontSize:11, color:C.mid, whiteSpace:"nowrap",
          }}>{autoLevelLoading ? "判定中…" : "AI判定"}</button>
        </div>
      </Field>
      <ModalButtons onCancel={onClose} onOk={() => { onSave(edited); onClose(); }} okLabel="保存する" disabled={!edited.english.trim()} />
    </Modal>
  );
}

// ===================== PHRASES TAB =====================
function PhrasesTab({ phrases, setPhrases }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("すべて");
  const [lv, setLv] = useState("すべて");
  const [expanded, setExpanded] = useState(null);
  const [editingPhrase, setEditingPhrase] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importFiles, setImportFiles] = useState([]);
  const [importProgress, setImportProgress] = useState("");
  const [newP, setNewP] = useState({ japanese:"", english:"", context:"", category:"ビジネス挨拶", level:"初級" });

  const filtered = phrases.filter(p => {
    if (cat !== "すべて" && p.category !== cat) return false;
    if (lv !== "すべて" && p.level !== lv) return false;
    if (search && !p.english.toLowerCase().includes(search.toLowerCase()) && !p.japanese.includes(search)) return false;
    return true;
  });

  async function handleMultiFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.some(f => f.name.toLowerCase().endsWith(".pdf"))) await loadPdfJs();
    const readers = files.map(file => new Promise(resolve => {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const r = new FileReader();
        r.onload = async ev => { try { const result = await mammoth.extractRawText({ arrayBuffer: ev.target.result }); resolve({ name: file.name, text: result.value || "" }); } catch { resolve({ name: file.name, text: "" }); } };
        r.onerror = () => resolve({ name: file.name, text: "" });
        r.readAsArrayBuffer(file);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        extractTextFromPDF(file).then(text => resolve({ name: file.name, text }));
      } else {
        const r = new FileReader();
        r.onload = ev => { const text = ev.target.result; if ((text.match(/\uFFFD/g) || []).length > 5) { const r2 = new FileReader(); r2.onload = ev2 => resolve({ name: file.name, text: ev2.target.result }); r2.onerror = () => resolve({ name: file.name, text }); r2.readAsText(file, "Shift-JIS"); } else { resolve({ name: file.name, text }); } };
        r.onerror = () => resolve({ name: file.name, text: "" });
        r.readAsText(file, "UTF-8");
      }
    }));
    Promise.all(readers).then(results => { setImportFiles(results); setImportText(results.map(f => f.text).join("\n\n")); });
  }

  async function doImport() {
    setImportLoading(true);
    const sources = importFiles.length > 0 ? importFiles : [{ name:"貼り付けテキスト", text: importText }];
    const allPhrases = [];
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      setImportProgress(`処理中… ${i+1}/${sources.length}: ${src.name}`);
      const raw = parseCopilotText(src.text);
      if (raw.length === 0) continue;
      try {
        const levelSys = `You are an English level assessor for a Japanese pharmaceutical regulatory affairs professional.
Classify each English phrase using STRICT criteria:
- 初級: Short phrases only, common everyday words, junior high school English level, simple greetings, basic thanks
- 中級: Multiple clauses OR business-specific vocabulary OR conditional forms OR compound sentences
- 上級: Long complex sentences AND/OR regulatory/pharmaceutical/legal/scientific terminology AND/OR complex grammar
Return ONLY valid JSON array with no other text: [{"english":"...","level":"初級"|"中級"|"上級"}]`;
        const levelResp = await callClaude(levelSys, JSON.stringify(raw.map(p => p.english)));
        const levelMatch = levelResp.match(/\[[\s\S]*\]/);
        let leveled = [];
        if (levelMatch) leveled = JSON.parse(levelMatch[0]);

        const needsTranslation = raw.filter(p => !p.japanese || p.japanese.trim() === "");
        let translations = [];
        if (needsTranslation.length > 0) {
          setImportProgress(`日本語訳を生成中… ${src.name}`);
          const transSys = `You are a Japanese translator specializing in pharmaceutical and business English. For each English phrase, provide a natural Japanese translation and brief context in Japanese. Return ONLY valid JSON array: [{"english":"...","japanese":"...","context":"..."}]`;
          try {
            const transResp = await callClaude(transSys, JSON.stringify(needsTranslation.map(p => p.english)));
            const transMatch = transResp.match(/\[[\s\S]*\]/);
            if (transMatch) translations = JSON.parse(transMatch[0]);
          } catch {}
        }

        raw.forEach(p => {
          const foundLevel = leveled.find(l => l.english === p.english);
          const foundTrans = translations.find(t => t.english === p.english);
          allPhrases.push({
            ...p,
            level: foundLevel?.level || "中級",
            // FIX: 和訳を確実に反映
            japanese: p.japanese && p.japanese.trim() ? p.japanese : (foundTrans?.japanese || ""),
            context: p.context && p.context.trim() ? p.context : (foundTrans?.context || ""),
            source: src.name,
          });
        });
      } catch {
        raw.forEach(p => allPhrases.push({ ...p, source: src.name }));
      }
    }
    const seen = new Set();
    const deduped = allPhrases.filter(p => { if (seen.has(p.english)) return false; seen.add(p.english); return true; });
    setImportProgress("");
    setImportResult(deduped);
    setImportLoading(false);
  }

  async function addPhraseWithLevel() {
    if (!newP.english.trim()) return;
    let level = newP.level, japanese = newP.japanese, context = newP.context;
    try {
      const sys = `You are an English level assessor and translator for a Japanese pharmaceutical professional. Respond ONLY with valid JSON: {"level":"初級"|"中級"|"上級","japanese":"日本語訳","context":"使う場面(15文字以内)"} Level criteria: 初級: Short, common words, junior high English, simple greetings/thanks 中級: Multiple clauses, business vocabulary, conditional forms 上級: Long/complex sentences, pharma/regulatory/legal terms, complex grammar`;
      const resp = await callClaude(sys, newP.english);
      const jsonMatch = resp.match(/\{[\s\S]*?\}/);
      if (jsonMatch) { const parsed = JSON.parse(jsonMatch[0]); if (LEVELS.includes(parsed.level)) level = parsed.level; if (!japanese && parsed.japanese) japanese = parsed.japanese; if (!context && parsed.context) context = parsed.context; }
    } catch {}
    setPhrases(prev => [{ ...newP, level, japanese, context, id:uid(), source:"手動追加", addedDate:today() }, ...prev]);
    setNewP({ japanese:"", english:"", context:"", category:"ビジネス挨拶", level:"初級" });
    setShowAdd(false);
  }

  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", outline:"none" };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📚 マイ表現集</h3>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => setShowImport(true)} style={{ background:C.surface, border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:C.mid, fontWeight:600 }}>＋インポート</button>
            <button onClick={() => setShowAdd(true)} style={{ background:C.primary, border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋追加</button>
          </div>
        </div>
        <input placeholder="検索…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, marginBottom:8 }} />
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:6 }}>
          {["すべて", ...LEVELS].map(l => (<button key={l} onClick={() => setLv(l)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:lv===l?(l==="すべて"?C.slate:levelColor(l)):C.surface, color:lv===l?"#fff":C.muted }}>{l}</button>))}
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginTop:4 }}>
          {PHRASE_CATS.map(c => (<button key={c} onClick={() => setCat(c)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:cat===c?C.primary:C.surface, color:cat===c?"#fff":C.muted }}>{c}</button>))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
        <div style={{ fontSize:11, color:C.subtle, marginBottom:8 }}>{filtered.length}件</div>
        {filtered.map(p => (
          <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8, overflow:"hidden" }}>
            <div onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{ padding:"11px 13px", cursor:"pointer" }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:3 }}>{p.japanese || "—"}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.slate, lineHeight:1.4 }}>{p.english}</div>
              <div style={{ display:"flex", gap:5, marginTop:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:levelBg(p.level), color:levelColor(p.level), fontWeight:700 }}>{p.level}</span>
                <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:C.primaryLight, color:C.primary, fontWeight:600 }}>{p.category}</span>
              </div>
            </div>
            {expanded === p.id && (
              <div style={{ padding:"0 13px 11px", borderTop:`1px solid ${C.surface}` }}>
                {p.context && <div style={{ fontSize:12, color:C.muted, marginTop:8 }}>💬 {p.context}</div>}
                <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"center" }}>
                  <div style={{ fontSize:10, color:C.subtle }}>{p.addedDate}</div>
                  <button onClick={e => { e.stopPropagation(); setEditingPhrase(p); }} style={{ background:C.primaryLight, border:`1px solid ${C.primaryMid}`, color:C.primary, borderRadius:6, padding:"2px 10px", fontSize:10, cursor:"pointer", fontWeight:600 }}>編集</button>
                  <button onClick={e => { e.stopPropagation(); setPhrases(prev => prev.filter(x => x.id !== p.id)); }} style={{ background:"none", border:`1px solid ${C.dangerMid}`, color:C.danger, borderRadius:6, padding:"2px 8px", fontSize:10, cursor:"pointer" }}>削除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {editingPhrase && (<PhraseEditModal phrase={editingPhrase} onSave={updated => setPhrases(prev => prev.map(p => p.id === updated.id ? updated : p))} onClose={() => setEditingPhrase(null)} />)}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h4 style={{ margin:"0 0 12px", fontSize:15 }}>表現を追加</h4>
          <p style={{ fontSize:11, color:C.muted, margin:"0 0 12px" }}>英語を入力するとAIが日本語訳・難易度を自動生成します。</p>
          {[{ k:"english", l:"英語 *", ph:"English phrase" },{ k:"japanese", l:"日本語訳（空欄でAIが生成）", ph:"日本語訳" },{ k:"context", l:"使う場面（空欄でAIが生成）", ph:"例: メールの締め" }].map(f => (<Field key={f.k} label={f.l}><input value={newP[f.k]} onChange={e => setNewP(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} /></Field>))}
          <Field label="カテゴリー"><select value={newP.category} onChange={e => setNewP(p => ({ ...p, category: e.target.value }))} style={inp}>{PHRASE_CATS.filter(c => c !== "すべて").map(c => <option key={c}>{c}</option>)}</select></Field>
          <ModalButtons onCancel={() => setShowAdd(false)} onOk={addPhraseWithLevel} okLabel="追加する（AIが自動補完）" disabled={!newP.english.trim()} />
        </Modal>
      )}
      {showImport && (
        <Modal onClose={() => { setShowImport(false); setImportText(""); setImportResult(null); setImportFiles([]); setImportProgress(""); }}>
          <h4 style={{ margin:"0 0 6px", fontSize:15 }}>📁 一括インポート</h4>
          <p style={{ fontSize:11, color:C.muted, margin:"0 0 12px" }}>AIが日本語訳・難易度を自動生成します。</p>
          {!importResult ? (
            <>
              <label style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px", border:`2px dashed ${C.primaryMid}`, borderRadius:12, cursor:"pointer", background:C.primaryLight, marginBottom:10 }}>
                <span style={{ fontSize:20 }}>📂</span>
                <div><div style={{ fontSize:13, fontWeight:700, color:C.primary }}>ファイルを選択（複数可）</div><div style={{ fontSize:11, color:C.muted }}>.docx / .txt / .pdf に対応</div></div>
                <input type="file" accept=".txt,.docx,.pdf" multiple onChange={handleMultiFileSelect} style={{ display:"none" }} />
              </label>
              {importFiles.length > 0 && (<div style={{ background:C.successLight, border:`1px solid ${C.successMid}`, borderRadius:10, padding:10, marginBottom:10 }}><div style={{ fontSize:11, fontWeight:700, color:C.success, marginBottom:6 }}>✅ {importFiles.length}ファイル選択済み</div>{importFiles.map((f, i) => <div key={i} style={{ fontSize:11, color:C.mid, marginBottom:2 }}>📄 {f.name}</div>)}</div>)}
              <div style={{ fontSize:11, color:C.subtle, textAlign:"center", margin:"6px 0" }}>または</div>
              <textarea value={importFiles.length > 0 ? "（ファイル選択済み）" : importText} onChange={e => { if (importFiles.length === 0) setImportText(e.target.value); }} placeholder="テキストを直接貼り付け…" readOnly={importFiles.length > 0} style={{ ...inp, height:100, resize:"none", fontFamily:"inherit", opacity:importFiles.length > 0 ? 0.5 : 1 }} />
              {importProgress && <div style={{ fontSize:12, color:C.primary, marginTop:8, textAlign:"center" }}>⏳ {importProgress}</div>}
              <ModalButtons onCancel={() => { setShowImport(false); setImportText(""); setImportFiles([]); }} onOk={doImport} okLabel={importLoading ? (importProgress || "処理中…") : `抽出・判定する${importFiles.length > 0 ? ` (${importFiles.length}ファイル)` : ""}`} disabled={importLoading || (importFiles.length === 0 && !importText.trim())} />
            </>
          ) : (
            <>
              <div style={{ background:C.successLight, border:`1px solid ${C.successMid}`, borderRadius:10, padding:10, marginBottom:10 }}><div style={{ fontSize:13, fontWeight:700, color:C.success }}>✅ {importResult.length}件抽出しました（重複除去済み）</div></div>
              <div style={{ maxHeight:200, overflowY:"auto" }}>
                {/* FIX: 和訳を確認画面でも表示 */}
                {importResult.map(p => (
                  <div key={p.id} style={{ padding:"6px 0", borderBottom:`1px solid ${C.surface}`, fontSize:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                      <span style={{ fontSize:9, padding:"1px 6px", borderRadius:99, background:levelBg(p.level), color:levelColor(p.level), fontWeight:700 }}>{p.level}</span>
                    </div>
                    <div style={{ fontWeight:600 }}>{p.english}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>{p.japanese || "（和訳なし）"}</div>
                  </div>
                ))}
              </div>
              <ModalButtons onCancel={() => setImportResult(null)} onOk={() => { setPhrases(prev => [...importResult, ...prev]); setImportResult(null); setImportText(""); setImportFiles([]); setShowImport(false); }} okLabel={`${importResult.length}件を表現集に追加`} cancelLabel="戻る" />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ===================== VOCAB TAB =====================
function VocabTab({ vocab, setVocab, autoOpen }) {
  const [mode, setMode] = useState("list");
  const [cat, setCat] = useState("すべて");
  const [lv, setLv] = useState("すべて");
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(!!autoOpen);
  const [newV, setNewV] = useState({ word:"", meaning:"", partOfSpeech:"名詞", example:"", category:"一般", level:"中級" });
  const filtered = vocab.filter(v => { if (cat !== "すべて" && v.category !== cat) return false; if (lv !== "すべて" && v.level !== lv) return false; return true; });
  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", outline:"none" };
  async function addVocab() {
    if (!newV.word.trim()) return;
    let level = newV.level, meaning = newV.meaning, example = newV.example, partOfSpeech = newV.partOfSpeech;
    try {
      const sys = `You are an English dictionary for a Japanese pharmaceutical professional. Given a word or idiom, provide level, meaning, part of speech, and example sentence. Return ONLY valid JSON: {"level":"初級"|"中級"|"上級","meaning":"日本語の意味","partOfSpeech":"名詞"|"動詞"|"形容詞"|"副詞"|"イディオム"|"フレーズ","example":"Example sentence using the word."}`;
      const resp = await callClaude(sys, newV.word);
      const jsonMatch = resp.match(/\{[\s\S]*?\}/);
      if (jsonMatch) { const parsed = JSON.parse(jsonMatch[0]); if (LEVELS.includes(parsed.level)) level = parsed.level; if (!meaning && parsed.meaning) meaning = parsed.meaning; if (!example && parsed.example) example = parsed.example; if (parsed.partOfSpeech) partOfSpeech = parsed.partOfSpeech; }
    } catch {}
    setVocab(prev => [{ ...newV, level, meaning, example, partOfSpeech, id:uid(), addedDate:today() }, ...prev]);
    setNewV({ word:"", meaning:"", partOfSpeech:"名詞", example:"", category:"一般", level:"中級" });
    setShowAdd(false);
  }
  const card = filtered[flashIdx % Math.max(1, filtered.length)];
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🔤 語彙</h3>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => setMode(mode === "list" ? "flash" : "list")} style={{ background:C.surface, border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:C.mid, fontWeight:600 }}>{mode === "list" ? "🃏 カード" : "📋 リスト"}</button>
            <button onClick={() => setShowAdd(true)} style={{ background:C.primary, border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋追加</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:6 }}>{["すべて", ...LEVELS].map(l => (<button key={l} onClick={() => setLv(l)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:lv===l?(l==="すべて"?C.slate:levelColor(l)):C.surface, color:lv===l?"#fff":C.muted }}>{l}</button>))}</div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginTop:4 }}>{VOCAB_CATS.map(c => (<button key={c} onClick={() => setCat(c)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:cat===c?C.accent:C.surface, color:cat===c?"#fff":C.muted }}>{c}</button>))}</div>
      </div>
      {mode === "flash" ? (
        <div style={{ flex:1, padding:"16px", display:"flex", flexDirection:"column", alignItems:"center" }}>
          {filtered.length === 0 ? <div style={{ color:C.subtle, marginTop:40 }}>語彙がありません</div> : (
            <>
              <div style={{ fontSize:11, color:C.subtle, marginBottom:12 }}>{(flashIdx % filtered.length) + 1} / {filtered.length}</div>
              <div onClick={() => setFlipped(v => !v)} style={{ width:"100%", minHeight:200, background:flipped?C.slate:C.card, border:`2px solid ${C.border}`, borderRadius:20, padding:24, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.3s", textAlign:"center" }}>
                {!flipped ? (<><div style={{ fontSize:11, color:C.subtle, marginBottom:8 }}>この単語の意味は？</div><div style={{ fontSize:24, fontWeight:800, color:C.slate }}>{card.word}</div><div style={{ fontSize:11, color:C.subtle, marginTop:8 }}>{card.partOfSpeech}</div><div style={{ fontSize:11, color:C.subtle, marginTop:16 }}>タップして答えを見る</div></>) : (<><div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:8 }}>{card.meaning}</div>{card.example && <div style={{ fontSize:12, color:C.subtle, lineHeight:1.5, fontStyle:"italic" }}>{card.example}</div>}</>)}
              </div>
              <div style={{ display:"flex", gap:10, marginTop:16, width:"100%" }}>
                <button onClick={() => { setFlashIdx(i => (i - 1 + filtered.length) % filtered.length); setFlipped(false); }} style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.card, fontSize:18, cursor:"pointer" }}>◀</button>
                <button onClick={() => { setFlashIdx(i => (i + 1) % filtered.length); setFlipped(false); }} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.primary, color:"#fff", fontSize:18, cursor:"pointer", fontWeight:700 }}>次へ ▶</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
          <div style={{ fontSize:11, color:C.subtle, marginBottom:8 }}>{filtered.length}件</div>
          {filtered.map(v => (
            <div key={v.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8, padding:"11px 13px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div><div style={{ fontSize:14, fontWeight:700, color:C.slate }}>{v.word}</div><div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{v.meaning}</div></div>
                <button onClick={() => setVocab(prev => prev.filter(x => x.id !== v.id))} style={{ background:"none", border:"none", color:C.border, cursor:"pointer", fontSize:16 }}>×</button>
              </div>
              {v.example && <div style={{ fontSize:11, color:C.subtle, marginTop:6, fontStyle:"italic" }}>{v.example}</div>}
              <div style={{ display:"flex", gap:5, marginTop:6 }}>
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:levelBg(v.level), color:levelColor(v.level), fontWeight:700 }}>{v.level}</span>
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:C.purpleLight, color:C.purple, fontWeight:600 }}>{v.partOfSpeech}</span>
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:C.surface, color:C.subtle }}>{v.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h4 style={{ margin:"0 0 6px", fontSize:15 }}>語彙を追加</h4>
          <p style={{ fontSize:11, color:C.muted, margin:"0 0 12px" }}>単語を入力するとAIが意味・品詞・例文を自動生成します。</p>
          {[{ k:"word", l:"英語 *", ph:"word / idiom" },{ k:"meaning", l:"日本語の意味（空欄でAIが生成）", ph:"意味" },{ k:"example", l:"例文（空欄でAIが生成）", ph:"Example sentence" }].map(f => (<Field key={f.k} label={f.l}><input value={newV[f.k]} onChange={e => setNewV(v => ({ ...v, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} /></Field>))}
          <Field label="品詞"><select value={newV.partOfSpeech} onChange={e => setNewV(v => ({ ...v, partOfSpeech: e.target.value }))} style={inp}>{PARTS.map(p => <option key={p}>{p}</option>)}</select></Field>
          <Field label="カテゴリー"><select value={newV.category} onChange={e => setNewV(v => ({ ...v, category: e.target.value }))} style={inp}>{VOCAB_CATS.filter(c => c !== "すべて").map(c => <option key={c}>{c}</option>)}</select></Field>
          <ModalButtons onCancel={() => setShowAdd(false)} onOk={addVocab} okLabel="追加する（AIが自動補完）" disabled={!newV.word.trim()} />
        </Modal>
      )}
    </div>
  );
}

// ===================== QUIZ TAB =====================
function QuizTab({ phrases, vocab, setProgress, weaknesses, setWeaknesses }) {
  const [mode, setMode] = useState("select");
  const [quizType, setQuizType] = useState("ja2en");
  const [inputMode, setInputMode] = useState("self");
  const [filterLv, setFilterLv] = useState("すべて");
  const [source, setSource] = useState("phrases");
  const [pool, setPool] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [inputFeedback, setInputFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const diaryEntries = load(STORAGE.diary, []);
  const diaryPool = buildDiaryQuizPool(diaryEntries);
  const allItems = source === "phrases" ? phrases : source === "vocab" ? vocab.map(v => ({ ...v, english:v.word, japanese:v.meaning, context:v.example })) : diaryPool;

  function startQuiz() {
    let items = source === "diary" ? diaryPool : filterLv === "すべて" ? allItems : allItems.filter(p => p.level === filterLv);
    if (items.length === 0) return;
    const weakIds = weaknesses.map(w => w.id);
    const weak = items.filter(p => weakIds.includes(p.id));
    const rest = items.filter(p => !weakIds.includes(p.id));
    const sorted = [...weak, ...rest].sort(() => Math.random() - 0.5).slice(0, 10);
    setPool(sorted); setIdx(0); setRevealed(false); setAnswers([]); setUserInput(""); setInputFeedback(null); setMode("quiz");
  }

  async function checkTyping() {
    const current = pool[idx];
    const correct = quizType === "en2ja" ? (current.japanese || "") : current.english;
    setChecking(true);
    try {
      const sys = `You are an English teacher. Compare the student's answer to the correct answer and respond ONLY in JSON: {"correct": true|false, "feedback": "brief feedback in Japanese", "correctAnswer": "the correct answer"}`;
      const resp = await callClaude(sys, `Correct answer: "${correct}"\nStudent answered: "${userInput}"`);
      const jsonMatch = resp.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error("No JSON");
      setInputFeedback(JSON.parse(jsonMatch[0]));
    } catch { setInputFeedback({ correct: userInput.trim().toLowerCase() === correct.toLowerCase(), feedback:"自己判定してください", correctAnswer:correct }); }
    setChecking(false); setRevealed(true);
  }

  function answer(correct) {
    const p = pool[idx];
    setProgress(prev => [...prev, { id:p.id, correct, date:today(), type:quizType }]);
    if (!correct) { setWeaknesses(prev => { const existing = prev.find(w => w.id === p.id); if (existing) return prev.map(w => w.id === p.id ? { ...w, count:w.count+1 } : w); return [...prev, { id:p.id, english:p.english, count:1 }]; }); }
    else { setWeaknesses(prev => prev.filter(w => w.id !== p.id || w.count > 2)); }
    setAnswers(prev => [...prev, { id:p.id, correct }]);
    if (idx + 1 >= pool.length) setMode("result");
    else { setIdx(i => i + 1); setRevealed(false); setUserInput(""); setInputFeedback(null); }
  }

  if (mode === "select") return (
    <div style={{ padding:"20px 16px" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:800 }}>✏️ クイズ</h3>
      <Field label="出題元">
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[["phrases","📚 表現集"],["vocab","🔤 語彙"],["diary","📔 日記履歴"]].map(([v,l]) => (<button key={v} onClick={() => setSource(v)} style={{ flex:1, minWidth:80, padding:"8px 4px", borderRadius:8, border:`2px solid ${source===v?C.primary:C.border}`, background:source===v?C.primaryLight:C.card, cursor:"pointer", fontSize:12, fontWeight:source===v?700:400, color:source===v?C.primary:C.muted }}>{l}</button>))}
        </div>
        {source === "diary" && (<div style={{ marginTop:8, padding:"8px 10px", background:C.purpleLight, borderRadius:8, fontSize:11, color:C.purple }}>📔 日記の添削履歴から {diaryPool.length}件 出題できます。{diaryPool.length === 0 && <span style={{ color:C.warn }}> まだ日記を書いていません。</span>}</div>)}
      </Field>
      {source !== "diary" && (<Field label="レベル"><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{["すべて", ...LEVELS].map(l => (<button key={l} onClick={() => setFilterLv(l)} style={{ padding:"5px 12px", borderRadius:99, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:filterLv===l?(l==="すべて"?C.slate:levelColor(l)):C.surface, color:filterLv===l?"#fff":(l==="すべて"?C.muted:levelColor(l)) }}>{l}</button>))}</div></Field>)}
      <Field label="出題形式">{[{id:"ja2en",l:"🇯🇵→🇬🇧 日本語→英語"},{id:"en2ja",l:"🇬🇧→🇯🇵 英語→日本語"},{id:"fillblank",l:"📝 穴埋め"}].map(t => (<button key={t.id} onClick={() => setQuizType(t.id)} style={{ width:"100%", marginBottom:6, padding:"10px 12px", borderRadius:10, textAlign:"left", border:`2px solid ${quizType===t.id?C.primary:C.border}`, background:quizType===t.id?C.primaryLight:C.card, cursor:"pointer", fontSize:13, fontWeight:quizType===t.id?700:400, color:quizType===t.id?C.primary:C.slate }}>{t.l}</button>))}</Field>
      <Field label="回答方法"><div style={{ display:"flex", gap:8 }}>{[["self","脳内確認"],["typing","タイピング"]].map(([v,l]) => (<button key={v} onClick={() => setInputMode(v)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:`2px solid ${inputMode===v?C.purple:C.border}`, background:inputMode===v?C.purpleLight:C.card, cursor:"pointer", fontSize:13, fontWeight:inputMode===v?700:400, color:inputMode===v?C.purple:C.muted }}>{l}</button>))}</div></Field>
      {weaknesses.length > 0 && source !== "diary" && <div style={{ background:C.accentLight, border:`1px solid ${C.accentMid}`, borderRadius:10, padding:10, marginBottom:12, fontSize:12, color:"#9a3412" }}>⚠️ 苦手表現 {weaknesses.length}件を優先出題します</div>}
      <button onClick={startQuiz} disabled={source === "diary" && diaryPool.length === 0} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:(source==="diary"&&diaryPool.length===0)?C.subtle:C.primary, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>スタート</button>
    </div>
  );

  if (mode === "result") {
    const correct = answers.filter(a => a.correct).length;
    return (
      <div style={{ padding:"24px 16px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>{correct >= 8 ? "🏆" : correct >= 5 ? "👏" : "💪"}</div>
        <h3 style={{ margin:"0 0 4px" }}>完了！</h3>
        <div style={{ fontSize:32, fontWeight:800, color:C.primary, margin:"12px 0" }}>{correct} / {pool.length}</div>
        <button onClick={() => setMode("select")} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.primary, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>もう一度</button>
      </div>
    );
  }

  const p = pool[idx];
  const fillWords = p.english.split(" ");
  const blankIdx = Math.floor(fillWords.length / 2);
  const blankWord = fillWords[blankIdx];
  const fillQ = fillWords.map((w, i) => i === blankIdx ? "______" : w).join(" ");
  const partOfSpeechHint = p.partOfSpeech || null;
  const firstLetterHint = blankWord ? blankWord[0] + "_".repeat(Math.max(0, blankWord.length - 1)) : "";

  // FIX: 日本語なし問題 - 問題文の日本語を確実に表示
  const displayJapanese = p.japanese && p.japanese.trim() ? p.japanese : (p.context && p.context.trim() ? p.context : null);
  const question = quizType === "ja2en"
    ? (displayJapanese || "（日本語訳なし — 英語: " + p.english + "）")
    : quizType === "en2ja" ? p.english : fillQ;

  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{pool.length}</span>
        <div style={{ flex:1, height:5, background:C.border, borderRadius:99, overflow:"hidden" }}><div style={{ width:(((idx+1)/pool.length)*100)+"%", height:"100%", background:C.primary, transition:"width 0.3s" }} /></div>
        <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:levelBg(p.level), color:levelColor(p.level), fontWeight:700 }}>{p.level}</span>
        {p.isDiaryItem && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:C.purpleLight, color:C.purple, fontWeight:700 }}>📔日記</span>}
      </div>
      <div style={{ background:C.surface, borderRadius:14, padding:20, minHeight:110, display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", marginBottom:quizType==="fillblank"?8:14, border:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize:11, color:C.subtle, marginBottom:8 }}>{quizType==="ja2en"?"次の日本語を英語で":quizType==="en2ja"?"次の英語の意味は？":"空欄に入る単語は？"}</div>
          <div style={{ fontSize:15, fontWeight:700, color:C.slate, lineHeight:1.5 }}>{question}</div>
          {p.isDiaryItem && p.diaryOriginal && quizType === "ja2en" && (<div style={{ marginTop:8, fontSize:11, color:C.warn }}>❌ あなたの以前の表現: <em>{p.diaryOriginal}</em></div>)}
        </div>
      </div>
      {quizType === "fillblank" && !revealed && (
        <div style={{ background:C.warnLight, border:`1px solid ${C.warnMid}`, borderRadius:10, padding:"8px 12px", marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.warn, marginBottom:4 }}>💡 ヒント</div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {partOfSpeechHint && <span style={{ fontSize:11, color:C.slate }}>品詞: <strong>{partOfSpeechHint}</strong></span>}
            {firstLetterHint && <span style={{ fontSize:11, color:C.slate }}>最初の文字: <strong style={{ fontFamily:"monospace" }}>{firstLetterHint}</strong></span>}
            {displayJapanese && <span style={{ fontSize:11, color:C.slate }}>意味: <strong>{displayJapanese}</strong></span>}
          </div>
        </div>
      )}
      {inputMode === "typing" && !revealed && (<input value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="ここに入力…" style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:14, boxSizing:"border-box", marginBottom:10, outline:"none" }} />)}
      {!revealed ? (
        inputMode === "typing" ? (<button onClick={checkTyping} disabled={checking || !userInput.trim()} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:checking?C.subtle:C.purple, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>{checking ? "チェック中…" : "チェックする"}</button>) :
        (<button onClick={() => setRevealed(true)} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.slate, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>答えを見る</button>)
      ) : (
        <div>
          {inputFeedback ? (
            <div style={{ background:inputFeedback.correct?C.successLight:C.dangerLight, border:`1px solid ${inputFeedback.correct?C.successMid:C.dangerMid}`, borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:inputFeedback.correct?C.success:C.danger, marginBottom:6 }}>{inputFeedback.correct?"✅ 正解！":"❌ 不正解"}</div>
              <div style={{ fontSize:13, color:C.slate, marginBottom:4 }}>正解: <strong>{inputFeedback.correctAnswer}</strong></div>
              <div style={{ fontSize:12, color:C.muted }}>{inputFeedback.feedback}</div>
            </div>
          ) : (
            // FIX: 正解欄の日本語表示
            <div style={{ background:C.successLight, border:`1px solid ${C.successMid}`, borderRadius:12, padding:14, marginBottom:12, textAlign:"center" }}>
              <div style={{ fontSize:11, color:C.success, marginBottom:6 }}>✅ 正解</div>
              <div style={{ fontSize:14, fontWeight:700 }}>
                {quizType==="en2ja"
                  ? (displayJapanese || "（日本語なし）")
                  : quizType==="fillblank"
                  ? <span style={{color:C.success,fontWeight:800}}>{blankWord}</span>
                  : p.english}
              </div>
              {quizType==="ja2en" && displayJapanese && (
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{displayJapanese}</div>
              )}
            </div>
          )}
          {inputFeedback ? (<button onClick={() => answer(inputFeedback.correct)} style={{ width:"100%", padding:12, borderRadius:10, border:"none", background:C.primary, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>次へ</button>) : (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => answer(false)} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.dangerLight, color:C.danger, fontSize:14, fontWeight:700, cursor:"pointer" }}>❌ 不正解</button>
              <button onClick={() => answer(true)} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.successLight, color:C.success, fontSize:14, fontWeight:700, cursor:"pointer" }}>⭕ 正解</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== DIARY TAB =====================
function DiaryTab({ setPhrases, weaknesses }) {
  const [entries, setEntries] = useState(() => load(STORAGE.diary, []));
  const [mode, setMode] = useState("list");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState("");
  const [topicSuggestion, setTopicSuggestion] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);

  useEffect(() => { save(STORAGE.diary, entries); }, [entries]);

  async function suggestTopic() {
    setLoadingTopic(true);
    try {
      const sys = `You are an English writing coach for Eriko, a Japanese pharmaceutical regulatory affairs professional who also loves scuba diving. Suggest ONE interesting diary topic for today in Japanese. Make it specific and personal, not generic. Consider topics like: work situations, regulatory meetings, exhibitions, diving experiences, daily life observations, seasonal topics. Return ONLY the topic suggestion in Japanese (1-2 sentences), no extra text.`;
      const resp = await callClaude(sys, `Today is ${today()}. Suggest a diary topic.`);
      setTopicSuggestion(resp.trim());
    } catch { setTopicSuggestion("今日の仕事で印象に残ったことや、最近考えていることを英語で書いてみましょう。"); }
    setLoadingTopic(false);
  }

  async function submitDiary() {
    if (!draft.trim()) return;
    setLoading(true); setError(""); setLoadingMsg("AIが添削中… (10〜20秒)");
    try {
      const weakList = weaknesses.map(w => w.english).join(", ");
      const sys = `You are an English teacher for Eriko, a Japanese pharmaceutical regulatory affairs professional. She writes an English diary to improve her language skills. Analyze her diary entry and respond with ONLY a valid JSON object (no markdown, no explanation): { "corrected": "full corrected diary text here", "corrections": [{"original": "wrong phrase", "corrected": "correct phrase", "explanation": "Japanese explanation"}], "patterns": [{"pattern": "grammar pattern name", "explanation": "Japanese explanation", "example": "example sentence"}], "newPhrases": [{"english": "useful phrase", "japanese": "Japanese meaning", "context": "when to use", "level": "初級"}], "weakPoints": ["weakness description in Japanese"] } Rules: - corrections: list actual errors found (empty array [] if no errors) - patterns: 2-3 key grammar patterns to remember - newPhrases: 3-5 useful phrases, level must be one of: 初級, 中級, 上級 - weakPoints: 1-3 specific weaknesses observed - Her known weak areas: ${weakList || "none yet"}`;
      const resp = await callClaude(sys, draft);
      let result = null;
      try { result = JSON.parse(resp.trim()); } catch {}
      if (!result) { try { result = JSON.parse(resp.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim()); } catch {} }
      if (!result) { const m = resp.match(/\{[\s\S]*\}/); if (m) { try { result = JSON.parse(m[0]); } catch {} } }
      if (!result) throw new Error("AIからの応答をJSONとして解析できませんでした");
      result.corrections = result.corrections || []; result.patterns = result.patterns || []; result.newPhrases = result.newPhrases || []; result.weakPoints = result.weakPoints || []; result.corrected = result.corrected || draft;
      const entry = { id:uid(), date:today(), original:draft, ...result };
      setEntries(prev => { const updated = [entry, ...prev]; save(STORAGE.diary, updated); return updated; });
      if (result.newPhrases?.length) { setPhrases(prev => [...result.newPhrases.map(p => ({ ...p, id:uid(), category:"日記表現", source:"日記添削", addedDate:today() })), ...prev]); }
      setCurrent(entry); setMode("view"); setDraft(""); setTopicSuggestion("");
    } catch(e) { setError(`添削に失敗しました: ${e.message || "不明なエラー"}。もう一度お試しください。`); }
    setLoading(false); setLoadingMsg("");
  }

  function deleteEntry(id) {
    setEntries(prev => { const updated = prev.filter(e => e.id !== id); save(STORAGE.diary, updated); return updated; });
    if (current?.id === id) setMode("list");
  }

  if (mode === "write") return (
    <div style={{ padding:"16px", display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={() => { setMode("list"); setError(""); setTopicSuggestion(""); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>←</button>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📔 今日の日記</h3>
      </div>
      <div style={{ background:C.purpleLight, border:`1px solid #ddd6fe`, borderRadius:12, padding:12, marginBottom:12 }}>
        {topicSuggestion ? (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:C.purple, marginBottom:4 }}>💡 今日のお題</div>
            <div style={{ fontSize:13, color:C.slate, lineHeight:1.5 }}>{topicSuggestion}</div>
            <button onClick={suggestTopic} style={{ marginTop:6, background:"none", border:"none", fontSize:11, color:C.purple, cursor:"pointer", padding:0 }}>別のお題を提案 →</button>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, fontSize:12, color:C.purple }}>何を書こうか迷ったら、AIにお題を提案してもらおう</div>
            <button onClick={suggestTopic} disabled={loadingTopic} style={{ background:C.purple, border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:11, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>{loadingTopic ? "提案中…" : "お題を提案"}</button>
          </div>
        )}
      </div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>今日の出来事を英語で書いてください。AIが添削します。</div>
      <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Today I went to... / I had a meeting with... / I felt..." style={{ flex:1, padding:14, borderRadius:12, border:`1px solid ${C.border}`, fontSize:14, resize:"none", fontFamily:"inherit", outline:"none", lineHeight:1.7, minHeight:200 }} />
      <div style={{ fontSize:11, color:C.subtle, margin:"8px 0", textAlign:"right" }}>{draft.length}文字</div>
      {error && <div style={{ background:C.dangerLight, border:`1px solid ${C.dangerMid}`, borderRadius:10, padding:10, marginBottom:10, fontSize:12, color:C.danger }}>⚠️ {error}</div>}
      <button onClick={submitDiary} disabled={loading || !draft.trim()} style={{ padding:14, borderRadius:12, border:"none", background:loading?C.subtle:C.purple, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>{loading ? loadingMsg : "✨ 添削してもらう"}</button>
    </div>
  );

  // FIX: view mode に overflowY:"auto" を追加してスクロール可能に
  if (mode === "view" && current) return (
    <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={() => setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>←</button>
        <div style={{ flex:1 }}><h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>添削結果</h3><div style={{ fontSize:11, color:C.subtle }}>{current.date}</div></div>
        <button onClick={() => { if(window.confirm("この日記を削除しますか？")) deleteEntry(current.id); }} style={{ background:"none", border:`1px solid ${C.dangerMid}`, color:C.danger, borderRadius:8, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>削除</button>
      </div>
      <Section title="✅ 修正後の日記" color={C.success}><div style={{ fontSize:13, lineHeight:1.8, color:C.slate }}>{current.corrected}</div></Section>
      {current.corrections?.length > 0 && (<Section title={`🔍 修正箇所 (${current.corrections.length}件)`} color={C.danger}>{current.corrections.map((c, i) => (<div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i < current.corrections.length-1 ? `1px solid ${C.surface}` : "none" }}><div style={{ fontSize:12 }}><span style={{ color:C.danger }}>❌ {c.original}</span></div><div style={{ fontSize:12 }}><span style={{ color:C.success }}>✅ {c.corrected}</span></div><div style={{ fontSize:11, color:C.muted, marginTop:4 }}>💡 {c.explanation}</div></div>))}</Section>)}
      {current.patterns?.length > 0 && (<Section title="📌 覚えてほしい文法パターン" color={C.primary}>{current.patterns.map((p, i) => (<div key={i} style={{ marginBottom:10 }}><div style={{ fontSize:13, fontWeight:700, color:C.primary }}>{p.pattern}</div><div style={{ fontSize:12, color:C.mid }}>{p.explanation}</div>{p.example && <div style={{ fontSize:12, color:C.muted, fontStyle:"italic", marginTop:2 }}>例: {p.example}</div>}</div>))}</Section>)}
      {current.newPhrases?.length > 0 && (<Section title={`📚 表現集に追加しました (${current.newPhrases.length}件)`} color={C.purple}>{current.newPhrases.map((p, i) => (<div key={i} style={{ marginBottom:6, fontSize:12 }}><span style={{ fontWeight:700 }}>{p.english}</span>{p.japanese && <span style={{ color:C.muted }}> — {p.japanese}</span>}</div>))}</Section>)}
      {current.weakPoints?.length > 0 && (<Section title="⚠️ 今回の弱点" color={C.warn}>{current.weakPoints.map((w, i) => <div key={i} style={{ fontSize:12, color:"#92400e", marginBottom:4 }}>• {w}</div>)}</Section>)}
    </div>
  );

  // FIX: list mode - 日記一覧をスクロール可能にし、高さを確保
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📔 英語日記</h3>
        <button onClick={() => { setMode("write"); setError(""); }} style={{ background:C.purple, border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>＋今日の日記を書く</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px" }}>
        {entries.length === 0 && (
          <div style={{ textAlign:"center", color:C.subtle, padding:"40px 0" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📔</div>
            <p style={{ fontSize:14 }}>日記をまだ書いていません。<br/>今日の出来事を英語で書いてみましょう！</p>
          </div>
        )}
        {entries.map(e => (
          <div key={e.id} onClick={() => { setCurrent(e); setMode("view"); }} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:10, cursor:"pointer" }}>
            <div style={{ fontSize:11, color:C.subtle, marginBottom:4 }}>{e.date}</div>
            <div style={{ fontSize:13, color:C.slate, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{e.original}</div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <span style={{ fontSize:10, color:C.danger }}>修正 {e.corrections?.length||0}件</span>
              <span style={{ fontSize:10, color:C.purple }}>表現追加 {e.newPhrases?.length||0}件</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== PRACTICE TAB (旧コードから復元) =====================
function PracticeTab({ phrases }) {
  const [mode, setMode] = useState("select"); // select | shadowing | dictation
  const [subMode, setSubMode] = useState("listen"); // shadowing: listen | read | record | result
  const [dictSubMode, setDictSubMode] = useState("listen"); // dictation: listen | input | result
  const [cat, setCat] = useState("すべて");
  const [currentPhrase, setCurrentPhrase] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [score, setScore] = useState(null);
  const [dictInput, setDictInput] = useState("");
  const [dictResult, setDictResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const recognitionRef = useRef(null);

  const filtered = cat === "すべて" ? phrases : phrases.filter(p => p.category === cat);

  function pickRandom() {
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  function startShadowing() {
    const p = pickRandom();
    if (!p) return;
    setCurrentPhrase(p);
    setSubMode("listen");
    setHighlightIdx(-1);
    setRecordedText("");
    setScore(null);
    setMode("shadowing");
  }

  function startDictation() {
    const p = pickRandom();
    if (!p) return;
    setCurrentPhrase(p);
    setDictSubMode("listen");
    setDictInput("");
    setDictResult(null);
    setMode("dictation");
  }

  function playWithHighlight() {
    if (!currentPhrase) return;
    setIsPlaying(true);
    setHighlightIdx(0);
    const words = currentPhrase.english.split(" ");
    speak(currentPhrase.english, () => { setIsPlaying(false); setHighlightIdx(-1); });
    words.forEach((_, i) => {
      setTimeout(() => setHighlightIdx(i), (i / words.length) * 2800);
    });
  }

  function startRecording() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("このブラウザは音声認識に対応していません。Chromeをお試しください。");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => { setRecordedText(e.results[0][0].transcript); };
    rec.onend = () => { setIsRecording(false); };
    rec.onerror = () => { setIsRecording(false); };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    setRecordedText("");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  async function checkShadowing() {
    if (!recordedText || !currentPhrase) return;
    setChecking(true);
    try {
      const sys = `You are a pronunciation coach. Compare the original script with what the student said and score accuracy. Return ONLY valid JSON: {"score": 0-100, "feedback": "brief feedback in Japanese", "missed": ["words that were missed or wrong"]}`;
      const resp = await callClaude(sys, `Original: "${currentPhrase.english}"\nStudent said: "${recordedText}"`);
      const m = resp.match(/\{[\s\S]*\}/);
      if (m) setScore(JSON.parse(m[0]));
      else setScore({ score: 70, feedback: "採点できませんでした", missed: [] });
    } catch {
      const orig = currentPhrase.english.toLowerCase().split(" ");
      const said = recordedText.toLowerCase().split(" ");
      const correct = orig.filter(w => said.includes(w)).length;
      setScore({ score: Math.round((correct / orig.length) * 100), feedback: "自動採点（AI不可）", missed: [] });
    }
    setChecking(false);
    setSubMode("result");
  }

  async function checkDictation() {
    if (!dictInput.trim() || !currentPhrase) return;
    setChecking(true);
    try {
      const sys = `You are an English teacher checking a dictation exercise. Compare the student's transcription to the original. Return ONLY valid JSON: {"correct": true|false, "score": 0-100, "feedback": "brief feedback in Japanese", "correctAnswer": "the original sentence"}`;
      const resp = await callClaude(sys, `Original: "${currentPhrase.english}"\nStudent wrote: "${dictInput}"`);
      const m = resp.match(/\{[\s\S]*\}/);
      if (m) setDictResult(JSON.parse(m[0]));
    } catch {
      const pct = Math.round((dictInput.toLowerCase().split(" ").filter(w => currentPhrase.english.toLowerCase().includes(w)).length / currentPhrase.english.split(" ").length) * 100);
      setDictResult({ correct: pct >= 80, score: pct, feedback: "自動採点", correctAnswer: currentPhrase.english });
    }
    setChecking(false);
    setDictSubMode("result");
  }

  const inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"inherit" };

  // ---- SHADOWING ----
  if (mode === "shadowing" && currentPhrase) {
    const words = currentPhrase.english.split(" ");
    return (
      <div style={{ padding:"16px", display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <button onClick={() => { stopSpeaking(); setMode("select"); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>←</button>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎤 シャドーイング</h3>
          <span style={{ marginLeft:"auto", fontSize:10, padding:"2px 8px", borderRadius:99, background:levelBg(currentPhrase.level), color:levelColor(currentPhrase.level), fontWeight:700 }}>{currentPhrase.level}</span>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          {["listen","read","record","result"].map((s,i) => (
            <div key={s} style={{ flex:1, height:4, borderRadius:99, background: ["listen","read","record","result"].indexOf(subMode) >= i ? C.primary : C.border }} />
          ))}
        </div>

        {subMode === "listen" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
            <div style={{ fontSize:13, color:C.muted, textAlign:"center" }}>まず音声だけ聞いてみましょう<br/>スクリプトは表示されません</div>
            <div style={{ width:80, height:80, borderRadius:99, background:`linear-gradient(135deg,${C.primary},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, cursor:"pointer", boxShadow:`0 4px 16px ${C.primary}44` }} onClick={() => speak(currentPhrase.english)}>🔊</div>
            <div style={{ fontSize:11, color:C.subtle }}>{currentPhrase.category} • {currentPhrase.japanese || ""}</div>
            <button onClick={() => setSubMode("read")} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.primary, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:20 }}>スクリプトを見る →</button>
          </div>
        )}

        {subMode === "read" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.card, borderRadius:14, padding:20, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ fontSize:11, color:C.subtle, marginBottom:12 }}>音声と一緒に読んでみましょう</div>
              <div style={{ fontSize:16, fontWeight:700, lineHeight:1.8, color:C.slate }}>
                {words.map((w, i) => (
                  <span key={i} style={{ padding:"1px 2px", borderRadius:4, background: highlightIdx === i ? C.primary : "transparent", color: highlightIdx === i ? "#fff" : C.slate, transition:"all 0.1s" }}>{w}{" "}</span>
                ))}
              </div>
              {currentPhrase.japanese && <div style={{ fontSize:12, color:C.muted, marginTop:10 }}>{currentPhrase.japanese}</div>}
            </div>
            <button onClick={playWithHighlight} disabled={isPlaying} style={{ padding:12, borderRadius:10, border:"none", background:isPlaying?C.subtle:C.primary, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>{isPlaying ? "再生中…" : "🔊 音声を再生（ハイライト付き）"}</button>
            <button onClick={() => setSubMode("record")} style={{ padding:14, borderRadius:12, border:"none", background:C.accent, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>録音してシャドーイング →</button>
          </div>
        )}

        {subMode === "record" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.card, borderRadius:14, padding:16, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.slate, lineHeight:1.8 }}>{currentPhrase.english}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div onClick={isRecording ? stopRecording : startRecording} style={{ width:80, height:80, borderRadius:99, background:isRecording?C.danger:C.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, cursor:"pointer", margin:"0 auto", boxShadow:isRecording?`0 0 0 8px ${C.dangerMid}`:`0 4px 16px ${C.purple}44`, transition:"all 0.3s" }}>🎤</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:10 }}>{isRecording ? "録音中… もう一度タップで停止" : "タップして録音開始"}</div>
            </div>
            {recordedText && (
              <div style={{ background:C.surface, borderRadius:10, padding:12, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11, color:C.subtle, marginBottom:4 }}>認識結果:</div>
                <div style={{ fontSize:13, color:C.slate }}>{recordedText}</div>
              </div>
            )}
            <button onClick={checkShadowing} disabled={!recordedText || checking} style={{ padding:14, borderRadius:12, border:"none", background:recordedText&&!checking?C.success:C.subtle, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>{checking ? "採点中…" : "採点する"}</button>
          </div>
        )}

        {subMode === "result" && score && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})`, borderRadius:14, padding:20, textAlign:"center", color:"#fff" }}>
              <div style={{ fontSize:48, fontWeight:800 }}>{score.score}<span style={{ fontSize:18 }}>点</span></div>
              <div style={{ fontSize:13, marginTop:6, opacity:0.9 }}>{score.feedback}</div>
            </div>
            {score.missed?.length > 0 && (
              <div style={{ background:C.dangerLight, border:`1px solid ${C.dangerMid}`, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.danger, marginBottom:6 }}>⚠️ 言えなかった単語</div>
                {score.missed.map((w,i) => <div key={i} style={{ fontSize:12, color:C.danger }}>• {w}</div>)}
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setSubMode("listen"); setRecordedText(""); setScore(null); }} style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, fontSize:13, fontWeight:700, cursor:"pointer", color:C.mid }}>もう一度</button>
              <button onClick={startShadowing} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>次の表現へ</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- DICTATION ----
  if (mode === "dictation" && currentPhrase) {
    return (
      <div style={{ padding:"16px", display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <button onClick={() => setMode("select")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>←</button>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📝 ディクテーション</h3>
          <span style={{ marginLeft:"auto", fontSize:10, padding:"2px 8px", borderRadius:99, background:levelBg(currentPhrase.level), color:levelColor(currentPhrase.level), fontWeight:700 }}>{currentPhrase.level}</span>
        </div>

        {dictSubMode === "listen" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
            <div style={{ fontSize:13, color:C.muted, textAlign:"center" }}>音声を聞いて、聞こえた英語を書きましょう</div>
            <div onClick={() => speak(currentPhrase.english)} style={{ width:80, height:80, borderRadius:99, background:`linear-gradient(135deg,${C.primary},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, cursor:"pointer", boxShadow:`0 4px 16px ${C.primary}44` }}>🔊</div>
            <div style={{ fontSize:11, color:C.subtle }}>何度でも再生できます</div>
            <button onClick={() => setDictSubMode("input")} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.primary, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:20 }}>書き取りを始める →</button>
          </div>
        )}

        {dictSubMode === "input" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.primaryLight, borderRadius:12, padding:12, textAlign:"center" }}>
              <div style={{ fontSize:12, color:C.primary }}>もう一度聞く場合はタップ</div>
              <div onClick={() => speak(currentPhrase.english)} style={{ fontSize:28, cursor:"pointer", marginTop:4 }}>🔊</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>聞こえた英語を入力してください</div>
              <textarea value={dictInput} onChange={e => setDictInput(e.target.value)} placeholder="What you heard..." style={{ ...inp, height:120, resize:"none" }} />
            </div>
            <button onClick={checkDictation} disabled={!dictInput.trim() || checking} style={{ padding:14, borderRadius:12, border:"none", background:dictInput.trim()&&!checking?C.success:C.subtle, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>{checking ? "採点中…" : "答え合わせ"}</button>
          </div>
        )}

        {dictSubMode === "result" && dictResult && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:dictResult.correct?`linear-gradient(135deg,${C.success},#22c55e)`:`linear-gradient(135deg,${C.warn},#f59e0b)`, borderRadius:14, padding:20, textAlign:"center", color:"#fff" }}>
              <div style={{ fontSize:48, fontWeight:800 }}>{dictResult.score}<span style={{ fontSize:18 }}>点</span></div>
              <div style={{ fontSize:13, marginTop:6, opacity:0.9 }}>{dictResult.feedback}</div>
            </div>
            <div style={{ background:C.card, borderRadius:12, padding:14, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:6 }}>正解</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.slate, lineHeight:1.6 }}>{dictResult.correctAnswer}</div>
              {currentPhrase.japanese && <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>{currentPhrase.japanese}</div>}
            </div>
            <div style={{ background:C.surface, borderRadius:12, padding:14, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:6 }}>あなたの回答</div>
              <div style={{ fontSize:13, color:dictResult.correct?C.success:C.danger }}>{dictInput}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setDictSubMode("listen"); setDictInput(""); setDictResult(null); }} style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, fontSize:13, fontWeight:700, cursor:"pointer", color:C.mid }}>もう一度</button>
              <button onClick={startDictation} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>次の表現へ</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- SELECT ----
  return (
    <div style={{ padding:"20px 16px" }}>
      <h3 style={{ margin:"0 0 4px", fontSize:16, fontWeight:800 }}>🎤 練習</h3>
      <p style={{ margin:"0 0 16px", fontSize:12, color:C.muted }}>表現集の英文を使ってリスニング力・スピーキング力を鍛えよう</p>

      <div style={{ background:C.card, borderRadius:12, padding:14, border:`1px solid ${C.border}`, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.mid, marginBottom:8 }}>カテゴリーで絞り込む</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["すべて", ...PHRASE_CATS.filter(c => c !== "すべて")].map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding:"4px 10px", borderRadius:99, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:cat===c?C.primary:C.surface, color:cat===c?"#fff":C.muted }}>{c}</button>
          ))}
        </div>
        <div style={{ fontSize:11, color:C.subtle, marginTop:8 }}>{filtered.length}件の表現から出題</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background:C.card, border:`2px solid ${C.primary}`, borderRadius:16, padding:20, cursor: filtered.length > 0 ? "pointer" : "not-allowed", opacity: filtered.length > 0 ? 1 : 0.5 }} onClick={filtered.length > 0 ? startShadowing : undefined}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg,${C.primary},${C.accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎤</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.slate }}>シャドーイング</div>
              <div style={{ fontSize:11, color:C.primary, fontWeight:600 }}>話す力を鍛える</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>音声を聞いてから真似して発音。録音して採点まで。スクリプトのハイライト表示付き。</div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {["1. 聞く","2. 読む","3. 録音","4. 採点"].map(s => (<span key={s} style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:C.primaryLight, color:C.primary, fontWeight:600 }}>{s}</span>))}
          </div>
        </div>

        <div style={{ background:C.card, border:`2px solid ${C.success}`, borderRadius:16, padding:20, cursor: filtered.length > 0 ? "pointer" : "not-allowed", opacity: filtered.length > 0 ? 1 : 0.5 }} onClick={filtered.length > 0 ? startDictation : undefined}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg,${C.success},#22c55e)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📝</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.slate }}>ディクテーション</div>
              <div style={{ fontSize:11, color:C.success, fontWeight:600 }}>聞く力を鍛える</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>音声を聞いて英文を書き取る練習。何度でも再生OK。採点＆正解表示あり。</div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {["1. 聞く","2. 書く","3. 答え合わせ"].map(s => (<span key={s} style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:C.successLight, color:C.success, fontWeight:600 }}>{s}</span>))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ background:C.warnLight, border:`1px solid ${C.warnMid}`, borderRadius:10, padding:12, marginTop:14, fontSize:12, color:"#92400e" }}>
          ⚠️ このカテゴリーに表現がありません。表現集に追加するか、カテゴリーを変えてください。
        </div>
      )}
    </div>
  );
}

// ===================== GOALS TAB =====================
function GoalsTab({ goals, setGoals, progress, weaknesses, phrases, vocab }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [newG, setNewG] = useState({ title:"", target:30, unit:"表現", deadline:"" });
  const t = today();
  const todayStudied = [...new Set(progress.filter(p => p.date === t).map(p => p.id))].length;
  const streak = getStreak(progress);
  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", outline:"none" };
  const byDate = {};
  progress.forEach(p => { byDate[p.date] = (byDate[p.date]||0)+1; });
  const last7 = Array.from({length:7}, (_, i) => { const d = new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10); });

  function downloadJSON() {
    const data = { exportDate:today(), phrases, vocab, goals, progress, weaknesses, diary:load(STORAGE.diary,[]) };
    const blob = new Blob([JSON.stringify(data,null,2)], { type:"application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `eriko-english-${today()}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function downloadCSV(type) {
    let rows = [], headers = [];
    if (type === "phrases") { headers = ["english","japanese","context","category","level","source","addedDate"]; rows = phrases.map(p => headers.map(h => `"${(p[h]||"").replace(/"/g,'""')}"`).join(",")); }
    else if (type === "vocab") { headers = ["word","meaning","partOfSpeech","example","category","level","addedDate"]; rows = vocab.map(v => headers.map(h => `"${(v[h]||"").replace(/"/g,'""')}"`).join(",")); }
    const csv = [headers.join(","), ...rows].join("\n"); const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `eriko-${type}-${today()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div style={{ overflowY:"auto", padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎯 目標と進捗</h3>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setShowDownload(v => !v)} style={{ background:C.surface, border:"none", borderRadius:8, padding:"6px 10px", fontSize:12, cursor:"pointer", color:C.mid, fontWeight:600 }}>📥 保存</button>
          <button onClick={() => setShowAdd(true)} style={{ background:C.primary, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋追加</button>
        </div>
      </div>
      {showDownload && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.mid, marginBottom:10 }}>📥 データをダウンロード</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[{ label:"全データ (JSON)", sub:"バックアップ用", onClick:downloadJSON, color:C.primary },{ label:"表現集 (CSV)", sub:`${phrases.length}件`, onClick:() => downloadCSV("phrases"), color:C.success },{ label:"語彙 (CSV)", sub:`${vocab.length}件`, onClick:() => downloadCSV("vocab"), color:C.purple }].map(b => (<button key={b.label} onClick={b.onClick} style={{ background:C.card, border:`1px solid ${b.color}33`, borderRadius:10, padding:"10px 8px", cursor:"pointer", textAlign:"left" }}><div style={{ fontSize:12, fontWeight:700, color:b.color }}>{b.label}</div><div style={{ fontSize:10, color:C.subtle, marginTop:2 }}>{b.sub}</div></button>))}
          </div>
          <div style={{ fontSize:10, color:C.subtle }}>※ CSVはExcelで開けます。JSONは全データの完全バックアップです。</div>
        </div>
      )}
      <div style={{ background:`linear-gradient(135deg,${C.slate},#334155)`, borderRadius:14, padding:16, marginBottom:14, color:"#fff" }}>
        <div style={{ fontSize:11, color:C.subtle, marginBottom:10 }}>今日の学習</div>
        <div style={{ display:"flex", gap:16 }}>{[{l:"今日の演習",v:todayStudied},{l:"連続日数",v:`${streak}日`},{l:"苦手表現",v:`${weaknesses.length}件`}].map(s => (<div key={s.l}><div style={{ fontSize:20, fontWeight:800 }}>{s.v}</div><div style={{ fontSize:10, color:C.subtle }}>{s.l}</div></div>))}</div>
      </div>
      <div style={{ background:C.card, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.mid, marginBottom:10 }}>📈 過去7日間の演習回数</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
          {last7.map(d => { const cnt = byDate[d]||0; const max = Math.max(1, ...last7.map(x => byDate[x]||0)); return (<div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}><div style={{ width:"100%", height:Math.max(4,(cnt/max)*50)+"px", background:d===t?C.primary:C.primaryMid, borderRadius:"4px 4px 0 0", transition:"height 0.3s" }} /><div style={{ fontSize:8, color:C.subtle }}>{d.slice(5)}</div></div>); })}
        </div>
      </div>
      {weaknesses.length > 0 && (<div style={{ background:C.accentLight, border:`1px solid ${C.accentMid}`, borderRadius:12, padding:14, marginBottom:14 }}><div style={{ fontSize:11, fontWeight:700, color:"#9a3412", marginBottom:8 }}>⚠️ 苦手表現 TOP{Math.min(5, weaknesses.length)}</div>{weaknesses.slice(0,5).map(w => (<div key={w.id} style={{ fontSize:12, color:"#92400e", marginBottom:4 }}>• {w.english} <span style={{ color:C.accent }}>({w.count}回ミス)</span></div>))}</div>)}
      {goals.filter(g => !g.completed).map(g => { const pct = Math.min(100, Math.round((g.current/g.target)*100)); return (
        <div key={g.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><div style={{ fontWeight:700, fontSize:14 }}>{g.title}</div><div style={{ fontSize:12, color:C.primary, fontWeight:700 }}>{pct}%</div></div>
          <div style={{ background:C.border, borderRadius:99, height:8, marginBottom:8, overflow:"hidden" }}><div style={{ width:pct+"%", height:"100%", background:pct>=100?C.success:C.primary, borderRadius:99, transition:"width 0.4s" }} /></div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:12, color:C.muted }}>{g.current}/{g.target} {g.unit}{g.deadline && <span style={{marginLeft:6}}>📅 {g.deadline}</span>}</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => setGoals(p => p.map(x => x.id===g.id?{...x,current:Math.max(0,x.current-1)}:x))} style={{ background:C.surface,border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontWeight:700,color:C.muted }}>−</button>
              <button onClick={() => setGoals(p => p.map(x => x.id===g.id?{...x,current:Math.min(x.target,x.current+1)}:x))} style={{ background:C.primaryLight,border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontWeight:700,color:C.primary }}>＋</button>
              {pct >= 100 && <button onClick={() => setGoals(p => p.map(x => x.id===g.id?{...x,completed:true}:x))} style={{ background:C.success,border:"none",borderRadius:6,padding:"0 8px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>達成！</button>}
            </div>
          </div>
        </div>
      );})}
      {goals.filter(g => !g.completed).length === 0 && <div style={{ textAlign:"center",color:C.subtle,padding:"20px 0",fontSize:13 }}>目標を追加してみましょう！</div>}
      {goals.filter(g => g.completed).map(g => (<div key={g.id} style={{ background:C.successLight,border:`1px solid ${C.successMid}`,borderRadius:10,padding:12,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}><div><div style={{ fontSize:13,fontWeight:600,color:C.success }}>🏆 {g.title}</div><div style={{ fontSize:11,color:"#86efac" }}>{g.target} {g.unit}</div></div><button onClick={() => setGoals(p => p.filter(x => x.id !== g.id))} style={{ background:"none",border:"none",color:"#86efac",cursor:"pointer",fontSize:16 }}>×</button></div>))}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h4 style={{ margin:"0 0 12px",fontSize:15 }}>目標を追加</h4>
          <Field label="タイトル"><input value={newG.title} onChange={e => setNewG(g => ({ ...g, title:e.target.value }))} placeholder="例: 表現を100個覚える" style={inp} /></Field>
          <div style={{ display:"flex",gap:8,marginBottom:10 }}>
            <Field label="目標数" style={{ flex:2 }}><input type="number" value={newG.target} onChange={e => setNewG(g => ({ ...g, target:Number(e.target.value) }))} style={inp} /></Field>
            <Field label="単位" style={{ flex:3 }}><select value={newG.unit} onChange={e => setNewG(g => ({ ...g, unit:e.target.value }))} style={inp}>{["表現","クイズ","日","回"].map(u => <option key={u}>{u}</option>)}</select></Field>
          </div>
          <Field label="期限（任意）"><input type="date" value={newG.deadline} onChange={e => setNewG(g => ({ ...g, deadline:e.target.value }))} style={inp} /></Field>
          <ModalButtons onCancel={() => setShowAdd(false)} onOk={() => { if(!newG.title.trim())return; setGoals(p => [{...newG,id:uid(),current:0,completed:false,createdDate:today()},...p]); setNewG({title:"",target:30,unit:"表現",deadline:""}); setShowAdd(false); }} okLabel="追加する" />
        </Modal>
      )}
    </div>
  );
}

// ===================== HELPERS =====================
function parseCopilotText(text) {
  const phrases = [];
  const seen = new Set();

  function hasJapanese(str) {
    return /[\u3000-\u9fff\uff00-\uffef]/.test(str);
  }

  function removeUrls(str) {
    return str.replace(/https?:\/\/[^\s]+/g, "").trim();
  }

  function isValidEnglish(str) {
    if (!str || str.length < 15) return false;
    if (hasJapanese(str)) return false;
    if (!/[a-zA-Z]/.test(str)) return false;
    if (/^https?:\/\//.test(str.trim())) return false;
    if (/^[^a-zA-Z]+$/.test(str)) return false;
    return true;
  }

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line
      .replace(/^\*\*(.+)\*\*$/, "$1")
      .replace(/^\*\*/, "").replace(/\*\*$/, "")
      .replace(/^\*/, "").replace(/\*/g, "")
      .replace(/^-\s+/, "")
      .replace(/^•\s+/, "")
      .replace(/^[\d]+\.\s+/, "")
      .trim();
    line = removeUrls(line);
    if (!isValidEnglish(line)) continue;
    if (seen.has(line)) continue;
    seen.add(line);

    let english = line;
    let context = "";
    const colonMatch = line.match(/^([A-Z][^:]+):\s+(.+)$/);
    if (colonMatch && colonMatch[1].length < 40 && colonMatch[2].length > 10) {
      context = colonMatch[1].trim();
      english = colonMatch[2].trim();
      if (!isValidEnglish(english)) continue;
    }

    phrases.push({ id:uid(), english, japanese:"", context, category:"インポート", level:"中級", source:"コパイロット", addedDate:today() });
  }

  return phrases;
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:50,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:C.card,borderRadius:"18px 18px 0 0",width:"100%",padding:20,maxHeight:"85vh",overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom:10, ...style }}>
      <div style={{ fontSize:11,color:C.muted,marginBottom:3 }}>{label}</div>
      {children}
    </div>
  );
}

function ModalButtons({ onCancel, onOk, okLabel, cancelLabel="キャンセル", disabled }) {
  return (
    <div style={{ display:"flex",gap:10,marginTop:16 }}>
      <button onClick={onCancel} style={{ flex:1,padding:12,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,cursor:"pointer",fontSize:14 }}>{cancelLabel}</button>
      <button onClick={onOk} disabled={disabled} style={{ flex:1,padding:12,borderRadius:10,border:"none",background:disabled?C.subtle:C.primary,color:"#fff",cursor:disabled?"not-allowed":"pointer",fontSize:14,fontWeight:700 }}>{okLabel}</button>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12 }}>
      <div style={{ fontSize:12,fontWeight:700,color,marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

// ===================== ROLEPLAY SCENARIOS =====================
const ROLEPLAY_SCENARIOS = [
  { id:"rp1", category:"🤿 ダイビング", title:"受付・チェックイン", description:"ダイビングショップのフロントでチェックインする", difficulty:"初級", systemPrompt:`You are a friendly diving shop receptionist. Eriko is a Japanese diver checking in. Speak natural English, ask about her C-card, log book, and equipment rental needs. Keep responses short (2-3 sentences). Be warm and helpful. Start by greeting her and asking if she has a reservation.` },
  { id:"rp2", category:"🤿 ダイビング", title:"ブリーフィングで質問する", description:"ガイドのブリーフィングを聞いて質問・心配事を伝える", difficulty:"中級", systemPrompt:`You are a dive guide giving a briefing. Eriko is a Japanese diver (customer). Give a realistic dive briefing covering: visibility, current, entry style, max depth, safety stop, what to do if separated. After your briefing, invite questions. Keep each response to 3-4 sentences.` },
  { id:"rp3", category:"🤿 ダイビング", title:"器材トラブルを伝える", description:"タンクやウェイトの交換、体調不良を申し出る", difficulty:"初級", systemPrompt:`You are a helpful divemaster. Eriko is a diver who needs to report equipment issues or health concerns before a dive. Be understanding and helpful. Keep responses to 2-3 sentences. Start by asking if everything is okay with her equipment.` },
  { id:"rp4", category:"💼 職場", title:"会議でのやり取り", description:"社内ミーティングで意見を述べる・質問する", difficulty:"中級", systemPrompt:`You are a colleague in an international business meeting. Eriko is a Japanese pharmaceutical regulatory affairs professional. Keep responses conversational and to 2-3 sentences. Start by welcoming her to the meeting and asking for her update.` },
  { id:"rp5", category:"💼 職場", title:"メールの内容を確認する", description:"送ったメールについて電話やチャットでフォローアップ", difficulty:"中級", systemPrompt:`You are a business contact from an overseas company. Eriko sent you an email about a regulatory matter and is following up. Ask clarifying questions about timelines, documents, or next steps. Keep responses to 2-3 sentences. Start by saying you received her email and you have a few questions.` },
  { id:"rp6", category:"🏛️ 規制当局", title:"当局への面会申し込み", description:"規制当局にアポイントを取る", difficulty:"上級", systemPrompt:`You are an official at a regulatory authority (like Thai FDA or PMDA). Eriko is requesting a meeting to discuss a product dossier submission. Be professional and formal. Keep responses to 2-3 sentences. Start by answering the phone formally.` },
  { id:"rp7", category:"🏛️ 規制当局", title:"審査結果について話し合う", description:"リジェクションの理由を確認し、次のステップを相談する", difficulty:"上級", systemPrompt:`You are a regulatory official discussing a product review outcome with Eriko. The product received a rejection. Be professional but approachable. Keep responses to 3-4 sentences. Start by summarizing the main reason for the rejection.` },
  { id:"rp8", category:"🎪 展示会", title:"CPHIブースでの会話", description:"展示会で来場者と製品について話す", difficulty:"中級", systemPrompt:`You are a visitor at CPHI stopping by Eriko's company booth. Ask about her company's products and regulatory expertise. Keep responses to 2-3 sentences. Start by introducing yourself and saying you're interested in her company's products.` },
  { id:"rp9", category:"🎪 展示会", title:"名刺交換・自己紹介", description:"展示会で初めて会う人と自己紹介・名刺交換をする", difficulty:"初級", systemPrompt:`You are a business professional at a pharmaceutical exhibition meeting Eriko for the first time. Keep responses short and friendly (2-3 sentences). Start by introducing yourself and extending your hand to shake.` },
  { id:"rp10", category:"💬 日常", title:"レストランで注文する", description:"海外のレストランで注文・質問をする", difficulty:"初級", systemPrompt:`You are a waiter at an English-speaking restaurant. Eriko is a Japanese customer. Keep responses to 2-3 sentences. Start by welcoming her and handing her a menu.` },
  { id:"rp11", category:"💬 日常", title:"ホテルのチェックイン", description:"海外ホテルでチェックインする", difficulty:"初級", systemPrompt:`You are a hotel front desk staff member. Eriko is checking in as a guest. Keep responses to 2-3 sentences. Start by greeting her and asking for her name.` },
  { id:"rp12", category:"💬 日常", title:"空港・交通機関でのやり取り", description:"空港や電車で道を聞く・チケットを買う", difficulty:"初級", systemPrompt:`You are an airport or transit staff member. Eriko needs help navigating or buying tickets. Keep responses to 2-3 sentences. Start by asking how you can help her.` },
];

function RoleplayTab() {
  const [mode, setMode] = useState("list");
  const [selected, setSelected] = useState(null);
  const [feedbackMode, setFeedbackMode] = useState("normal");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [customScenarios, setCustomScenarios] = useState(() => load("eriko_custom_scenarios", []));
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenario, setNewScenario] = useState({ title:"", category:"💬 日常", description:"", difficulty:"中級", systemPrompt:"" });
  const [filterCat, setFilterCat] = useState("すべて");
  const messagesEndRef = useRef(null);
  const allScenarios = [...ROLEPLAY_SCENARIOS, ...customScenarios];
  const categories = ["すべて", "🤿 ダイビング", "💼 職場", "🏛️ 規制当局", "🎪 展示会", "💬 日常"];
  const filtered = filterCat === "すべて" ? allScenarios : allScenarios.filter(s => s.category === filterCat);
  useEffect(() => { save("eriko_custom_scenarios", customScenarios); }, [customScenarios]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function startScenario(scenario) {
    setSelected(scenario); setMessages([]); setFeedback(null); setInput(""); setLoading(true); setMode("play");
    try { const resp = await callClaude(scenario.systemPrompt, "Start the roleplay now. Begin with your opening line."); setMessages([{ role:"ai", text: resp }]); }
    catch { setMessages([{ role:"ai", text:"Hello! Let's practice English together. How can I help you?" }]); }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    const newMessages = [...messages, { role:"user", text:userMsg }]; setMessages(newMessages); setLoading(true);
    try {
      const history = newMessages.map(m => `${m.role==="ai"?"assistant":"user"}: ${m.text}`).join("\n");
      const sys = feedbackMode === "practice" ? `${selected.systemPrompt}\n\nAfter the user's message, do TWO things:\n1. Continue the roleplay naturally (in character)\n2. Add a brief feedback note in Japanese at the end, formatted as:\n【フィードバック】correct/natural phrasing suggestion if needed, or 「自然な英語です！」if it's good.` : selected.systemPrompt;
      const resp = await callClaude(sys, history);
      setMessages([...newMessages, { role:"ai", text: resp }]);
    } catch { setMessages([...newMessages, { role:"ai", text:"Sorry, could you repeat that?" }]); }
    setLoading(false);
  }

  async function endAndGetFeedback() {
    setLoading(true);
    try {
      const conversation = messages.map(m => `${m.role==="ai"?"AI":"Eriko"}: ${m.text}`).join("\n");
      const sys = `You are an English teacher reviewing a roleplay conversation. Analyze Eriko's English and provide feedback in Japanese. Return ONLY valid JSON with no extra text: {"overall":"総合評価コメント","score":1-10,"strengths":["良かった点"],"improvements":[{"original":"Erikoの表現","better":"より良い表現","explanation":"説明"}],"newPhrases":[{"english":"フレーズ","japanese":"意味","context":"使う場面"}]}`;
      const resp = await callClaude(sys, conversation);
      const jsonMatch = resp.match(/\{[\s\S]*\}/);
      if (jsonMatch) setFeedback(JSON.parse(jsonMatch[0]));
    } catch { setFeedback({ overall:"フィードバックの取得に失敗しました。", score:0, strengths:[], improvements:[], newPhrases:[] }); }
    setLoading(false); setMode("result");
  }

  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, boxSizing:"border-box", outline:"none" };
  const diffColor = d => d==="初級"?C.success:d==="中級"?C.warn:C.danger;
  const diffBg = d => d==="初級"?C.successLight:d==="中級"?C.warnLight:C.dangerLight;

  if (mode === "result" && feedback) return (
    <div style={{ overflowY:"auto", padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={() => setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>←</button>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎭 ロールプレイ結果</h3>
      </div>
      <div style={{ background:`linear-gradient(135deg,${C.purple},#a855f7)`, borderRadius:14, padding:16, marginBottom:14, color:"#fff", textAlign:"center" }}>
        <div style={{ fontSize:40, fontWeight:800 }}>{feedback.score}<span style={{ fontSize:18 }}>/10</span></div>
        <div style={{ fontSize:13, marginTop:6, opacity:0.9 }}>{feedback.overall}</div>
      </div>
      {feedback.strengths?.length > 0 && <Section title="✨ 良かった点" color={C.success}>{feedback.strengths.map((s,i) => <div key={i} style={{ fontSize:12, color:"#166534", marginBottom:4 }}>• {s}</div>)}</Section>}
      {feedback.improvements?.length > 0 && (<Section title="💡 より良い表現" color={C.warn}>{feedback.improvements.map((item,i) => (<div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<feedback.improvements.length-1?`1px solid ${C.surface}`:"none" }}><div style={{ fontSize:12, color:C.danger }}>❌ {item.original}</div><div style={{ fontSize:12, color:C.success }}>✅ {item.better}</div><div style={{ fontSize:11, color:C.muted, marginTop:3 }}>💡 {item.explanation}</div></div>))}</Section>)}
      {feedback.newPhrases?.length > 0 && (<Section title={`📚 使えるフレーズ (${feedback.newPhrases.length}件)`} color={C.primary}>{feedback.newPhrases.map((p,i) => (<div key={i} style={{ marginBottom:6, fontSize:12 }}><span style={{ fontWeight:700 }}>{p.english}</span><span style={{ color:C.muted }}> — {p.japanese}</span>{p.context && <div style={{ fontSize:11, color:C.subtle }}>{p.context}</div>}</div>))}</Section>)}
      <button onClick={() => { setMode("list"); setSelected(null); setMessages([]); setFeedback(null); }} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.purple, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:8 }}>シナリオ一覧に戻る</button>
    </div>
  );

  if (mode === "play" && selected) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"12px 16px", background:C.card, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={() => setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>←</button>
        <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.slate }}>{selected.title}</div><div style={{ fontSize:10, color:C.subtle }}>{selected.category}</div></div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <button onClick={() => setFeedbackMode(m => m==="normal"?"practice":"normal")} style={{ padding:"4px 8px", borderRadius:8, border:"none", cursor:"pointer", fontSize:10, fontWeight:700, background:feedbackMode==="practice"?C.purple:C.surface, color:feedbackMode==="practice"?"#fff":C.muted }}>{feedbackMode==="practice"?"練習モード":"通常モード"}</button>
          <button onClick={endAndGetFeedback} disabled={loading || messages.length < 2} style={{ padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background:messages.length>=2?C.success:C.border, color:messages.length>=2?"#fff":C.subtle }}>終了</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom:12, display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            {m.role === "ai" && <div style={{ width:28, height:28, borderRadius:99, background:C.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginRight:8, flexShrink:0, marginTop:2 }}>🎭</div>}
            <div style={{ maxWidth:"78%", padding:"10px 13px", borderRadius:14, background:m.role==="user"?C.primary:C.card, color:m.role==="user"?"#fff":C.slate, border:m.role==="ai"?`1px solid ${C.border}`:"none", fontSize:13, lineHeight:1.6, borderBottomRightRadius:m.role==="user"?4:14, borderBottomLeftRadius:m.role==="ai"?4:14 }}>
              {m.text.split("【フィードバック】").map((part, pi) => (<span key={pi} style={{ color:pi>0?C.purple:"inherit", fontSize:pi>0?11:13, display:pi>0?"block":"inline", marginTop:pi>0?6:0, fontStyle:pi>0?"italic":"normal" }}>{pi>0?"💡 ":""}{part}</span>))}
            </div>
          </div>
        ))}
        {loading && (<div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}><div style={{ width:28, height:28, borderRadius:99, background:C.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🎭</div><div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, borderBottomLeftRadius:4, padding:"10px 13px", fontSize:13, color:C.subtle }}>入力中…</div></div>)}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding:"6px 16px", background:C.surface, borderTop:`1px solid ${C.surface}` }}><div style={{ fontSize:10, color:C.subtle }}>💡 ヒント: {selected.description}</div></div>
      <div style={{ padding:"10px 16px", background:C.card, borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }} placeholder="英語で入力してください…" style={{ ...inp, flex:1 }} disabled={loading} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:input.trim()?C.primary:C.border, color:input.trim()?"#fff":C.subtle, cursor:"pointer", fontSize:14, fontWeight:700, flexShrink:0 }}>送信</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎭 ロールプレイ</h3>
          <button onClick={() => setShowAddScenario(true)} style={{ background:C.purple, border:"none", borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋自作</button>
        </div>
        <div style={{ background:C.surface, borderRadius:10, padding:10, marginBottom:10, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.mid, marginBottom:6 }}>フィードバックモード</div>
          <div style={{ display:"flex", gap:8 }}>{[["normal","通常（終了後まとめて）"],["practice","練習（リアルタイム指摘）"]].map(([v,l]) => (<button key={v} onClick={() => setFeedbackMode(v)} style={{ flex:1, padding:"6px 0", borderRadius:8, border:`2px solid ${feedbackMode===v?C.purple:C.border}`, background:feedbackMode===v?C.purpleLight:C.card, cursor:"pointer", fontSize:10, fontWeight:feedbackMode===v?700:400, color:feedbackMode===v?C.purple:C.muted }}>{l}</button>))}</div>
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8 }}>{categories.map(c => (<button key={c} onClick={() => setFilterCat(c)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:filterCat===c?C.purple:C.surface, color:filterCat===c?"#fff":C.muted }}>{c}</button>))}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
        <div style={{ fontSize:11, color:C.subtle, marginBottom:8 }}>{filtered.length}シナリオ</div>
        {filtered.map(s => (<div key={s.id} onClick={() => startScenario(s)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8, padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}><div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}><span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:diffBg(s.difficulty), color:diffColor(s.difficulty), fontWeight:700 }}>{s.difficulty}</span><span style={{ fontSize:10, color:C.subtle }}>{s.category}</span></div><div style={{ fontSize:14, fontWeight:700, color:C.slate, marginBottom:2 }}>{s.title}</div><div style={{ fontSize:11, color:C.muted }}>{s.description}</div></div><div style={{ fontSize:18, color:C.border }}>▶</div></div>))}
      </div>
      {showAddScenario && (
        <Modal onClose={() => setShowAddScenario(false)}>
          <h4 style={{ margin:"0 0 12px", fontSize:15 }}>シナリオを自作</h4>
          <Field label="タイトル"><input value={newScenario.title} onChange={e => setNewScenario(s => ({ ...s, title:e.target.value }))} placeholder="例: 医師との面談" style={inp} /></Field>
          <Field label="カテゴリー"><select value={newScenario.category} onChange={e => setNewScenario(s => ({ ...s, category:e.target.value }))} style={inp}>{["🤿 ダイビング","💼 職場","🏛️ 規制当局","🎪 展示会","💬 日常"].map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="説明"><input value={newScenario.description} onChange={e => setNewScenario(s => ({ ...s, description:e.target.value }))} placeholder="このシナリオの説明" style={inp} /></Field>
          <Field label="難易度"><div style={{ display:"flex", gap:6 }}>{["初級","中級","上級"].map(d => (<button key={d} onClick={() => setNewScenario(s => ({ ...s, difficulty:d }))} style={{ flex:1, padding:"6px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background:newScenario.difficulty===d?diffColor(d):C.surface, color:newScenario.difficulty===d?"#fff":diffColor(d) }}>{d}</button>))}</div></Field>
          <Field label="AIへの指示（英語で）"><textarea value={newScenario.systemPrompt} onChange={e => setNewScenario(s => ({ ...s, systemPrompt:e.target.value }))} placeholder="You are a... Start by..." style={{ ...inp, height:80, resize:"none", fontFamily:"inherit" }} /></Field>
          <ModalButtons onCancel={() => setShowAddScenario(false)} onOk={() => { if(!newScenario.title.trim())return; setCustomScenarios(prev => [...prev, {...newScenario, id:uid()}]); setNewScenario({title:"",category:"💬 日常",description:"",difficulty:"中級",systemPrompt:""}); setShowAddScenario(false); }} okLabel="追加する" />
        </Modal>
      )}
    </div>
  );
}

// ===================== MAIN =====================
export default function App() {
  const [tab, setTab] = useState("home");
  const [phrases, setPhrases] = useState(() => load(STORAGE.phrases, SAMPLE_PHRASES));
  const [vocab, setVocab] = useState(() => load(STORAGE.vocab, SAMPLE_VOCAB));
  const [goals, setGoals] = useState(() => load(STORAGE.goals, []));
  const [progress, setProgress] = useState(() => load(STORAGE.progress, []));
  const [weaknesses, setWeaknesses] = useState(() => load(STORAGE.weaknesses, []));

  useEffect(() => { save(STORAGE.phrases, phrases); }, [phrases]);
  useEffect(() => { save(STORAGE.vocab, vocab); }, [vocab]);
  useEffect(() => { save(STORAGE.goals, goals); }, [goals]);
  useEffect(() => { save(STORAGE.progress, progress); }, [progress]);
  useEffect(() => { save(STORAGE.weaknesses, weaknesses); }, [weaknesses]);

  const renderTab = () => {
    switch(tab) {
      case "home":     return <HomeTab phrases={phrases} vocab={vocab} progress={progress} goals={goals} onNavigate={setTab} />;
      case "phrases":  return <PhrasesTab phrases={phrases} setPhrases={setPhrases} />;
      case "practice": return <PracticeTab phrases={phrases} />;
      case "quiz":     return <QuizTab phrases={phrases} vocab={vocab} setProgress={setProgress} weaknesses={weaknesses} setWeaknesses={setWeaknesses} />;
      case "diary":    return <DiaryTab setPhrases={setPhrases} weaknesses={weaknesses} />;
      case "roleplay": return <RoleplayTab />;
      case "goals":    return <GoalsTab goals={goals} setGoals={setGoals} progress={progress} weaknesses={weaknesses} phrases={phrases} vocab={vocab} />;
      case "vocab":     return <VocabTab vocab={vocab} setVocab={setVocab} />;
      case "vocab_add": return <VocabTab vocab={vocab} setVocab={setVocab} autoOpen={true} />;
      default:         return null;
    }
  };

  return (
    <div style={{ maxWidth:430, margin:"0 auto", height:"100vh", display:"flex", flexDirection:"column", fontFamily:"-apple-system,'Hiragino Sans','Yu Gothic',sans-serif", background:C.bg, overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto" }}>{renderTab()}</div>
      <Nav active={tab} onChange={setTab} />
    </div>
  );
}
