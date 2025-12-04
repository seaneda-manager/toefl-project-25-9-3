"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type HeroConfig = {
  subtitle: string;
  title: string;
  body: string;
  titleColor: string;
  highlightColor: string;
  fontFamily: "serif" | "sans";
};

type ProgramItem = {
  id: string;
  title: string;
  desc: string;
};

type RoleSection = {
  title: string;
  heading: string;
  body: string;
  bullets: string[];
};

type StorySection = {
  quote: string;
  author: string;
  meta: string;
};

type JoinSection = {
  heading: string;
  body: string;
};

type LandingConfig = {
  hero: HeroConfig;
  heroLogo: { url: string };
  programs: ProgramItem[];
  teachers: RoleSection;
  learners: RoleSection;
  story: StorySection;
  join: JoinSection;
};

const defaultConfig: LandingConfig = {
  hero: {
    subtitle: "TOEFL · ACADEMY PLATFORM",
    title:
      "For every TOEFL learner,\nevery classroom.\nReal progress. Measurable results.",
    body:
      "K-PRIME connects adaptive TOEFL practice, academy management, and real-time feedback into one place—so students, teachers, and parents can see exactly how learning grows.",
    titleColor: "#022c22",
    highlightColor: "#047857",
    fontFamily: "serif",
  },
  heroLogo: { url: "/k-prime-logo.png" },
  programs: [
    {
      id: "p1",
      title: "TOEFL iBT 2026",
      desc: "Adaptive Reading & Listening, plus Speaking & Writing practice sets.",
    },
    {
      id: "p2",
      title: "Grammar & Structure",
      desc: "3-month intensive course for middle & high school learners.",
    },
    {
      id: "p3",
      title: "Mock Tests",
      desc: "Full-length timed tests with teacher-friendly reports.",
    },
  ],
  teachers: {
    title: "TEACHERS",
    heading: "Differentiate your classroom and engage every student.",
    body:
      "Assign TOEFL sets, see real-time results, and focus your class time on coaching—not paperwork. K-PRIME is built for 학원 teachers who need both depth and speed.",
    bullets: [
      "Instant reports by skill, passage, and question type",
      "Auto-graded Reading & Listening with detailed explanations",
      "Homework tracking and class dashboards",
    ],
  },
  learners: {
    title: "LEARNERS AND STUDENTS",
    heading: "You can learn anything.",
    body:
      "Build solid understanding in reading, listening, speaking, and writing. Every question you answer teaches the system how to help you next.",
    bullets: [
      "Adaptive difficulty that stays just above your comfort zone",
      "Instant explanations in clear, student-friendly English",
      "Perk system to keep daily practice fun and motivating",
    ],
  },
  story: {
    quote:
      "I used to guess my way through TOEFL Reading. With K-PRIME, I can finally see why I got each question wrong—and what to fix next.",
    author: "JIHO · HIGH SCHOOL STUDENT",
    meta: "",
  },
  join: {
    heading: "Join K-PRIME today",
    body:
      "Start with a single class, or roll out to your whole Academy. K-PRIME grows with your learners.",
  },
};

// ✅ Supabase Storage 실제 버킷 이름
const BUCKET_NAME = "public-assets";

export default function LandingAdminPage() {
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // 초기값 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/landing");
        if (res.ok) {
          const data = await res.json();
          if (Object.keys(data).length) {
            setConfig(data);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateHero = (patch: Partial<HeroConfig>) => {
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  };

  const updatePrograms = (index: number, patch: Partial<ProgramItem>) => {
    setConfig((prev) => {
      const next = [...prev.programs];
      next[index] = { ...next[index], ...patch };
      return { ...prev, programs: next };
    });
  };

  const updateRole = (
    key: "teachers" | "learners",
    patch: Partial<RoleSection>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...(prev as any)[key], ...patch },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("save failed");
      alert("대문 설정 저장 완료 ✅");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 났어 ㅠㅠ");
    } finally {
      setSaving(false);
    }
  };

  // 이미지 업로드 (Supabase Storage 사용)
  const handleLogoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSelectedFileName(file.name); // 선택한 파일 이름 표시용

    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `landing/hero-logo-${Date.now()}.${ext}`;

      console.log("[LandingAdmin] uploading to", BUCKET_NAME, path);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("[LandingAdmin] upload error", error);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

      console.log("[LandingAdmin] publicUrl", publicUrl);

      setConfig((prev) => ({
        ...prev,
        heroLogo: { url: publicUrl },
      }));
    } catch (err: any) {
      console.error("[LandingAdmin] upload failed", err);
      alert(
        "이미지 업로드에 실패했어.\n\n" +
          (err?.message ?? "알 수 없는 오류가 발생했어.")
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6">Loading landing config…</div>;

  const titleLines = config.hero.title.split("\n");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row">
      {/* 왼쪽: 에디터 폼 */}
      <section className="w-full space-y-6 md:w-1/2">
        <h1 className="text-xl font-bold">Landing Page Editor</h1>

        {/* HERO */}
        <div className="space-y-2 rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Hero</h2>

          <label className="block text-xs font-semibold text-slate-600">
            Subtitle
          </label>
          <input
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            value={config.hero.subtitle}
            onChange={(e) => updateHero({ subtitle: e.target.value })}
          />

          <label className="block text-xs font-semibold text-slate-600">
            Title (줄바꿈 = 엔터)
          </label>
          <textarea
            rows={4}
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            value={config.hero.title}
            onChange={(e) => updateHero({ title: e.target.value })}
          />

          <label className="block text-xs font-semibold text-slate-600">
            Body
          </label>
          <textarea
            rows={4}
            className="w-full rounded border px-3 py-2 text-sm"
            value={config.hero.body}
            onChange={(e) => updateHero({ body: e.target.value })}
          />

          <div className="mt-3 flex gap-4">
            <div className="space-y-1">
              <span className="block text-xs font-semibold">Title Color</span>
              <input
                type="color"
                value={config.hero.titleColor}
                onChange={(e) => updateHero({ titleColor: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold">
                Highlight Color
              </span>
              <input
                type="color"
                value={config.hero.highlightColor}
                onChange={(e) =>
                  updateHero({ highlightColor: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold">Font</span>
              <select
                className="rounded border px-2 py-1 text-xs"
                value={config.hero.fontFamily}
                onChange={(e) =>
                  updateHero({ fontFamily: e.target.value as "serif" | "sans" })
                }
              >
                <option value="serif">Serif (K-PRIME 느낌)</option>
                <option value="sans">Sans (Khan 스타일)</option>
              </select>
            </div>
          </div>

          {/* 로고 업로드 */}
          <div className="mt-4 space-y-2">
            <span className="block text-xs font-semibold text-slate-600">
              Hero Logo
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              className="text-xs"
            />
            {selectedFileName && (
              <p className="text-[11px] text-slate-600">
                Selected: {selectedFileName}
              </p>
            )}
            <p className="text-[10px] text-slate-500">
              Supabase Storage {BUCKET_NAME}/landing/ 에 업로드돼.
            </p>
            <input
              className="w-full rounded border px-3 py-2 text-xs"
              value={config.heroLogo.url}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  heroLogo: { url: e.target.value },
                }))
              }
              placeholder="업로드 후 자동으로 public URL 이 들어와요"
            />
          </div>
        </div>

        {/* PROGRAMS */}
        <div className="space-y-2 rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Programs</h2>
          {config.programs.map((p, idx) => (
            <div key={p.id} className="space-y-1 border-t pt-2 first:border-t-0">
              <input
                className="w-full rounded border px-2 py-1 text-xs font-semibold"
                value={p.title}
                onChange={(e) =>
                  updatePrograms(idx, { title: e.target.value })
                }
              />
              <textarea
                rows={2}
                className="w-full rounded border px-2 py-1 text-xs"
                value={p.desc}
                onChange={(e) =>
                  updatePrograms(idx, { desc: e.target.value })
                }
              />
            </div>
          ))}
        </div>

        {/* TEACHERS / LEARNERS */}
        <div className="space-y-2 rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Teachers</h2>
          <input
            className="mb-1 w-full rounded border px-2 py-1 text-xs"
            value={config.teachers.heading}
            onChange={(e) =>
              updateRole("teachers", { heading: e.target.value })
            }
          />
          <textarea
            rows={3}
            className="w-full rounded border px-2 py-1 text-xs"
            value={config.teachers.body}
            onChange={(e) =>
              updateRole("teachers", { body: e.target.value })
            }
          />

          <h2 className="mt-4 text-sm font-semibold text-slate-800">Learners</h2>
          <input
            className="mb-1 w-full rounded border px-2 py-1 text-xs"
            value={config.learners.heading}
            onChange={(e) =>
              updateRole("learners", { heading: e.target.value })
            }
          />
          <textarea
            rows={3}
            className="w-full rounded border px-2 py-1 text-xs"
            value={config.learners.body}
            onChange={(e) =>
              updateRole("learners", { body: e.target.value })
            }
          />
        </div>

        {/* STORY / JOIN */}
        <div className="space-y-2 rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Story</h2>
          <textarea
            rows={3}
            className="w-full rounded border px-2 py-1 text-xs"
            value={config.story.quote}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                story: { ...prev.story, quote: e.target.value },
              }))
            }
          />
          <input
            className="w-full rounded border px-2 py-1 text-xs"
            value={config.story.author}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                story: { ...prev.story, author: e.target.value },
              }))
            }
          />

          <h2 className="mt-4 text-sm font-semibold text-slate-800">Join</h2>
          <input
            className="mb-1 w-full rounded border px-2 py-1 text-xs"
            value={config.join.heading}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                join: { ...prev.join, heading: e.target.value },
              }))
            }
          />
          <textarea
            rows={2}
            className="w-full rounded border px-2 py-1 text-xs"
            value={config.join.body}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                join: { ...prev.join, body: e.target.value },
              }))
            }
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="rounded bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : uploading
            ? "Uploading image…"
            : "Save Landing Page"}
        </button>
      </section>

      {/* 오른쪽: 프리뷰 */}
      <section className="w-full rounded-2xl border bg-slate-50 p-6 md:w-1/2">
        <p className="text-xs font-semibold tracking-[0.24em] text-emerald-700">
          {config.hero.subtitle}
        </p>
        <h2
          className={`mt-3 text-3xl font-extrabold leading-tight ${
            config.hero.fontFamily === "serif" ? "font-serif" : "font-sans"
          }`}
          style={{ color: config.hero.titleColor }}
        >
          {titleLines.map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </h2>
        <p className="mt-3 text-sm text-slate-700">{config.hero.body}</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="rounded-2xl border bg-white p-4">
            {config.heroLogo.url ? (
              <Image
                src={config.heroLogo.url}
                alt="Hero logo preview"
                width={96}
                height={96}
                className="h-24 w-24 object-contain"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center text-[10px] text-slate-400">
                No logo
              </div>
            )}
          </div>
          <div className="text-xs text-slate-600">
            <p className="font-semibold">Example CTA</p>
            <p>Learners / Teachers / Parents</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {config.programs.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border bg-white p-3 text-xs text-slate-700"
            >
              <p className="font-semibold text-slate-900">{p.title}</p>
              <p className="mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
