// tools/audit-routes.ts
// Usage: pnpm tsx tools/audit-routes.ts
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'apps/web/app');
const OUT = path.resolve(process.cwd(), 'audit');
fs.mkdirSync(OUT, { recursive: true });

type RouteItem = {
  kind: 'page' | 'layout' | 'route' | 'metadata';
  file: string;
  routePath: string;
};

const exts = ['page.tsx','page.ts','layout.tsx','layout.ts','route.ts','route.tsx','generateMetadata.ts','generateMetadata.tsx'];
const items: RouteItem[] = [];

function toRoute(p: string) {
  const rel = path.relative(ROOT, path.dirname(p)).replace(/\\/g,'/');
  // Next.js route groups () 제거
  return '/' + rel
    .replace(/\(.*?\)\//g, '')
    .replace(/^\/?$/, '')
    .replace(/\/index$/,'');
}

function walk(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (exts.some(e => f.endsWith(e))) {
      let kind: RouteItem['kind'] = f.startsWith('layout') ? 'layout'
        : f.startsWith('route') ? 'route'
        : f.startsWith('generateMetadata') ? 'metadata'
        : 'page';
      items.push({ kind, file: full, routePath: toRoute(full) || '/' });
    }
  }
}
walk(ROOT);

// 그룹화
const byRoute = items.reduce<Record<string, RouteItem[]>>((acc, it) => {
  (acc[it.routePath] ||= []).push(it);
  return acc;
}, {});

// 유사/중복 라우트 후보 감지
// 규칙: routePath 끝 segment가 동일하거나, study/test/review 모드만 다른 경우
function lastSeg(p: string) {
  const segs = p.split('/').filter(Boolean);
  return segs[segs.length - 1] || '';
}
const routes = Object.keys(byRoute).sort();
const dupes: Record<string, string[]> = {};
for (const r of routes) {
  const key = lastSeg(r).replace(/(study|test|review|dev|sample)/g,'_mode_');
  dupes[key] ||= [];
  dupes[key].push(r);
}
const dupesFiltered = Object.fromEntries(
  Object.entries(dupes).filter(([, arr]) => arr.length > 1)
);

// 컴포넌트/타입 사용처 역색인 (reading/listening 중요 파일)
const componentHints = [
  'TestRunner', 'TestRunnerV2', 'PassagePane', 'SkimGate',
  'LAudioScreen', 'LQuestionScreen'
];
const typeHints = [
  'RPassage','RQuestion','readingSetSchema',
  'ListeningTrack','LQuestion'
];
const compIndex: Record<string, string[]> = {};
const srcRoot = path.resolve(process.cwd(), 'apps/web');
function walkSrc(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkSrc(full);
    else if (/\.(tsx?|mjs|cjs|jsx)$/.test(f)) {
      const text = fs.readFileSync(full, 'utf8');
      [...componentHints, ...typeHints].forEach(h => {
        if (text.includes(h)) {
          (compIndex[h] ||= []).push(path.relative(srcRoot, full).replace(/\\/g,'/'));
        }
      });
    }
  }
}
walkSrc(srcRoot);

// 출력
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(byRoute, null, 2));
fs.writeFileSync(path.join(OUT, 'dupes.json'), JSON.stringify(dupesFiltered, null, 2));
fs.writeFileSync(path.join(OUT, 'components.json'), JSON.stringify(compIndex, null, 2));

console.log('✅ Wrote audit/routes.json, audit/dupes.json, audit/components.json');
