"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// ── Types ──────────────────────────────────────────────────────
type HeroConfig = { subtitle: string; title: string; body: string; titleColor: string; highlightColor: string; fontFamily: "serif" | "sans" };
type ProgramItem = { id: string; title: string; desc: string };
type RoleSection = { title: string; heading: string; body: string; bullets: string[] };
type StorySection = { quote: string; author: string; meta: string };
type JoinSection = { heading: string; body: string };
type KoSection = {
  hero: { subtitle: string; title: string; body: string };
  programsHeading: string;
  programsSubheading: string;
  programs: ProgramItem[];
  teachers: { heading: string; body: string; bullets: string[] };
  learners: { heading: string; body: string; bullets: string[] };
  story: { quote: string; author: string };
  join: { heading: string; body: string };
};
type LandingConfig = {
  hero: HeroConfig;
  heroLogo: { url: string };
  programs: ProgramItem[];
  programsHeading: string;
  programsSubheading: string;
  teachers: RoleSection;
  learners: RoleSection;
  story: StorySection;
  join: JoinSection;
  ko: KoSection;
};

// ── Defaults ───────────────────────────────────────────────────
const defaultConfig: LandingConfig = {
  hero: {
    subtitle: "LEXIOX · TOEFL · ACADEMY PLATFORM",
    title: "For every Language learner,\nevery classroom.\nReal progress.\nMeasurable results.",
    body: "LEXiOX connects adaptive Language Learning platform specializing in TOEFL, SAT, ACT Prep, academy management, and real-time feedback into one place, so students, teachers, and parents can see exactly how learning grows.",
    titleColor: "#022c22",
    highlightColor: "#047857",
    fontFamily: "serif",
  },
  heroLogo: { url: "/LEXiOX.png" },
  programsHeading: "Programs for every learner",
  programsSubheading: "Two programs, one account. Pick a lane, or run both.",
  programs: [
    { id: "p1", title: "TOEFL Prep & Mock TEST", desc: "Adaptive Reading & Listening, plus Speaking & Writing practice sets." },
    { id: "p2", title: "LEXiOX English Jr. · Naesin · LEXiOX", desc: "A dedicated module for middle & high school learners." },
    { id: "p3", title: "GAP (Global Art Pathway) Curriculum", desc: "Two-month intensive to help students reach their full potential." },
  ],
  teachers: {
    title: "TEACHERS",
    heading: "Differentiate your classroom and engage every student.",
    body: "Assign TOEFL sets, see real-time results, and focus your class time on coaching—not paperwork.",
    bullets: ["Instant reports by skill, passage, and question type", "Auto-graded Reading & Listening with detailed explanations", "Homework tracking and class dashboards"],
  },
  learners: {
    title: "LEARNERS AND STUDENTS",
    heading: "You can learn anything.",
    body: "Build solid understanding in reading, listening, speaking, and writing.",
    bullets: ["Adaptive difficulty that stays just above your comfort zone", "Instant explanations in clear, student-friendly English", "Point system to keep daily practice fun and continuity"],
  },
  story: { quote: "I used to guess my way through TOEFL Reading. With LEXiOX, I can finally see why I got each question wrong.", author: "JIHO · HIGH SCHOOL STUDENT", meta: "" },
  join: { heading: "Join LEXiOX today", body: "Start with a single class, or roll out to your whole Academy." },
  ko: {
    hero: {
      subtitle: "LEXiOX · 토플 · 아카데미 플랫폼",
      title: "모든 언어 학습자를,\n모든 교실에서.\n진짜 실력 향상.\n눈에 보이는 결과.",
      body: "LEXiOX는 토플·SAT·ACT 준비, 학원 관리, 실시간 피드백을 하나로 연결하는 적응형 영어 학습 플랫폼입니다.",
    },
    programsHeading: "모든 학습자를 위한 프로그램",
    programsSubheading: "두 프로그램, 하나의 계정. 원하는 과정을 선택하거나 둘 다 수강하세요.",
    programs: [
      { id: "p1", title: "토플 대비 & 모의고사", desc: "적응형 Reading·Listening, Speaking·Writing 연습 세트와 실시간 AI 피드백 리포트를 제공합니다." },
      { id: "p2", title: "LEXiOX Jr. · 내신 · LEXiOX", desc: "중·고등학생을 위한 전용 모듈로 내신과 영어 기초를 동시에 잡습니다." },
      { id: "p3", title: "GAP (글로벌 아트 패스웨이) 커리큘럼", desc: "2개월 집중 과정으로 학생의 잠재력을 최대로 끌어냅니다." },
    ],
    teachers: {
      heading: "수업을 차별화하고 모든 학생을 집중시키세요.",
      body: "토플 세트를 배정하고, 실시간 결과를 확인하고, 수업 시간을 서류 작업이 아닌 코칭에 집중하세요.",
      bullets: ["스킬·지문·문제 유형별 즉각 리포트", "Reading·Listening 자동 채점 및 상세 해설", "숙제 관리 및 학급 대시보드"],
    },
    learners: {
      heading: "무엇이든 배울 수 있습니다.",
      body: "읽기, 듣기, 말하기, 쓰기 전 영역을 탄탄히 다지세요. 내가 푼 모든 문제가 시스템을 학습시켜 더 맞춤화된 도움을 줍니다.",
      bullets: ["실력 바로 위를 유지하는 적응형 난이도", "학생 친화적인 한국어·영어 즉각 해설", "매일 연습을 즐겁게 만드는 포인트 시스템"],
    },
    story: { quote: "전에는 토플 리딩을 감으로 풀었어요. LEXiOX 덕분에 왜 틀렸는지, 무엇을 고쳐야 하는지 드디어 보이기 시작했어요.", author: "지호 · 고등학생" },
    join: { heading: "오늘 LEXiOX를 시작하세요", body: "단 하나의 학급으로 시작하거나, 학원 전체에 도입하세요. LEXiOX는 학습자와 함께 성장합니다." },
  },
};

const BUCKET_NAME = "public-assets";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

async function readResponseError(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (typeof json?.error === "string" && json.error.trim()) return json.error;
      return JSON.stringify(json);
    }
    return (await res.text()) || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// ── Component ──────────────────────────────────────────────────
export default function LandingAdminPage() {
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [langTab, setLangTab] = useState<"en" | "ko">("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = useMemo(() => createClientComponentClient(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErrorMsg(null);
        const res = await fetch("/api/admin/landing", { method: "GET", cache: "no-store" });
        if (!res.ok) throw new Error(await readResponseError(res));
        const data = await res.json();
        if (!cancelled && isPlainObject(data) && Object.keys(data).length > 0) {
          const d = data as Partial<LandingConfig>;
          setConfig((prev) => ({ ...prev, ...d, ko: { ...prev.ko, ...(d.ko ?? {}) } }));
        }
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err?.message || "Failed to load landing config.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── EN updaters ────────────────────────────────────────────
  const updateHero = (patch: Partial<LandingConfig["hero"]>) =>
    setConfig((p) => ({ ...p, hero: { ...p.hero, ...patch } }));

  const updatePrograms = (idx: number, patch: Partial<ProgramItem>) =>
    setConfig((p) => { const next = [...p.programs]; next[idx] = { ...next[idx], ...patch }; return { ...p, programs: next }; });

  const updateRole = (key: "teachers" | "learners", patch: Partial<RoleSection>) =>
    setConfig((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  // ── KO updaters ────────────────────────────────────────────
  const updateKoHero = (patch: Partial<KoSection["hero"]>) =>
    setConfig((p) => ({ ...p, ko: { ...p.ko, hero: { ...p.ko.hero, ...patch } } }));

  const updateKoPrograms = (idx: number, patch: Partial<ProgramItem>) =>
    setConfig((p) => { const next = [...p.ko.programs]; next[idx] = { ...next[idx], ...patch }; return { ...p, ko: { ...p.ko, programs: next } }; });

  const updateKoRole = (key: "teachers" | "learners", patch: Partial<KoSection["teachers"]>) =>
    setConfig((p) => ({ ...p, ko: { ...p.ko, [key]: { ...p.ko[key], ...patch } } }));

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setStatusMsg(null); setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/landing", { method: "PUT", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(config) });
      if (!res.ok) throw new Error(await readResponseError(res));
      const data = await res.json();
      if (isPlainObject(data) && Object.keys(data).length > 0) {
        const d = data as Partial<LandingConfig>;
        setConfig((prev) => ({ ...prev, ...d, ko: { ...prev.ko, ...(d.ko ?? {}) } }));
      }
      setStatusMsg("저장 완료 ✅");
      alert("대문 설정 저장 완료 ✅");
    } catch (err: any) {
      const msg = err?.message || "저장 중 오류가 발생했어.";
      setErrorMsg(msg);
      alert(`저장 실패\n\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Logo upload ────────────────────────────────────────────
  const handleLogoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setStatusMsg(null); setErrorMsg(null); setSelectedFileName(file.name);
    try {
      const ext = (file.name.split(".").pop()?.toLowerCase() || "png").replace(/[^a-z0-9]/g, "") || "png";
      const path = `landing/hero-logo-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
      if (!publicData?.publicUrl) throw new Error("Could not get public URL for uploaded image.");
      setConfig((p) => ({ ...p, heroLogo: { url: publicData.publicUrl } }));
      setStatusMsg("로고 업로드 완료 ✅");
    } catch (err: any) {
      const msg = err?.message || "이미지 업로드에 실패했어.";
      setErrorMsg(msg);
      alert(`이미지 업로드 실패\n\n${msg}`);
    } finally {
      setUploading(false); e.target.value = "";
    }
  };

  if (loading) return <div className="p-6">Loading landing config…</div>;

  // ── Shared section styles ──────────────────────────────────
  const card = "space-y-2 rounded-lg border bg-white p-4";
  const label = "block text-xs font-semibold text-slate-600";
  const input = "mb-2 w-full rounded border px-3 py-2 text-sm";
  const textarea = (rows: number) => `w-full rounded border px-3 py-2 text-sm`;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      {/* Header + lang tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Landing Page Editor</h1>
        <div className="flex rounded-lg border overflow-hidden text-sm font-semibold">
          <button onClick={() => setLangTab("en")} className={`px-4 py-2 transition-colors ${langTab === "en" ? "bg-emerald-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>🇺🇸 English</button>
          <button onClick={() => setLangTab("ko")} className={`px-4 py-2 transition-colors ${langTab === "ko" ? "bg-emerald-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>🇰🇷 한국어</button>
        </div>
      </div>

      {(statusMsg || errorMsg) && (
        <div className={`rounded-lg border p-3 text-sm ${errorMsg ? "border-red-300 bg-red-50 text-red-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {errorMsg ?? statusMsg}
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        {/* ── Editor column ─────────────────────────────────── */}
        <section className="w-full space-y-6 md:w-1/2">

          {langTab === "en" ? (
            <>
              {/* EN: Hero */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">Hero (English)</h2>
                <label className={label}>Subtitle</label>
                <input className={input} value={config.hero.subtitle} onChange={(e) => updateHero({ subtitle: e.target.value })} />
                <label className={label}>Title (줄바꿈 = 엔터)</label>
                <textarea rows={4} className={textarea(4)} value={config.hero.title} onChange={(e) => updateHero({ title: e.target.value })} />
                <label className={label}>Body</label>
                <textarea rows={4} className={textarea(4)} value={config.hero.body} onChange={(e) => updateHero({ body: e.target.value })} />
                <div className="mt-3 flex gap-4 flex-wrap">
                  <div className="space-y-1">
                    <span className="block text-xs font-semibold">Title Color</span>
                    <input type="color" value={config.hero.titleColor} onChange={(e) => updateHero({ titleColor: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs font-semibold">Highlight Color</span>
                    <input type="color" value={config.hero.highlightColor} onChange={(e) => updateHero({ highlightColor: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs font-semibold">Font</span>
                    <select className="rounded border px-2 py-1 text-xs" value={config.hero.fontFamily} onChange={(e) => updateHero({ fontFamily: e.target.value as "serif" | "sans" })}>
                      <option value="serif">Serif</option>
                      <option value="sans">Sans</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <span className="block text-xs font-semibold text-slate-600">Hero Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoFile} className="text-xs" />
                  {selectedFileName && <p className="text-[11px] text-slate-600">Selected: {selectedFileName}</p>}
                  <input className="w-full rounded border px-3 py-2 text-xs" value={config.heroLogo.url} onChange={(e) => setConfig((p) => ({ ...p, heroLogo: { url: e.target.value } }))} placeholder="Logo URL" />
                </div>
              </div>

              {/* EN: Programs */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">Programs (English)</h2>
                <label className={label}>Section Heading</label>
                <input className={input} value={config.programsHeading ?? ""} onChange={(e) => setConfig((p) => ({ ...p, programsHeading: e.target.value }))} />
                <label className={label}>Section Subheading</label>
                <input className={input} value={config.programsSubheading ?? ""} onChange={(e) => setConfig((p) => ({ ...p, programsSubheading: e.target.value }))} />
                {config.programs.map((p, idx) => (
                  <div key={p.id} className="space-y-1 border-t pt-2 first:border-t-0">
                    <input className="w-full rounded border px-2 py-1 text-xs font-semibold" value={p.title} onChange={(e) => updatePrograms(idx, { title: e.target.value })} />
                    <textarea rows={2} className="w-full rounded border px-2 py-1 text-xs" value={p.desc} onChange={(e) => updatePrograms(idx, { desc: e.target.value })} />
                  </div>
                ))}
              </div>

              {/* EN: Teachers + Learners */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">Teachers (English)</h2>
                <input className={input} value={config.teachers.heading} onChange={(e) => updateRole("teachers", { heading: e.target.value })} placeholder="Heading" />
                <textarea rows={3} className={textarea(3)} value={config.teachers.body} onChange={(e) => updateRole("teachers", { body: e.target.value })} placeholder="Body" />
                <label className={label}>Bullets (한 줄 = 1개)</label>
                <textarea rows={3} className={textarea(3)} value={config.teachers.bullets.join("\n")} onChange={(e) => updateRole("teachers", { bullets: e.target.value.split("\n") })} />
                <h2 className="mt-4 text-sm font-semibold text-slate-800">Learners (English)</h2>
                <input className={input} value={config.learners.heading} onChange={(e) => updateRole("learners", { heading: e.target.value })} placeholder="Heading" />
                <textarea rows={3} className={textarea(3)} value={config.learners.body} onChange={(e) => updateRole("learners", { body: e.target.value })} placeholder="Body" />
                <label className={label}>Bullets (한 줄 = 1개)</label>
                <textarea rows={3} className={textarea(3)} value={config.learners.bullets.join("\n")} onChange={(e) => updateRole("learners", { bullets: e.target.value.split("\n") })} />
              </div>

              {/* EN: Story + Join */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">Story</h2>
                <textarea rows={3} className={textarea(3)} value={config.story.quote} onChange={(e) => setConfig((p) => ({ ...p, story: { ...p.story, quote: e.target.value } }))} />
                <input className={input} value={config.story.author} onChange={(e) => setConfig((p) => ({ ...p, story: { ...p.story, author: e.target.value } }))} />
                <h2 className="mt-4 text-sm font-semibold text-slate-800">Join CTA</h2>
                <input className={input} value={config.join.heading} onChange={(e) => setConfig((p) => ({ ...p, join: { ...p.join, heading: e.target.value } }))} />
                <textarea rows={2} className={textarea(2)} value={config.join.body} onChange={(e) => setConfig((p) => ({ ...p, join: { ...p.join, body: e.target.value } }))} />
              </div>
            </>
          ) : (
            <>
              {/* KO: Hero */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">Hero (한국어)</h2>
                <label className={label}>서브타이틀</label>
                <input className={input} value={config.ko.hero.subtitle} onChange={(e) => updateKoHero({ subtitle: e.target.value })} />
                <label className={label}>타이틀 (줄바꿈 = 엔터)</label>
                <textarea rows={4} className={textarea(4)} value={config.ko.hero.title} onChange={(e) => updateKoHero({ title: e.target.value })} />
                <label className={label}>본문</label>
                <textarea rows={4} className={textarea(4)} value={config.ko.hero.body} onChange={(e) => updateKoHero({ body: e.target.value })} />
              </div>

              {/* KO: Programs */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">Programs (한국어)</h2>
                <label className={label}>섹션 헤딩</label>
                <input className={input} value={config.ko.programsHeading} onChange={(e) => setConfig((p) => ({ ...p, ko: { ...p.ko, programsHeading: e.target.value } }))} />
                <label className={label}>섹션 서브헤딩</label>
                <input className={input} value={config.ko.programsSubheading} onChange={(e) => setConfig((p) => ({ ...p, ko: { ...p.ko, programsSubheading: e.target.value } }))} />
                {config.ko.programs.map((p, idx) => (
                  <div key={p.id} className="space-y-1 border-t pt-2 first:border-t-0">
                    <input className="w-full rounded border px-2 py-1 text-xs font-semibold" value={p.title} onChange={(e) => updateKoPrograms(idx, { title: e.target.value })} />
                    <textarea rows={2} className="w-full rounded border px-2 py-1 text-xs" value={p.desc} onChange={(e) => updateKoPrograms(idx, { desc: e.target.value })} />
                  </div>
                ))}
              </div>

              {/* KO: Teachers + Learners */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">선생님 섹션</h2>
                <input className={input} value={config.ko.teachers.heading} onChange={(e) => updateKoRole("teachers", { heading: e.target.value })} placeholder="헤딩" />
                <textarea rows={3} className={textarea(3)} value={config.ko.teachers.body} onChange={(e) => updateKoRole("teachers", { body: e.target.value })} placeholder="본문" />
                <label className={label}>불릿 (한 줄 = 1개)</label>
                <textarea rows={3} className={textarea(3)} value={config.ko.teachers.bullets.join("\n")} onChange={(e) => updateKoRole("teachers", { bullets: e.target.value.split("\n") })} />
                <h2 className="mt-4 text-sm font-semibold text-slate-800">학생 섹션</h2>
                <input className={input} value={config.ko.learners.heading} onChange={(e) => updateKoRole("learners", { heading: e.target.value })} placeholder="헤딩" />
                <textarea rows={3} className={textarea(3)} value={config.ko.learners.body} onChange={(e) => updateKoRole("learners", { body: e.target.value })} placeholder="본문" />
                <label className={label}>불릿 (한 줄 = 1개)</label>
                <textarea rows={3} className={textarea(3)} value={config.ko.learners.bullets.join("\n")} onChange={(e) => updateKoRole("learners", { bullets: e.target.value.split("\n") })} />
              </div>

              {/* KO: Story + Join */}
              <div className={card}>
                <h2 className="text-sm font-semibold text-slate-800">스토리 (후기)</h2>
                <textarea rows={3} className={textarea(3)} value={config.ko.story.quote} onChange={(e) => setConfig((p) => ({ ...p, ko: { ...p.ko, story: { ...p.ko.story, quote: e.target.value } } }))} />
                <input className={input} value={config.ko.story.author} onChange={(e) => setConfig((p) => ({ ...p, ko: { ...p.ko, story: { ...p.ko.story, author: e.target.value } } }))} />
                <h2 className="mt-4 text-sm font-semibold text-slate-800">참여 유도 (Join CTA)</h2>
                <input className={input} value={config.ko.join.heading} onChange={(e) => setConfig((p) => ({ ...p, ko: { ...p.ko, join: { ...p.ko.join, heading: e.target.value } } }))} />
                <textarea rows={2} className={textarea(2)} value={config.ko.join.body} onChange={(e) => setConfig((p) => ({ ...p, ko: { ...p.ko, join: { ...p.ko.join, body: e.target.value } } }))} />
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="rounded bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : uploading ? "Uploading image…" : "Save Landing Page"}
          </button>
        </section>

        {/* ── Preview column ────────────────────────────────── */}
        <section className="w-full rounded-2xl border bg-slate-50 p-6 md:w-1/2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Preview · {langTab === "en" ? "English" : "한국어"}</p>
          {langTab === "en" ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mt-3">{config.hero.subtitle}</p>
              <h2 className={`mt-2 text-2xl font-extrabold leading-tight ${config.hero.fontFamily === "serif" ? "font-serif" : "font-sans"}`} style={{ color: config.hero.titleColor }}>
                {config.hero.title.split("\n").map((line, i) => <span key={i} className="block">{i === 2 ? <span style={{ color: config.hero.highlightColor }}>{line}</span> : line}</span>)}
              </h2>
              <p className="mt-2 text-xs text-slate-600">{config.hero.body}</p>
              <div className="mt-4 grid gap-2 grid-cols-2">
                {config.programs.map((p) => (
                  <div key={p.id} className="rounded-lg border bg-white p-2 text-xs">
                    <p className="font-semibold text-slate-900">{p.title}</p>
                    <p className="mt-1 text-slate-500">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-xs">
                <p className="font-semibold text-slate-800">{config.teachers.heading}</p>
                <p className="text-slate-500">{config.teachers.body}</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mt-3">{config.ko.hero.subtitle}</p>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight font-serif" style={{ color: config.hero.titleColor }}>
                {config.ko.hero.title.split("\n").map((line, i) => <span key={i} className="block">{i === 2 ? <span style={{ color: config.hero.highlightColor }}>{line}</span> : line}</span>)}
              </h2>
              <p className="mt-2 text-xs text-slate-600">{config.ko.hero.body}</p>
              <div className="mt-4 grid gap-2 grid-cols-2">
                {config.ko.programs.map((p) => (
                  <div key={p.id} className="rounded-lg border bg-white p-2 text-xs">
                    <p className="font-semibold text-slate-900">{p.title}</p>
                    <p className="mt-1 text-slate-500">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-xs">
                <p className="font-semibold text-slate-800">{config.ko.teachers.heading}</p>
                <p className="text-slate-500">{config.ko.teachers.body}</p>
              </div>
            </>
          )}
          {config.heroLogo.url && (
            <div className="mt-4">
              <Image src={config.heroLogo.url} alt="logo preview" width={80} height={40} className="h-10 w-auto object-contain" unoptimized />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
