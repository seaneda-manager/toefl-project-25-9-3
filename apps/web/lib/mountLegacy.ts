// normalized utf8
// apps/web/lib/mountLegacy.ts
'use client';

/**
 * ���Ž� HTML ������ �����ϰ� mount�ϴ� ��ƿ.
 * - �ζ��� <script>�� JS�� ����(HTML/�ּ�/������ ��ũ��Ʈ ����)
 * - �ܺ� <script src>�� �Ӽ� ���� �� ������
 * - <link rel="stylesheet">, <style> ������(�ɼ�)
 * - �����̳�: selector | Element | Document | DocumentFragment | NodeList | Array ��� ����
 */

export type MountLegacyOptions = {
  appendTarget?: HTMLElement;     // ��ũ��Ʈ ���� �� (�⺻ document.body)
  removeOriginal?: boolean;       // ������ ��������(�⺻ true ? ����� ���������� ����)
  onDataScript?: (el: HTMLScriptElement) => boolean; // ������ ��ũ��Ʈ ���� ó�� �� true ��ȯ
  reinsertStyles?: boolean;       // ��Ÿ�� ������ ���� (�⺻ true)
};

const DEFAULTS: Required<MountLegacyOptions> = {
  appendTarget: typeof document !== 'undefined' ? document.body : (null as any),
  removeOriginal: true,
  onDataScript: () => false,
  reinsertStyles: true,
};

// ---------- env helpers ----------
function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// ---------- container normalizer ----------
/**
 * � �Է��̵� querySelectorAll�� ���� ParentNode���� �迭�� ����ȭ
 * - selector(string): document.querySelectorAll �� �ټ� ��Ī ����
 * - ���� ���: [node]
 * - NodeList/HTMLCollection/�迭: ���͸� �� �迭
 */
function normalizeToParentNodes(input: any): ParentNode[] {
  if (!isBrowser()) return [];
  if (!input) return [];

  // string selector �� ���� ���� ����
  if (typeof input === 'string') {
    return Array.from(document.querySelectorAll(input));
  }

  // ���� ���(Document, DocumentFragment, Element ��) �� querySelectorAll ���� ���η� ����
  if (typeof input.querySelectorAll === 'function') {
    return [input as ParentNode];
  }

  // NodeList / HTMLCollection / ArrayLike
  if (typeof input.length === 'number') {
    return Array.from(input).filter(
      (n: any) => n && typeof n.querySelectorAll === 'function'
    ) as ParentNode[];
  }

  console.warn('[legacy] normalize: unsupported container input, skipped', input);
  return [];
}

// ---------- script helpers ----------
function isAllowedJsType(type: string | null): boolean {
  const t = (type || '').trim().toLowerCase();
  return t === '' || t === 'text/javascript' || t === 'application/javascript' || t === 'module';
}
function isDataScriptType(type: string | null): boolean {
  const t = (type || '').trim().toLowerCase();
  return t === 'application/json' || t === 'application/ld+json' || t === 'application/schema+json';
}
function stripLegacyHtmlComment(raw: string): string {
  return raw.replace(/^\s*<!--/, '').replace(/-->\s*$/, '');
}
function looksLikeHtml(code: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(code);
}
function cloneScriptAttributes(from: HTMLScriptElement, to: HTMLScriptElement) {
  if (from.type) to.type = from.type;
  if (from.src) to.src = from.src;
  to.async = from.async;
  to.defer = from.defer;
  if (from.crossOrigin) to.crossOrigin = from.crossOrigin;
  if ((from as any).noModule) (to as any).noModule = true;
  Array.from(from.attributes).forEach((attr) => {
    const name = attr.name.toLowerCase();
    if (['type', 'src', 'async', 'defer', 'crossorigin', 'nomodule'].includes(name)) return;
    to.setAttribute(attr.name, attr.value);
  });
}
function cloneLinkAttributes(from: HTMLLinkElement, to: HTMLLinkElement) {
  Array.from(from.attributes).forEach((attr) => to.setAttribute(attr.name, attr.value));
}
function cloneStyleAttributes(from: HTMLStyleElement, to: HTMLStyleElement) {
  Array.from(from.attributes).forEach((attr) => to.setAttribute(attr.name, attr.value));
}

// ---------- core re-insertors ----------
async function mountInlineScript(el: HTMLScriptElement, appendTarget: HTMLElement): Promise<void> {
  const raw = el.textContent ?? '';
  const stripped = stripLegacyHtmlComment(raw).trim();
  if (!isAllowedJsType(el.type) || !stripped || looksLikeHtml(stripped)) {
    console.warn('[legacy] inline script syntax invalid �� skipped', {
      type: el.type || '(default)',
      preview: stripped.slice(0, 80),
    });
    return;
  }
  const s = document.createElement('script');
  cloneScriptAttributes(el, s);
  s.textContent = stripped; // CSP-safe
  try {
    appendTarget.appendChild(s);
  } catch (e) {
    console.error('[legacy] inline script append failed', e);
  }
}

async function mountExternalScript(el: HTMLScriptElement, appendTarget: HTMLElement): Promise<void> {
  const s = document.createElement('script');
  cloneScriptAttributes(el, s);
  const p = new Promise<void>((resolve, reject) => {
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${s.src || '(inline)'}`));
  });
  try {
    appendTarget.appendChild(s);
  } catch (e) {
    console.error('[legacy] external script append failed', e);
  }
  try {
    await p;
  } catch (e) {
    console.error(e);
  }
}

function reinsertScripts(
  container: ParentNode,
  appendTarget: HTMLElement,
  onDataScript: (el: HTMLScriptElement) => boolean
) {
  const scripts = container.querySelectorAll('script');
  const tasks: Promise<void>[] = [];
  scripts.forEach((node) => {
    const el = node as HTMLScriptElement;
    if (isDataScriptType(el.type)) {
      const handled = onDataScript(el);
      if (!handled) {
        console.warn('[legacy] data script skipped', {
          type: el.type,
          preview: (el.textContent || '').slice(0, 80),
        });
      }
      return;
    }
    if (el.src) tasks.push(mountExternalScript(el, appendTarget));
    else tasks.push(mountInlineScript(el, appendTarget));
  });
  return Promise.allSettled(tasks);
}

function reinsertStyles(container: ParentNode) {
  // link rel="stylesheet"
  container.querySelectorAll('link[rel="stylesheet"]').forEach((lnk) => {
    const from = lnk as HTMLLinkElement;
    const to = document.createElement('link');
    cloneLinkAttributes(from, to);
    try {
      document.head.appendChild(to);
    } catch (e) {
      console.error('[legacy] stylesheet link append failed', e);
    }
  });
  // <style>
  container.querySelectorAll('style').forEach((st) => {
    const from = st as HTMLStyleElement;
    const to = document.createElement('style');
    cloneStyleAttributes(from, to);
    to.textContent = from.textContent || '';
    try {
      document.head.appendChild(to);
    } catch (e) {
      console.error('[legacy] style append failed', e);
    }
  });
}

// ---------- public API ----------
/**
 * �����̳�(��) ���� ���Ž� ��ũ��Ʈ/��Ÿ���� �����ϰ� ������.
 * @param containerOrSelector selector | Element | Document | DocumentFragment | NodeList | Array
 */
export async function mountLegacy(
  containerOrSelector: any,
  opts?: MountLegacyOptions
) {
  if (!isBrowser()) return;

  const options = { ...DEFAULTS, ...(opts || {}) };
  const nodes = normalizeToParentNodes(containerOrSelector);

  if (!nodes.length) {
    console.warn('[legacy] mount skipped: no containers found');
    return;
  }

  for (const container of nodes) {
    if (options.reinsertStyles) {
      reinsertStyles(container);
    }
    await reinsertScripts(container, options.appendTarget!, options.onDataScript);
    // ���� ���� ������ �ʿ��ϸ� ���⼭ ó�� (����� ����)
    // if (options.removeOriginal && 'remove' in (container as any)) {
    //   try { (container as any).remove(); } catch {}
    // }
  }
}

/**
 * ���ڿ� HTML�� �ӽ� �����̳ʿ� �־� mount.
 */
export async function mountLegacyFromString(html: string, opts?: MountLegacyOptions) {
  if (!isBrowser()) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  await mountLegacy(tmp, opts);
}

export default mountLegacy;

