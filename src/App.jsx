import { useState, useEffect, useRef } from "react";

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
  return level === "初級" ? "#16a34a" : level === "中級" ? "#d97706" : "#dc2626";
}
function levelBg(level) {
  return level === "初級" ? "#f0fdf4" : level === "中級" ? "#fffbeb" : "#fef2f2";
}

// ===================== API =====================
async function callClaude(systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ===================== COMPONENTS =====================

// --- BOTTOM NAV ---
function Nav({ active, onChange }) {
  const tabs = [
    { id:"home", icon:"🏠", label:"ホーム" },
    { id:"phrases", icon:"📚", label:"表現集" },
    { id:"roleplay", icon:"🎭", label:"会話" },
    { id:"quiz", icon:"✏️", label:"クイズ" },
    { id:"diary", icon:"📔", label:"日記" },
    { id:"goals", icon:"🎯", label:"目標" },
  ];
  return (
    <nav style={{ display:"flex", borderTop:"1px solid #e2e8f0", background:"#fff", position:"sticky", bottom:0, zIndex:20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex:1, padding:"8px 2px 6px", border:"none", background:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:1,
          color: active===t.id ? "#2563eb" : "#94a3b8",
          borderTop: active===t.id ? "2px solid #2563eb" : "2px solid transparent",
          fontSize:10, fontWeight: active===t.id ? 700 : 400,
        }}>
          <span style={{ fontSize:17 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
  );
}

// --- HOME ---
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
      <div>
        <p style={{ margin:0, color:"#64748b", fontSize:12 }}>おかえりなさい</p>
        <h2 style={{ margin:"2px 0 0", fontSize:22, color:"#1e293b", fontWeight:800, letterSpacing:"-0.5px" }}>Eriko's English</h2>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { label:"連続学習", value:streak, unit:"日", color:"#f97316" },
          { label:"今日の演習", value:todayCount, unit:"回", color:"#2563eb" },
          { label:"習得済み", value:mastered, unit:"表現", color:"#16a34a" },
        ].map(s => (
          <div key={s.label} style={{ background:"#f8fafc", borderRadius:12, padding:"12px 6px", textAlign:"center", border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:"#64748b" }}>{s.unit}</div>
            <div style={{ fontSize:9, color:"#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div style={{ background:"#f8fafc", borderRadius:12, padding:14, border:"1px solid #e2e8f0" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10 }}>📊 レベル別表現数</div>
        {LEVELS.map(lv => (
          <div key={lv} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:700, color:levelColor(lv), width:28 }}>{lv}</span>
            <div style={{ flex:1, height:6, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
              <div style={{ width:(Math.min(100,(levelCounts[lv]||0)/phrases.length*100)) + "%", height:"100%", background:levelColor(lv), borderRadius:99 }} />
            </div>
            <span style={{ fontSize:10, color:"#94a3b8", width:20, textAlign:"right" }}>{levelCounts[lv]||0}</span>
          </div>
        ))}
      </div>

      {/* Active goal */}
      {activeGoal && (
        <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius:12, padding:14, border:"1px solid #bfdbfe" }}>
          <div style={{ fontSize:11, color:"#2563eb", fontWeight:700, marginBottom:4 }}>🎯 進行中の目標</div>
          <div style={{ fontSize:14, fontWeight:600, color:"#1e293b" }}>{activeGoal.title}</div>
          <div style={{ marginTop:8, background:"#dbeafe", borderRadius:99, height:6, overflow:"hidden" }}>
            <div style={{ width:Math.min(100,Math.round((activeGoal.current/activeGoal.target)*100)) + "%", height:"100%", background:"#2563eb", borderRadius:99, transition:"width 0.4s" }} />
          </div>
          <div style={{ fontSize:11, color:"#3b82f6", marginTop:4 }}>{activeGoal.current} / {activeGoal.target} {activeGoal.unit}</div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { label:"クイズを解く", icon:"✏️", tab:"quiz", color:"#2563eb", bg:"#eff6ff" },
          { label:"日記を書く", icon:"📔", tab:"diary", color:"#7c3aed", bg:"#f5f3ff" },
          { label:"表現集を見る", icon:"📚", tab:"phrases", color:"#059669", bg:"#ecfdf5" },
          { label:"語彙を覚える", icon:"🔤", tab:"vocab", color:"#d97706", bg:"#fffbeb" },
        ].map(a => (
          <button key={a.tab} onClick={() => onNavigate(a.tab)} style={{
            background:a.bg, border:"1px solid " + a.color + "22", borderRadius:12,
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

// --- PHRASES ---
function PhrasesTab({ phrases, setPhrases }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("すべて");
  const [lv, setLv] = useState("すべて");
  const [expanded, setExpanded] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importFiles, setImportFiles] = useState([]);
  const [importProgress, setImportProgress] = useState("");
  const [newP, setNewP] = useState({ japanese:"", english:"", context:"", category:"ビジネス挨拶", level:"初級" });

  const filtered = phrases.filter(p => {
    if (cat!=="すべて" && p.category!==cat) return false;
    if (lv!=="すべて" && p.level!==lv) return false;
    if (search && !p.english.toLowerCase().includes(search.toLowerCase()) && !p.japanese.includes(search)) return false;
    return true;
  });

  function handleMultiFileSelect(e) {
    const files = Array.from(e.target.files);
    const readers = files.map(file => new Promise(resolve => {
      const r = new FileReader();
      r.onload = ev => resolve({ name: file.name, text: ev.target.result });
      r.readAsText(file, "UTF-8");
    }));
    Promise.all(readers).then(results => {
      setImportFiles(results);
      const combined = results.map(f => f.text).join("\n\n");
      setImportText(combined);
    });
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
        const sys = `You are an English learning assistant. Given a list of English phrases, assign difficulty levels.
Return ONLY valid JSON array: [{"english":"...","level":"初級"|"中級"|"上級"}]
Rules: 初級=simple everyday business phrases, 中級=moderately complex, 上級=technical/regulatory/complex`;
        const resp = await callClaude(sys, JSON.stringify(raw.map(p=>p.english)));
        const clean = resp.replace(/```json|```/g,"").trim();
        const leveled = JSON.parse(clean);
        raw.forEach(p => {
          const found = leveled.find(l => l.english===p.english);
          allPhrases.push({ ...p, level: found?.level || "中級", source: src.name });
        });
      } catch {
        raw.forEach(p => allPhrases.push({ ...p, source: src.name }));
      }
    }

    const seen = new Set();
    const deduped = allPhrases.filter(p => {
      if (seen.has(p.english)) return false;
      seen.add(p.english);
      return true;
    });

    setImportProgress("");
    setImportResult(deduped);
    setImportLoading(false);
  }

  async function addPhraseWithLevel() {
    if (!newP.english.trim()) return;
    let level = newP.level;
    try {
      const sys = `Return ONLY one of: 初級, 中級, 上級 — the difficulty level of the English phrase for a Japanese business professional learning English.`;
      level = (await callClaude(sys, newP.english)).trim() || level;
      if (!LEVELS.includes(level)) level = newP.level;
    } catch {}
    setPhrases(prev => [{ ...newP, level, id:uid(), source:"手動追加", addedDate:today() }, ...prev]);
    setNewP({ japanese:"", english:"", context:"", category:"ビジネス挨拶", level:"初級" });
    setShowAdd(false);
  }

  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📚 マイ表現集</h3>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => setShowImport(true)} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:"#475569", fontWeight:600 }}>＋インポート</button>
            <button onClick={() => setShowAdd(true)} style={{ background:"#2563eb", border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋追加</button>
          </div>
        </div>
        <input placeholder="検索…" value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inp, marginBottom:8 }} />
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:6 }}>
          {["すべて",...LEVELS].map(l => (
            <button key={l} onClick={() => setLv(l)} style={{
              padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap",
              fontSize:11, fontWeight:600,
              background: lv===l ? (l==="すべて"?"#1e293b":levelColor(l)) : "#f1f5f9",
              color: lv===l ? "#fff" : "#64748b",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginTop:4 }}>
          {PHRASE_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap",
              fontSize:11, fontWeight:600,
              background: cat===c ? "#2563eb" : "#f1f5f9",
              color: cat===c ? "#fff" : "#64748b",
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>{filtered.length}件</div>
        {filtered.map(p => (
          <div key={p.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, marginBottom:8, overflow:"hidden" }}>
            <div onClick={() => setExpanded(expanded===p.id?null:p.id)} style={{ padding:"11px 13px", cursor:"pointer" }}>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:3 }}>{p.japanese||"—"}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", lineHeight:1.4 }}>{p.english}</div>
              <div style={{ display:"flex", gap:5, marginTop:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:levelBg(p.level), color:levelColor(p.level), fontWeight:700 }}>{p.level}</span>
                <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:"#eff6ff", color:"#2563eb", fontWeight:600 }}>{p.category}</span>
              </div>
            </div>
            {expanded===p.id && (
              <div style={{ padding:"0 13px 11px", borderTop:"1px solid #f1f5f9" }}>
                {p.context && <div style={{ fontSize:12, color:"#64748b", marginTop:8 }}>💬 {p.context}</div>}
                <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"center" }}>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>{p.addedDate}</div>
                  <button onClick={() => setPhrases(prev=>prev.filter(x=>x.id!==p.id))} style={{ background:"none", border:"1px solid #fca5a5", color:"#ef4444", borderRadius:6, padding:"2px 8px", fontSize:10, cursor:"pointer" }}>削除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h4 style={{ margin:"0 0 12px", fontSize:15 }}>表現を追加</h4>
          {[{k:"japanese",l:"日本語",ph:"日本語訳"},{k:"english",l:"英語 *",ph:"English phrase"},{k:"context",l:"使う場面",ph:"例: メールの締め"}].map(f => (
            <Field key={f.k} label={f.l}>
              <input value={newP[f.k]} onChange={e=>setNewP(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp} />
            </Field>
          ))}
          <Field label="カテゴリー">
            <select value={newP.category} onChange={e=>setNewP(p=>({...p,category:e.target.value}))} style={inp}>
              {PHRASE_CATS.filter(c=>c!=="すべて").map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="難易度（AIが自動判定、変更可）">
            <div style={{ display:"flex", gap:6 }}>
              {LEVELS.map(l=>(
                <button key={l} onClick={()=>setNewP(p=>({...p,level:l}))} style={{ flex:1, padding:"6px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background:newP.level===l?levelColor(l):"#f1f5f9", color:newP.level===l?"#fff":levelColor(l) }}>{l}</button>
              ))}
            </div>
          </Field>
          <ModalButtons onCancel={()=>setShowAdd(false)} onOk={addPhraseWithLevel} okLabel="追加する（AIが難易度確認）" />
        </Modal>
      )}

      {showImport && (
        <Modal onClose={() => { setShowImport(false); setImportText(""); setImportResult(null); setImportFiles([]); setImportProgress(""); }}>
          <h4 style={{ margin:"0 0 6px", fontSize:15 }}>📁 一括インポート</h4>
          <p style={{ fontSize:11, color:"#64748b", margin:"0 0 12px" }}>複数ファイルをまとめて選択、またはテキストを貼り付けてください。AIが英語フレーズを抽出・難易度判定します。</p>

          {!importResult ? (
            <>
              <label style={{
                display:"flex", alignItems:"center", gap:8, padding:"12px 14px",
                border:"2px dashed #bfdbfe", borderRadius:12, cursor:"pointer",
                background:"#eff6ff", marginBottom:10,
              }}>
                <span style={{ fontSize:20 }}>📂</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2563eb" }}>ファイルを選択（複数可）</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>.docx を変換した .txt ファイルに対応</div>
                </div>
                <input type="file" accept=".txt,.docx" multiple onChange={handleMultiFileSelect} style={{ display:"none" }} />
              </label>

              {importFiles.length > 0 && (
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:10, marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#16a34a", marginBottom:6 }}>✅ {importFiles.length}ファイル選択済み</div>
                  {importFiles.map((f,i) => (
                    <div key={i} style={{ fontSize:11, color:"#475569", marginBottom:2 }}>📄 {f.name}</div>
                  ))}
                </div>
              )}

              <div style={{ fontSize:11, color:"#94a3b8", textAlign:"center", margin:"6px 0" }}>または</div>
              <textarea value={importFiles.length>0?"（ファイル選択済み）":importText}
                onChange={e=>{ if(importFiles.length===0) setImportText(e.target.value); }}
                placeholder="テキストを直接貼り付け…"
                readOnly={importFiles.length>0}
                style={{ ...inp, height:100, resize:"none", fontFamily:"inherit", opacity:importFiles.length>0?0.5:1 }} />

              {importProgress && (
                <div style={{ fontSize:12, color:"#2563eb", marginTop:8, textAlign:"center" }}>⏳ {importProgress}</div>
              )}

              <ModalButtons
                onCancel={()=>{ setShowImport(false); setImportText(""); setImportFiles([]); }}
                onOk={doImport}
                okLabel={importLoading ? (importProgress||"処理中…") : `抽出・判定する${importFiles.length>0?` (${importFiles.length}ファイル)`:""}`}
                disabled={importLoading || (importFiles.length===0 && !importText.trim())}
              />
            </>
          ) : (
            <>
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:10, marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#16a34a" }}>✅ {importResult.length}件抽出しました（重複除去済み）</div>
                {importFiles.length>0 && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{importFiles.length}ファイルから抽出</div>}
              </div>
              <div style={{ maxHeight:200, overflowY:"auto" }}>
                {importResult.map(p=>(
                  <div key={p.id} style={{ padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                      <span style={{ fontSize:9, padding:"1px 6px", borderRadius:99, background:levelBg(p.level), color:levelColor(p.level), fontWeight:700 }}>{p.level}</span>
                      <span style={{ fontSize:9, color:"#94a3b8" }}>{p.source}</span>
                    </div>
                    <span style={{ fontWeight:600 }}>{p.english}</span>
                    {p.japanese && <div style={{ color:"#64748b", fontSize:11 }}>{p.japanese}</div>}
                  </div>
                ))}
              </div>
              <ModalButtons
                onCancel={()=>setImportResult(null)}
                onOk={()=>{ setPhrases(prev=>[...importResult,...prev]); setImportResult(null); setImportText(""); setImportFiles([]); setShowImport(false); }}
                okLabel={`${importResult.length}件を表現集に追加`}
                cancelLabel="戻る"
              />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// --- VOCAB ---
function VocabTab({ vocab, setVocab }) {
  const [mode, setMode] = useState("list");
  const [cat, setCat] = useState("すべて");
  const [lv, setLv] = useState("すべて");
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newV, setNewV] = useState({ word:"", meaning:"", partOfSpeech:"名詞", example:"", category:"一般", level:"中級" });

  const filtered = vocab.filter(v => {
    if (cat!=="すべて" && v.category!==cat) return false;
    if (lv!=="すべて" && v.level!==lv) return false;
    return true;
  });

  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" };

  async function addVocab() {
    if (!newV.word.trim()) return;
    let level = newV.level;
    try {
      const sys = `Return ONLY one of: 初級, 中級, 上級 — difficulty of this English word/idiom for a Japanese business professional.`;
      level = (await callClaude(sys, newV.word)).trim();
      if (!LEVELS.includes(level)) level = newV.level;
    } catch {}
    setVocab(prev => [{ ...newV, level, id:uid(), addedDate:today() }, ...prev]);
    setNewV({ word:"", meaning:"", partOfSpeech:"名詞", example:"", category:"一般", level:"中級" });
    setShowAdd(false);
  }

  const card = filtered[flashIdx % Math.max(1,filtered.length)];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🔤 語彙</h3>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setMode(mode==="list"?"flash":"list")} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:"#475569", fontWeight:600 }}>
              {mode==="list"?"🃏 カード":"📋 リスト"}
            </button>
            <button onClick={()=>setShowAdd(true)} style={{ background:"#2563eb", border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋追加</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:6 }}>
          {["すべて",...LEVELS].map(l=>(
            <button key={l} onClick={()=>setLv(l)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:lv===l?(l==="すべて"?"#1e293b":levelColor(l)):"#f1f5f9", color:lv===l?"#fff":"#64748b" }}>{l}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginTop:4 }}>
          {VOCAB_CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:11, fontWeight:600, background:cat===c?"#7c3aed":"#f1f5f9", color:cat===c?"#fff":"#64748b" }}>{c}</button>
          ))}
        </div>
      </div>

      {mode==="flash" ? (
        <div style={{ flex:1, padding:"16px", display:"flex", flexDirection:"column", alignItems:"center" }}>
          {filtered.length===0 ? <div style={{ color:"#94a3b8", marginTop:40 }}>語彙がありません</div> : (
            <>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:12 }}>{(flashIdx%filtered.length)+1} / {filtered.length}</div>
              <div onClick={()=>setFlipped(v=>!v)} style={{
                width:"100%", minHeight:200, background:flipped?"#1e293b":"#fff",
                border:"2px solid #e2e8f0", borderRadius:20, padding:24,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                cursor:"pointer", transition:"all 0.3s", textAlign:"center",
              }}>
                {!flipped ? (
                  <>
                    <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>この単語の意味は？</div>
                    <div style={{ fontSize:24, fontWeight:800, color:"#1e293b" }}>{card.word}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>{card.partOfSpeech}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:16 }}>タップして答えを見る</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:8 }}>{card.meaning}</div>
                    {card.example && <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5, fontStyle:"italic" }}>{card.example}</div>}
                  </>
                )}
              </div>
              <div style={{ display:"flex", gap:10, marginTop:16, width:"100%" }}>
                <button onClick={()=>{ setFlashIdx(i=>(i-1+filtered.length)%filtered.length); setFlipped(false); }} style={{ flex:1, padding:12, borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", fontSize:18, cursor:"pointer" }}>◀</button>
                <button onClick={()=>{ setFlashIdx(i=>(i+1)%filtered.length); setFlipped(false); }} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:"#2563eb", color:"#fff", fontSize:18, cursor:"pointer", fontWeight:700 }}>次へ ▶</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>{filtered.length}件</div>
          {filtered.map(v=>(
            <div key={v.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, marginBottom:8, padding:"11px 13px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{v.word}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{v.meaning}</div>
                </div>
                <button onClick={()=>setVocab(prev=>prev.filter(x=>x.id!==v.id))} style={{ background:"none", border:"none", color:"#cbd5e1", cursor:"pointer", fontSize:16 }}>×</button>
              </div>
              {v.example && <div style={{ fontSize:11, color:"#94a3b8", marginTop:6, fontStyle:"italic" }}>{v.example}</div>}
              <div style={{ display:"flex", gap:5, marginTop:6 }}>
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:levelBg(v.level), color:levelColor(v.level), fontWeight:700 }}>{v.level}</span>
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:"#f5f3ff", color:"#7c3aed", fontWeight:600 }}>{v.partOfSpeech}</span>
                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:"#fafafa", color:"#94a3b8" }}>{v.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal onClose={()=>setShowAdd(false)}>
          <h4 style={{ margin:"0 0 12px", fontSize:15 }}>語彙を追加</h4>
          {[{k:"word",l:"英語 *",ph:"word / idiom"},{k:"meaning",l:"日本語の意味",ph:"意味"},{k:"example",l:"例文",ph:"Example sentence"}].map(f=>(
            <Field key={f.k} label={f.l}><input value={newV[f.k]} onChange={e=>setNewV(v=>({...v,[f.k]:e.target.value}))} placeholder={f.ph} style={inp} /></Field>
          ))}
          <Field label="品詞">
            <select value={newV.partOfSpeech} onChange={e=>setNewV(v=>({...v,partOfSpeech:e.target.value}))} style={inp}>
              {PARTS.map(p=><option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="カテゴリー">
            <select value={newV.category} onChange={e=>setNewV(v=>({...v,category:e.target.value}))} style={inp}>
              {VOCAB_CATS.filter(c=>c!=="すべて").map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <ModalButtons onCancel={()=>setShowAdd(false)} onOk={addVocab} okLabel="追加する" />
        </Modal>
      )}
    </div>
  );
}

// --- QUIZ ---
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

  const allItems = source==="phrases" ? phrases : vocab.map(v=>({ ...v, english:v.word, japanese:v.meaning, context:v.example }));

  function startQuiz() {
    let items = filterLv==="すべて" ? allItems : allItems.filter(p=>p.level===filterLv);
    const weakIds = weaknesses.map(w=>w.id);
    const weak = items.filter(p=>weakIds.includes(p.id));
    const rest = items.filter(p=>!weakIds.includes(p.id));
    const sorted = [...weak, ...rest].sort(()=>Math.random()-0.5).slice(0,10);
    setPool(sorted); setIdx(0); setRevealed(false); setAnswers([]); setUserInput(""); setInputFeedback(null); setMode("quiz");
  }

  async function checkTyping() {
    const current = pool[idx];
    const correct = quizType==="en2ja" ? (current.japanese||"") : current.english;
    setChecking(true);
    try {
      const sys = `You are an English teacher. The student typed an answer. Compare it to the correct answer and respond in JSON:
{"correct": true|false, "feedback": "brief feedback in Japanese", "correctAnswer": "the correct answer"}
Be lenient with minor punctuation differences but strict with spelling and grammar.`;
      const msg = `Correct answer: "${correct}"\nStudent answered: "${userInput}"`;
      const resp = await callClaude(sys, msg);
      const clean = resp.replace(/```json|```/g,"").trim();
      setInputFeedback(JSON.parse(clean));
    } catch {
      setInputFeedback({ correct: userInput.trim().toLowerCase()===correct.toLowerCase(), feedback:"自己判定してください", correctAnswer:correct });
    }
    setChecking(false);
    setRevealed(true);
  }

  function answer(correct) {
    const p = pool[idx];
    const record = { id:p.id, correct, date:today(), type:quizType };
    setProgress(prev=>[...prev, record]);
    if (!correct) {
      setWeaknesses(prev=>{
        const existing = prev.find(w=>w.id===p.id);
        if (existing) return prev.map(w=>w.id===p.id?{...w,count:w.count+1}:w);
        return [...prev, { id:p.id, english:p.english, count:1 }];
      });
    } else {
      setWeaknesses(prev=>prev.filter(w=>w.id!==p.id || w.count>2));
    }
    setAnswers(prev=>[...prev,{id:p.id,correct}]);
    if (idx+1>=pool.length) setMode("result");
    else { setIdx(i=>i+1); setRevealed(false); setUserInput(""); setInputFeedback(null); }
  }

  if (mode==="select") return (
    <div style={{ padding:"20px 16px" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:800 }}>✏️ クイズ</h3>
      <Field label="出題元">
        <div style={{ display:"flex", gap:8 }}>
          {[["phrases","表現集"],["vocab","語彙"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSource(v)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"2px solid " + (source===v?"#2563eb":"#e2e8f0"), background:source===v?"#eff6ff":"#fff", cursor:"pointer", fontSize:13, fontWeight:source===v?700:400, color:source===v?"#2563eb":"#64748b" }}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label="レベル">
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["すべて",...LEVELS].map(l=>(
            <button key={l} onClick={()=>setFilterLv(l)} style={{ padding:"5px 12px", borderRadius:99, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:filterLv===l?(l==="すべて"?"#1e293b":levelColor(l)):"#f1f5f9", color:filterLv===l?"#fff":(l==="すべて"?"#64748b":levelColor(l)) }}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label="出題形式">
        {[{id:"ja2en",l:"🇯🇵→🇬🇧 日本語→英語"},{id:"en2ja",l:"🇬🇧→🇯🇵 英語→日本語"},{id:"fillblank",l:"📝 穴埋め"}].map(t=>(
          <button key={t.id} onClick={()=>setQuizType(t.id)} style={{ width:"100%", marginBottom:6, padding:"10px 12px", borderRadius:10, textAlign:"left", border:"2px solid " + (quizType===t.id?"#2563eb":"#e2e8f0"), background:quizType===t.id?"#eff6ff":"#fff", cursor:"pointer", fontSize:13, fontWeight:quizType===t.id?700:400, color:quizType===t.id?"#2563eb":"#1e293b" }}>{t.l}</button>
        ))}
      </Field>
      <Field label="回答方法">
        <div style={{ display:"flex", gap:8 }}>
          {[["self","脳内確認"],["typing","タイピング"]].map(([v,l])=>(
            <button key={v} onClick={()=>setInputMode(v)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"2px solid " + (inputMode===v?"#7c3aed":"#e2e8f0"), background:inputMode===v?"#f5f3ff":"#fff", cursor:"pointer", fontSize:13, fontWeight:inputMode===v?700:400, color:inputMode===v?"#7c3aed":"#64748b" }}>{l}</button>
          ))}
        </div>
      </Field>
      {weaknesses.length>0 && (
        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:10, marginBottom:12, fontSize:12, color:"#c2410c" }}>
          ⚠️ 苦手表現 {weaknesses.length}件を優先出題します
        </div>
      )}
      <button onClick={startQuiz} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"#2563eb", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>スタート</button>
    </div>
  );

  if (mode==="result") {
    const correct = answers.filter(a=>a.correct).length;
    return (
      <div style={{ padding:"24px 16px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>{correct>=8?"🏆":correct>=5?"👏":"💪"}</div>
        <h3 style={{ margin:"0 0 4px" }}>完了！</h3>
        <div style={{ fontSize:32, fontWeight:800, color:"#2563eb", margin:"12px 0" }}>{correct} / {pool.length}</div>
        {weaknesses.length>0 && <div style={{ fontSize:12, color:"#c2410c", marginBottom:12 }}>苦手表現: {weaknesses.length}件</div>}
        <button onClick={()=>setMode("select")} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"#2563eb", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>もう一度</button>
      </div>
    );
  }

  const p = pool[idx];
  const fillWords = p.english.split(" ");
  const blankIdx = Math.floor(fillWords.length/2);
  const blankWord = fillWords[blankIdx];
  const fillQ = fillWords.map((w,i)=>i===blankIdx?"______":w).join(" ");
  const question = quizType==="ja2en" ? (p.japanese||p.context||"（日本語なし）") : quizType==="en2ja" ? p.english : fillQ;

  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:12, color:"#64748b" }}>{idx+1}/{pool.length}</span>
        <div style={{ flex:1, height:5, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:(((idx+1)/pool.length)*100) + "%", height:"100%", background:"#2563eb", transition:"width 0.3s" }} />
        </div>
        <span style={{ fontSize:9, padding:"2px 6px", borderRadius:99, background:levelBg(p.level), color:levelColor(p.level), fontWeight:700 }}>{p.level}</span>
      </div>
      <div style={{ background:"#f8fafc", borderRadius:14, padding:20, minHeight:110, display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", marginBottom:14, border:"1px solid #e2e8f0" }}>
        <div>
          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>{quizType==="ja2en"?"次の日本語を英語で":quizType==="en2ja"?"次の英語の意味は？":"空欄に入る単語は？"}</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1e293b", lineHeight:1.5 }}>{question}</div>
        </div>
      </div>

      {inputMode==="typing" && !revealed && (
        <input value={userInput} onChange={e=>setUserInput(e.target.value)} placeholder="ここに入力…" style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:14, boxSizing:"border-box", marginBottom:10, outline:"none" }} />
      )}

      {!revealed ? (
        inputMode==="typing" ? (
          <button onClick={checkTyping} disabled={checking||!userInput.trim()} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:checking?"#94a3b8":"#7c3aed", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            {checking?"チェック中…":"チェックする"}
          </button>
        ) : (
          <button onClick={()=>setRevealed(true)} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"#1e293b", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>答えを見る</button>
        )
      ) : (
        <div>
          {inputFeedback ? (
            <div style={{ background:inputFeedback.correct?"#f0fdf4":"#fef2f2", border:"1px solid " + (inputFeedback.correct?"#bbf7d0":"#fca5a5"), borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:inputFeedback.correct?"#16a34a":"#ef4444", marginBottom:6 }}>{inputFeedback.correct?"✅ 正解！":"❌ 不正解"}</div>
              <div style={{ fontSize:13, color:"#1e293b", marginBottom:4 }}>正解: <strong>{inputFeedback.correctAnswer}</strong></div>
              <div style={{ fontSize:12, color:"#64748b" }}>{inputFeedback.feedback}</div>
            </div>
          ) : (
            <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:14, marginBottom:12, textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#16a34a", marginBottom:6 }}>✅ 正解</div>
              <div style={{ fontSize:14, fontWeight:700 }}>{quizType==="en2ja"?(p.japanese||"（日本語なし）"):quizType==="fillblank"?<span style={{color:"#16a34a",fontWeight:800}}>{blankWord}</span>:p.english}</div>
            </div>
          )}
          {inputFeedback ? (
            <button onClick={()=>answer(inputFeedback.correct)} style={{ width:"100%", padding:12, borderRadius:10, border:"none", background:"#2563eb", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>次へ</button>
          ) : (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>answer(false)} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:"#fef2f2", color:"#ef4444", fontSize:14, fontWeight:700, cursor:"pointer" }}>❌ 不正解</button>
              <button onClick={()=>answer(true)} style={{ flex:1, padding:12, borderRadius:10, border:"none", background:"#f0fdf4", color:"#16a34a", fontSize:14, fontWeight:700, cursor:"pointer" }}>⭕ 正解</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- DIARY ---
function DiaryTab({ setPhrases, weaknesses }) {
  const [entries, setEntries] = useState(() => load(STORAGE.diary, []));
  const [mode, setMode] = useState("list");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => { save(STORAGE.diary, entries); }, [entries]);

  async function submitDiary() {
    if (!draft.trim()) return;
    setLoading(true);
    try {
      const weakList = weaknesses.map(w=>w.english).join(", ");
      const sys = `You are an English teacher for a Japanese professional named Eriko who works in pharmaceutical regulatory affairs.
She writes an English diary to improve her skills.

Your task:
1. Correct her diary entry
2. Show corrections in format: original → corrected (with brief Japanese explanation)
3. Identify 2-3 key grammar patterns she should remember
4. Extract 3-5 useful phrases from her corrected text to add to her phrase collection
5. Note her weak points from this entry

Her known weak areas: ${weakList || "none yet"}

Respond ONLY in this exact JSON format with no extra text before or after:
{
  "corrected": "full corrected diary text",
  "corrections": [{"original":"...","corrected":"...","explanation":"Japanese explanation"}],
  "patterns": [{"pattern":"grammar pattern name","explanation":"Japanese explanation","example":"example"}],
  "newPhrases": [{"english":"...","japanese":"...","context":"...","level":"初級"}],
  "weakPoints": ["weakness 1","weakness 2"]
}`;
      const resp = await callClaude(sys, draft);
      // More robust JSON extraction
      const jsonMatch = resp.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const result = JSON.parse(jsonMatch[0]);
      const entry = { id:uid(), date:today(), original:draft, ...result };
      setEntries(prev=>[entry,...prev]);
      if (result.newPhrases?.length) {
        setPhrases(prev=>[...result.newPhrases.map(p=>({ ...p, id:uid(), category:"日記表現", source:"日記添削", addedDate:today() })),...prev]);
      }
      setCurrent(entry);
      setMode("view");
      setDraft("");
    } catch(e) {
      console.error("Diary error:", e);
      alert("添削に失敗しました。もう一度お試しください。");
    }
    setLoading(false);
  }

  if (mode==="write") return (
    <div style={{ padding:"16px", display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={()=>setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#64748b" }}>←</button>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📔 今日の日記</h3>
      </div>
      <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>今日の出来事を英語で書いてください。AIが添削します。</div>
      <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Today I went to... / I had a meeting with... / I felt..." style={{ flex:1, padding:14, borderRadius:12, border:"1px solid #e2e8f0", fontSize:14, resize:"none", fontFamily:"inherit", outline:"none", lineHeight:1.7, minHeight:200 }} />
      <div style={{ fontSize:11, color:"#94a3b8", margin:"8px 0", textAlign:"right" }}>{draft.length}文字</div>
      <button onClick={submitDiary} disabled={loading||!draft.trim()} style={{ padding:14, borderRadius:12, border:"none", background:loading?"#94a3b8":"#7c3aed", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>
        {loading?"添削中… (10〜20秒)":"✨ 添削してもらう"}
      </button>
    </div>
  );

  if (mode==="view" && current) return (
    <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={()=>setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#64748b" }}>←</button>
        <div>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>添削結果</h3>
          <div style={{ fontSize:11, color:"#94a3b8" }}>{current.date}</div>
        </div>
      </div>

      <Section title="✅ 修正後の日記" color="#16a34a">
        <div style={{ fontSize:13, lineHeight:1.8, color:"#1e293b" }}>{current.corrected}</div>
      </Section>

      {current.corrections?.length>0 && (
        <Section title={`🔍 修正箇所 (${current.corrections.length}件)`} color="#dc2626">
          {current.corrections.map((c,i)=>(
            <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i<current.corrections.length-1?"1px solid #f1f5f9":"none" }}>
              <div style={{ fontSize:12 }}><span style={{ color:"#ef4444" }}>❌ {c.original}</span></div>
              <div style={{ fontSize:12 }}><span style={{ color:"#16a34a" }}>✅ {c.corrected}</span></div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>💡 {c.explanation}</div>
            </div>
          ))}
        </Section>
      )}

      {current.patterns?.length>0 && (
        <Section title="📌 覚えてほしい文法パターン" color="#2563eb">
          {current.patterns.map((p,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#2563eb" }}>{p.pattern}</div>
              <div style={{ fontSize:12, color:"#475569" }}>{p.explanation}</div>
              {p.example && <div style={{ fontSize:12, color:"#64748b", fontStyle:"italic", marginTop:2 }}>例: {p.example}</div>}
            </div>
          ))}
        </Section>
      )}

      {current.newPhrases?.length>0 && (
        <Section title={`📚 表現集に追加しました (${current.newPhrases.length}件)`} color="#7c3aed">
          {current.newPhrases.map((p,i)=>(
            <div key={i} style={{ marginBottom:6, fontSize:12 }}>
              <span style={{ fontWeight:700 }}>{p.english}</span>
              {p.japanese && <span style={{ color:"#64748b" }}> — {p.japanese}</span>}
            </div>
          ))}
        </Section>
      )}

      {current.weakPoints?.length>0 && (
        <Section title="⚠️ 今回の弱点" color="#d97706">
          {current.weakPoints.map((w,i)=><div key={i} style={{ fontSize:12, color:"#92400e", marginBottom:4 }}>• {w}</div>)}
        </Section>
      )}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📔 英語日記</h3>
        <button onClick={()=>setMode("write")} style={{ background:"#7c3aed", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>＋今日の日記を書く</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px" }}>
        {entries.length===0 && (
          <div style={{ textAlign:"center", color:"#94a3b8", padding:"40px 0" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📔</div>
            <p style={{ fontSize:14 }}>日記をまだ書いていません。<br/>今日の出来事を英語で書いてみましょう！</p>
          </div>
        )}
        {entries.map(e=>(
          <div key={e.id} onClick={()=>{ setCurrent(e); setMode("view"); }} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:10, cursor:"pointer" }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>{e.date}</div>
            <div style={{ fontSize:13, color:"#1e293b", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{e.original}</div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <span style={{ fontSize:10, color:"#dc2626" }}>修正 {e.corrections?.length||0}件</span>
              <span style={{ fontSize:10, color:"#7c3aed" }}>表現追加 {e.newPhrases?.length||0}件</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- GOALS ---
function GoalsTab({ goals, setGoals, progress, weaknesses, phrases, vocab }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [newG, setNewG] = useState({ title:"", target:30, unit:"表現", deadline:"" });
  const t = today();
  const todayStudied = [...new Set(progress.filter(p=>p.date===t).map(p=>p.id))].length;
  const streak = getStreak(progress);
  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" };

  const byDate = {};
  progress.forEach(p => { byDate[p.date] = (byDate[p.date]||0)+1; });
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10); });

  function downloadJSON() {
    const data = { exportDate: today(), phrases, vocab, goals, progress, weaknesses, diary: load(STORAGE.diary, []) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `eriko-english-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV(type) {
    let rows = [], headers = [];
    if (type === "phrases") {
      headers = ["english","japanese","context","category","level","source","addedDate"];
      rows = phrases.map(p => headers.map(h => `"${(p[h]||"").replace(/"/g,'""')}"`).join(","));
    } else if (type === "vocab") {
      headers = ["word","meaning","partOfSpeech","example","category","level","addedDate"];
      rows = vocab.map(v => headers.map(h => `"${(v[h]||"").replace(/"/g,'""')}"`).join(","));
    }
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `eriko-${type}-${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ overflowY:"auto", padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎯 目標と進捗</h3>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={()=>setShowDownload(v=>!v)} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"6px 10px", fontSize:12, cursor:"pointer", color:"#475569", fontWeight:600 }}>📥 保存</button>
          <button onClick={()=>setShowAdd(true)} style={{ background:"#2563eb", border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋追加</button>
        </div>
      </div>

      {showDownload && (
        <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:10 }}>📥 データをダウンロード</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"全データ (JSON)", sub:"バックアップ用", onClick:downloadJSON, color:"#2563eb" },
              { label:"表現集 (CSV)", sub:`${phrases.length}件`, onClick:()=>downloadCSV("phrases"), color:"#16a34a" },
              { label:"語彙 (CSV)", sub:`${vocab.length}件`, onClick:()=>downloadCSV("vocab"), color:"#7c3aed" },
            ].map(b => (
              <button key={b.label} onClick={b.onClick} style={{ background:"#fff", border:"1px solid " + b.color + "33", borderRadius:10, padding:"10px 8px", cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:12, fontWeight:700, color:b.color }}>{b.label}</div>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{b.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:8 }}>※ CSVはExcelで開けます。JSONは全データの完全バックアップです。</div>
        </div>
      )}

      <div style={{ background:"linear-gradient(135deg,#1e293b,#334155)", borderRadius:14, padding:16, marginBottom:14, color:"#fff" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:10 }}>今日の学習</div>
        <div style={{ display:"flex", gap:16 }}>
          {[{l:"今日の演習",v:todayStudied},{l:"連続日数",v:`${streak}日`},{l:"苦手表現",v:`${weaknesses.length}件`}].map(s=>(
            <div key={s.l}><div style={{ fontSize:20, fontWeight:800 }}>{s.v}</div><div style={{ fontSize:10, color:"#94a3b8" }}>{s.l}</div></div>
          ))}
        </div>
      </div>

      <div style={{ background:"#f8fafc", borderRadius:12, padding:14, marginBottom:14, border:"1px solid #e2e8f0" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10 }}>📈 過去7日間の演習回数</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
          {last7.map(d=>{
            const cnt = byDate[d]||0;
            const max = Math.max(1,...last7.map(x=>byDate[x]||0));
            return (
              <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{ width:"100%", height:Math.max(4,(cnt/max)*50) + "px", background:d===t?"#2563eb":"#bfdbfe", borderRadius:"4px 4px 0 0", transition:"height 0.3s" }} />
                <div style={{ fontSize:8, color:"#94a3b8" }}>{d.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {weaknesses.length>0 && (
        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:14, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#c2410c", marginBottom:8 }}>⚠️ 苦手表現 TOP{Math.min(5,weaknesses.length)}</div>
          {weaknesses.slice(0,5).map(w=>(
            <div key={w.id} style={{ fontSize:12, color:"#92400e", marginBottom:4 }}>• {w.english} <span style={{ color:"#d97706" }}>({w.count}回ミス)</span></div>
          ))}
        </div>
      )}

      {goals.filter(g=>!g.completed).map(g=>{
        const pct = Math.min(100,Math.round((g.current/g.target)*100));
        return (
          <div key={g.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{g.title}</div>
              <div style={{ fontSize:12, color:"#2563eb", fontWeight:700 }}>{pct}%</div>
            </div>
            <div style={{ background:"#e2e8f0", borderRadius:99, height:8, marginBottom:8, overflow:"hidden" }}>
              <div style={{ width:pct + "%", height:"100%", background:pct>=100?"#16a34a":"#2563eb", borderRadius:99, transition:"width 0.4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:12, color:"#64748b" }}>{g.current}/{g.target} {g.unit}{g.deadline&&<span style={{marginLeft:6}}>📅 {g.deadline}</span>}</div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setGoals(p=>p.map(x=>x.id===g.id?{...x,current:Math.max(0,x.current-1)}:x))} style={{ background:"#f1f5f9",border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontWeight:700,color:"#64748b" }}>−</button>
                <button onClick={()=>setGoals(p=>p.map(x=>x.id===g.id?{...x,current:Math.min(x.target,x.current+1)}:x))} style={{ background:"#eff6ff",border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontWeight:700,color:"#2563eb" }}>＋</button>
                {pct>=100&&<button onClick={()=>setGoals(p=>p.map(x=>x.id===g.id?{...x,completed:true}:x))} style={{ background:"#16a34a",border:"none",borderRadius:6,padding:"0 8px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700 }}>達成！</button>}
              </div>
            </div>
          </div>
        );
      })}
      {goals.filter(g=>!g.completed).length===0&&<div style={{ textAlign:"center",color:"#94a3b8",padding:"20px 0",fontSize:13 }}>目標を追加してみましょう！</div>}
      {goals.filter(g=>g.completed).map(g=>(
        <div key={g.id} style={{ background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:12,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div><div style={{ fontSize:13,fontWeight:600,color:"#16a34a" }}>🏆 {g.title}</div><div style={{ fontSize:11,color:"#86efac" }}>{g.target} {g.unit}</div></div>
          <button onClick={()=>setGoals(p=>p.filter(x=>x.id!==g.id))} style={{ background:"none",border:"none",color:"#86efac",cursor:"pointer",fontSize:16 }}>×</button>
        </div>
      ))}

      {showAdd && (
        <Modal onClose={()=>setShowAdd(false)}>
          <h4 style={{ margin:"0 0 12px",fontSize:15 }}>目標を追加</h4>
          <Field label="タイトル"><input value={newG.title} onChange={e=>setNewG(g=>({...g,title:e.target.value}))} placeholder="例: 表現を100個覚える" style={inp} /></Field>
          <div style={{ display:"flex",gap:8,marginBottom:10 }}>
            <Field label="目標数" style={{ flex:2 }}><input type="number" value={newG.target} onChange={e=>setNewG(g=>({...g,target:Number(e.target.value)}))} style={inp} /></Field>
            <Field label="単位" style={{ flex:3 }}><select value={newG.unit} onChange={e=>setNewG(g=>({...g,unit:e.target.value}))} style={inp}>{["表現","クイズ","日","回"].map(u=><option key={u}>{u}</option>)}</select></Field>
          </div>
          <Field label="期限（任意）"><input type="date" value={newG.deadline} onChange={e=>setNewG(g=>({...g,deadline:e.target.value}))} style={inp} /></Field>
          <ModalButtons onCancel={()=>setShowAdd(false)} onOk={()=>{ if(!newG.title.trim())return; setGoals(p=>[{...newG,id:uid(),current:0,completed:false,createdDate:today()},...p]); setNewG({title:"",target:30,unit:"表現",deadline:""}); setShowAdd(false); }} okLabel="追加する" />
        </Modal>
      )}
    </div>
  );
}

// ===================== HELPERS =====================
function parseCopilotText(text) {
  const phrases = [];
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean);
  for (let i=0; i<lines.length; i++) {
    const line = lines[i];
    const enMatch = line.match(/^\*?\*?([A-Z][^*\n]{10,})\*?\*?$/);
    if (enMatch) {
      const english = enMatch[1].replace(/\*\*/g,"").trim();
      const jaMatch = line.match(/（([^）]+)）/) || (lines[i+1]&&lines[i+1].match(/^（([^）]+)）/));
      const japanese = jaMatch ? jaMatch[1] : "";
      if (english.length>15 && /[a-zA-Z]/.test(english)) {
        phrases.push({ id:uid(), english, japanese, context:"", category:"インポート", level:"中級", source:"コパイロット", addedDate:today() });
      }
    }
  }
  return phrases;
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:50,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:"#fff",borderRadius:"18px 18px 0 0",width:"100%",padding:20,maxHeight:"85vh",overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom:10, ...style }}>
      <div style={{ fontSize:11,color:"#64748b",marginBottom:3 }}>{label}</div>
      {children}
    </div>
  );
}

function ModalButtons({ onCancel, onOk, okLabel, cancelLabel="キャンセル", disabled }) {
  return (
    <div style={{ display:"flex",gap:10,marginTop:16 }}>
      <button onClick={onCancel} style={{ flex:1,padding:12,borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:14 }}>{cancelLabel}</button>
      <button onClick={onOk} disabled={disabled} style={{ flex:1,padding:12,borderRadius:10,border:"none",background:disabled?"#94a3b8":"#2563eb",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700 }}>{okLabel}</button>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:14,marginBottom:12 }}>
      <div style={{ fontSize:12,fontWeight:700,color,marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

// ===================== ROLEPLAY SCENARIOS =====================
const ROLEPLAY_SCENARIOS = [
  {
    id:"rp1", category:"🤿 ダイビング", title:"受付・チェックイン",
    description:"ダイビングショップのフロントでチェックインする",
    difficulty:"初級",
    systemPrompt:`You are a friendly diving shop receptionist. Eriko is a Japanese diver checking in. 
Speak natural English, ask about her C-card, log book, and equipment rental needs.
Keep responses short (2-3 sentences). Be warm and helpful.
Start by greeting her and asking if she has a reservation.`
  },
  {
    id:"rp2", category:"🤿 ダイビング", title:"ブリーフィングで質問する",
    description:"ガイドのブリーフィングを聞いて質問・心配事を伝える",
    difficulty:"中級",
    systemPrompt:`You are a dive guide giving a briefing. Eriko is a Japanese diver (customer).
Give a realistic dive briefing covering: visibility, current, entry style, max depth, safety stop, what to do if separated.
After your briefing, invite questions. Respond naturally to her questions about the dive site.
Keep each response to 3-4 sentences.`
  },
  {
    id:"rp3", category:"🤿 ダイビング", title:"器材トラブルを伝える",
    description:"タンクやウェイトの交換、体調不良を申し出る",
    difficulty:"初級",
    systemPrompt:`You are a helpful divemaster. Eriko is a diver who needs to report equipment issues or health concerns before a dive.
Respond naturally to her requests about tank exchange, weight adjustment, or skipping a dive.
Be understanding and helpful. Keep responses to 2-3 sentences.
Start by asking if everything is okay with her equipment.`
  },
  {
    id:"rp4", category:"💼 職場", title:"会議でのやり取り",
    description:"社内ミーティングで意見を述べる・質問する",
    difficulty:"中級",
    systemPrompt:`You are a colleague in an international business meeting. Eriko is a Japanese pharmaceutical regulatory affairs professional.
Discuss topics like project updates, timelines, or regulatory submissions.
Keep responses conversational and to 2-3 sentences. Ask her opinion or questions to keep the conversation going.
Start by welcoming her to the meeting and asking for her update.`
  },
  {
    id:"rp5", category:"💼 職場", title:"メールの内容を確認する",
    description:"送ったメールについて電話やチャットでフォローアップ",
    difficulty:"中級",
    systemPrompt:`You are a business contact from an overseas company. Eriko sent you an email about a regulatory matter and is following up.
Discuss the email content naturally. Ask clarifying questions about timelines, documents, or next steps.
Keep responses to 2-3 sentences.
Start by saying you received her email and you have a few questions.`
  },
  {
    id:"rp6", category:"🏛️ 規制当局", title:"当局への面会申し込み",
    description:"規制当局にアポイントを取る",
    difficulty:"上級",
    systemPrompt:`You are an official at a regulatory authority (like Thai FDA or PMDA). Eriko is requesting a meeting to discuss a product dossier submission.
Be professional and formal. Ask about the purpose of the meeting, documents to be discussed, and preferred dates.
Keep responses to 2-3 sentences.
Start by answering the phone formally.`
  },
  {
    id:"rp7", category:"🏛️ 規制当局", title:"審査結果について話し合う",
    description:"リジェクションの理由を確認し、次のステップを相談する",
    difficulty:"上級",
    systemPrompt:`You are a regulatory official discussing a product review outcome with Eriko, a regulatory affairs professional.
The product received a rejection. Discuss the reasons for rejection, what additional data is needed, and possible timelines for resubmission.
Be professional but approachable. Keep responses to 3-4 sentences.
Start by summarizing the main reason for the rejection.`
  },
  {
    id:"rp8", category:"🎪 展示会", title:"CPHIブースでの会話",
    description:"展示会で来場者と製品について話す",
    difficulty:"中級",
    systemPrompt:`You are a visitor at CPHI (pharmaceutical exhibition) stopping by Eriko's company booth.
Ask about her company's products, services, or regulatory expertise. Show genuine interest.
Keep responses to 2-3 sentences. Be friendly and professional.
Start by introducing yourself and saying you're interested in her company's products.`
  },
  {
    id:"rp9", category:"🎪 展示会", title:"名刺交換・自己紹介",
    description:"展示会で初めて会う人と自己紹介・名刺交換をする",
    difficulty:"初級",
    systemPrompt:`You are a business professional at a pharmaceutical exhibition meeting Eriko for the first time.
Exchange introductions, ask about her role and company, and discuss potential collaboration.
Keep responses short and friendly (2-3 sentences).
Start by introducing yourself and extending your hand to shake.`
  },
  {
    id:"rp10", category:"💬 日常", title:"レストランで注文する",
    description:"海外のレストランで注文・質問をする",
    difficulty:"初級",
    systemPrompt:`You are a waiter at an English-speaking restaurant. Eriko is a Japanese customer.
Take her order, answer questions about the menu, and handle any requests naturally.
Keep responses to 2-3 sentences.
Start by welcoming her and handing her a menu.`
  },
  {
    id:"rp11", category:"💬 日常", title:"ホテルのチェックイン",
    description:"海外ホテルでチェックインする",
    difficulty:"初級",
    systemPrompt:`You are a hotel front desk staff member. Eriko is checking in as a guest.
Handle the check-in process: confirm reservation, ask for ID, explain amenities, answer questions.
Keep responses to 2-3 sentences.
Start by greeting her and asking for her name.`
  },
  {
    id:"rp12", category:"💬 日常", title:"空港・交通機関でのやり取り",
    description:"空港や電車で道を聞く・チケットを買う",
    difficulty:"初級",
    systemPrompt:`You are an airport or transit staff member. Eriko needs help navigating or buying tickets.
Help her with directions, ticket purchases, or transit information.
Keep responses to 2-3 sentences.
Start by asking how you can help her.`
  },
];

// ===================== ROLEPLAY TAB =====================
function RoleplayTab() {
  const [mode, setMode] = useState("list"); // list | play | result
  const [selected, setSelected] = useState(null);
  const [feedbackMode, setFeedbackMode] = useState("normal"); // normal | practice
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
    setSelected(scenario);
    setMessages([]);
    setFeedback(null);
    setInput("");
    setLoading(true);
    setMode("play");
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ system: scenario.systemPrompt, message: "Start the roleplay now. Begin with your opening line." })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      setMessages([{ role:"ai", text }]);
    } catch {
      setMessages([{ role:"ai", text:"Hello! Let's practice English together. How can I help you?" }]);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role:"user", text:userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build conversation history
      const history = newMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
      
      if (feedbackMode === "practice") {
        // Real-time feedback mode
        const feedbackSys = `${selected.systemPrompt}

After the user's message, do TWO things:
1. Continue the roleplay naturally (in character)
2. Add a brief feedback note in Japanese at the end, formatted as: 
【フィードバック】correct/natural phrasing suggestion if needed, or 「自然な英語です！」if it's good.`;
        const res = await fetch("/api/chat", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ system: feedbackSys, message: history.map(h => `${h.role}: ${h.content}`).join("\n") })
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        setMessages([...newMessages, { role:"ai", text }]);
      } else {
        // Normal mode - just continue roleplay
        const res = await fetch("/api/chat", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ system: selected.systemPrompt, message: history.map(h => `${h.role}: ${h.content}`).join("\n") })
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        setMessages([...newMessages, { role:"ai", text }]);
      }
    } catch {
      setMessages([...newMessages, { role:"ai", text:"Sorry, could you repeat that?" }]);
    }
    setLoading(false);
  }

  async function endAndGetFeedback() {
    setLoading(true);
    try {
      const conversation = messages.map(m => `${m.role === "ai" ? "AI" : "Eriko"}: ${m.text}`).join("\n");
      const sys = `You are an English teacher reviewing a roleplay conversation.
Analyze Eriko's English (the "Eriko:" lines) and provide feedback in Japanese.

Return ONLY valid JSON:
{
  "overall": "総合評価コメント（日本語）",
  "score": 1-10,
  "strengths": ["良かった点1", "良かった点2"],
  "improvements": [{"original":"Erikoの表現","better":"より良い表現","explanation":"説明"}],
  "newPhrases": [{"english":"使えるフレーズ","japanese":"意味","context":"使う場面"}]
}`;
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ system: sys, message: conversation })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) setFeedback(JSON.parse(jsonMatch[0]));
    } catch {
      setFeedback({ overall:"フィードバックの取得に失敗しました。", score:0, strengths:[], improvements:[], newPhrases:[] });
    }
    setLoading(false);
    setMode("result");
  }

  const inp = { width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" };
  const diffColor = d => d==="初級"?"#16a34a":d==="中級"?"#d97706":"#dc2626";
  const diffBg = d => d==="初級"?"#f0fdf4":d==="中級"?"#fffbeb":"#fef2f2";

  // Result screen
  if (mode === "result" && feedback) return (
    <div style={{ overflowY:"auto", padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={()=>setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#64748b" }}>←</button>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎭 ロールプレイ結果</h3>
      </div>

      <div style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius:14, padding:16, marginBottom:14, color:"#fff", textAlign:"center" }}>
        <div style={{ fontSize:40, fontWeight:800 }}>{feedback.score}<span style={{ fontSize:18 }}>/10</span></div>
        <div style={{ fontSize:13, marginTop:6, opacity:0.9 }}>{feedback.overall}</div>
      </div>

      {feedback.strengths?.length > 0 && (
        <Section title="✨ 良かった点" color="#16a34a">
          {feedback.strengths.map((s,i) => <div key={i} style={{ fontSize:12, color:"#166534", marginBottom:4 }}>• {s}</div>)}
        </Section>
      )}

      {feedback.improvements?.length > 0 && (
        <Section title="💡 より良い表現" color="#d97706">
          {feedback.improvements.map((item,i) => (
            <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<feedback.improvements.length-1?"1px solid #f1f5f9":"none" }}>
              <div style={{ fontSize:12, color:"#ef4444" }}>❌ {item.original}</div>
              <div style={{ fontSize:12, color:"#16a34a" }}>✅ {item.better}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>💡 {item.explanation}</div>
            </div>
          ))}
        </Section>
      )}

      {feedback.newPhrases?.length > 0 && (
        <Section title={`📚 使えるフレーズ (${feedback.newPhrases.length}件)`} color="#2563eb">
          {feedback.newPhrases.map((p,i) => (
            <div key={i} style={{ marginBottom:6, fontSize:12 }}>
              <span style={{ fontWeight:700 }}>{p.english}</span>
              <span style={{ color:"#64748b" }}> — {p.japanese}</span>
              {p.context && <div style={{ fontSize:11, color:"#94a3b8" }}>{p.context}</div>}
            </div>
          ))}
        </Section>
      )}

      <button onClick={()=>{ setMode("list"); setSelected(null); setMessages([]); setFeedback(null); }} style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"#7c3aed", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:8 }}>
        シナリオ一覧に戻る
      </button>
    </div>
  );

  // Play screen
  if (mode === "play" && selected) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", background:"#fff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={()=>setMode("list")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#64748b" }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{selected.title}</div>
          <div style={{ fontSize:10, color:"#94a3b8" }}>{selected.category}</div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <button onClick={()=>setFeedbackMode(m=>m==="normal"?"practice":"normal")} style={{
            padding:"4px 8px", borderRadius:8, border:"none", cursor:"pointer", fontSize:10, fontWeight:700,
            background: feedbackMode==="practice" ? "#7c3aed" : "#f1f5f9",
            color: feedbackMode==="practice" ? "#fff" : "#64748b",
          }}>
            {feedbackMode==="practice" ? "練習モード" : "通常モード"}
          </button>
          <button onClick={endAndGetFeedback} disabled={loading || messages.length < 2} style={{
            padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
            background: messages.length >= 2 ? "#16a34a" : "#e2e8f0",
            color: messages.length >= 2 ? "#fff" : "#94a3b8",
          }}>終了</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom:12, display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
            {m.role === "ai" && <div style={{ width:28, height:28, borderRadius:99, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginRight:8, flexShrink:0, marginTop:2 }}>🎭</div>}
            <div style={{
              maxWidth:"78%", padding:"10px 13px", borderRadius:14,
              background: m.role==="user" ? "#2563eb" : "#fff",
              color: m.role==="user" ? "#fff" : "#1e293b",
              border: m.role==="ai" ? "1px solid #e2e8f0" : "none",
              fontSize:13, lineHeight:1.6,
              borderBottomRightRadius: m.role==="user" ? 4 : 14,
              borderBottomLeftRadius: m.role==="ai" ? 4 : 14,
            }}>
              {m.text.split("【フィードバック】").map((part, pi) => (
                <span key={pi} style={{ color: pi>0 ? "#7c3aed" : "inherit", fontSize: pi>0 ? 11 : 13, display: pi>0 ? "block" : "inline", marginTop: pi>0 ? 6 : 0, fontStyle: pi>0 ? "italic" : "normal" }}>
                  {pi>0 ? "💡 " : ""}{part}
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:28, height:28, borderRadius:99, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🎭</div>
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, borderBottomLeftRadius:4, padding:"10px 13px", fontSize:13, color:"#94a3b8" }}>入力中…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hint */}
      <div style={{ padding:"6px 16px", background:"#f8fafc", borderTop:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:10, color:"#94a3b8" }}>💡 ヒント: {selected.description}</div>
      </div>

      {/* Input */}
      <div style={{ padding:"10px 16px", background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex", gap:8 }}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="英語で入力してください…"
          style={{ ...inp, flex:1 }}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading||!input.trim()} style={{
          padding:"8px 14px", borderRadius:8, border:"none",
          background: input.trim() ? "#2563eb" : "#e2e8f0",
          color: input.trim() ? "#fff" : "#94a3b8",
          cursor:"pointer", fontSize:14, fontWeight:700, flexShrink:0,
        }}>送信</button>
      </div>
    </div>
  );

  // List screen
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>🎭 ロールプレイ</h3>
          <button onClick={()=>setShowAddScenario(true)} style={{ background:"#7c3aed", border:"none", borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer", color:"#fff", fontWeight:600 }}>＋自作</button>
        </div>

        {/* Mode selector */}
        <div style={{ background:"#f8fafc", borderRadius:10, padding:10, marginBottom:10, border:"1px solid #e2e8f0" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:6 }}>フィードバックモード</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["normal","通常（終了後まとめて）"],["practice","練習（リアルタイム指摘）"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFeedbackMode(v)} style={{
                flex:1, padding:"6px 0", borderRadius:8, border:"2px solid " + (feedbackMode===v?"#7c3aed":"#e2e8f0"),
                background: feedbackMode===v?"#f5f3ff":"#fff", cursor:"pointer", fontSize:10, fontWeight:feedbackMode===v?700:400,
                color: feedbackMode===v?"#7c3aed":"#64748b",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8 }}>
          {categories.map(c=>(
            <button key={c} onClick={()=>setFilterCat(c)} style={{
              padding:"3px 10px", borderRadius:99, border:"none", cursor:"pointer", whiteSpace:"nowrap",
              fontSize:11, fontWeight:600,
              background: filterCat===c ? "#7c3aed" : "#f1f5f9",
              color: filterCat===c ? "#fff" : "#64748b",
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>{filtered.length}シナリオ</div>
        {filtered.map(s=>(
          <div key={s.id} onClick={()=>startScenario(s)} style={{
            background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, marginBottom:8, padding:"12px 14px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:diffBg(s.difficulty), color:diffColor(s.difficulty), fontWeight:700 }}>{s.difficulty}</span>
                <span style={{ fontSize:10, color:"#94a3b8" }}>{s.category}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:2 }}>{s.title}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{s.description}</div>
            </div>
            <div style={{ fontSize:18, color:"#cbd5e1" }}>▶</div>
          </div>
        ))}
      </div>

      {/* Add custom scenario modal */}
      {showAddScenario && (
        <Modal onClose={()=>setShowAddScenario(false)}>
          <h4 style={{ margin:"0 0 12px", fontSize:15 }}>シナリオを自作</h4>
          <Field label="タイトル"><input value={newScenario.title} onChange={e=>setNewScenario(s=>({...s,title:e.target.value}))} placeholder="例: 医師との面談" style={inp} /></Field>
          <Field label="カテゴリー">
            <select value={newScenario.category} onChange={e=>setNewScenario(s=>({...s,category:e.target.value}))} style={inp}>
              {["🤿 ダイビング","💼 職場","🏛️ 規制当局","🎪 展示会","💬 日常"].map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="説明"><input value={newScenario.description} onChange={e=>setNewScenario(s=>({...s,description:e.target.value}))} placeholder="このシナリオの説明" style={inp} /></Field>
          <Field label="難易度">
            <div style={{ display:"flex", gap:6 }}>
              {["初級","中級","上級"].map(d=>(
                <button key={d} onClick={()=>setNewScenario(s=>({...s,difficulty:d}))} style={{ flex:1, padding:"6px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background:newScenario.difficulty===d?diffColor(d):"#f1f5f9", color:newScenario.difficulty===d?"#fff":diffColor(d) }}>{d}</button>
              ))}
            </div>
          </Field>
          <Field label="AIへの指示（英語で）">
            <textarea value={newScenario.systemPrompt} onChange={e=>setNewScenario(s=>({...s,systemPrompt:e.target.value}))} placeholder="You are a... Start by..." style={{ ...inp, height:80, resize:"none", fontFamily:"inherit" }} />
          </Field>
          <ModalButtons
            onCancel={()=>setShowAddScenario(false)}
            onOk={()=>{
              if(!newScenario.title.trim()) return;
              setCustomScenarios(prev=>[...prev, {...newScenario, id:uid()}]);
              setNewScenario({ title:"", category:"💬 日常", description:"", difficulty:"中級", systemPrompt:"" });
              setShowAddScenario(false);
            }}
            okLabel="追加する"
          />
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
      case "home": return <HomeTab phrases={phrases} vocab={vocab} progress={progress} goals={goals} onNavigate={setTab} />;
      case "phrases": return <PhrasesTab phrases={phrases} setPhrases={setPhrases} />;
      case "vocab": return <VocabTab vocab={vocab} setVocab={setVocab} />;
      case "quiz": return <QuizTab phrases={phrases} vocab={vocab} setProgress={setProgress} weaknesses={weaknesses} setWeaknesses={setWeaknesses} />;
      case "diary": return <DiaryTab setPhrases={setPhrases} weaknesses={weaknesses} />;
      case "roleplay": return <RoleplayTab />;
      case "goals": return <GoalsTab goals={goals} setGoals={setGoals} progress={progress} weaknesses={weaknesses} phrases={phrases} vocab={vocab} />;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth:430,margin:"0 auto",height:"100vh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,'Hiragino Sans','Yu Gothic',sans-serif",background:"#f8fafc",overflow:"hidden" }}>
      <div style={{ flex:1,overflowY:"auto" }}>{renderTab()}</div>
      <Nav active={tab} onChange={setTab} />
    </div>
  );
}
