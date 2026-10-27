import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCES_DIR = path.join(__dirname, 'sources');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = __dirname;

// Home preset chips. An article matches when one of its tags is listed here.
// Match is exact. Title substrings are intentionally not used.
const PRESETS = [
  { name: 'AI', tags: ['AI', 'AGI', '에이전트', '언어모델', 'AI안전', 'AI윤리', 'AI철학', '해석가능성', '생성형AI', '정보이론'] },
  { name: '컴퓨터', tags: ['컴퓨터과학', '계산이론', '컴퓨터구조', '컴퓨터과학사', '메모리모델', '포인터', '자료구조', '컴파일러', '시스템프로그래밍', '소프트웨어공학', '아키텍처', '프로그래밍언어', '객체지향', '가비지컬렉션', '압축', 'Python', 'CPython', 'C-Cpp', 'Go', 'Rust'] },
  { name: '법', tags: ['노동법', '법학', '근로자성', '플랫폼노동', '종속성', '타인결정성', '근로자추정', '노동3권', '노동법사', '비교노동법', '독일노동법', '미국노동법', '해고법제', '형법', '업무방해죄', '공정거래법', '법철학', '규제'] },
  { name: '역사', tags: ['역사', '사회과학', '고대사', '서양문명', '문화혼종성', '청동기시대', '스페인정복', '군사사', '지정학', '국제정치경제학'] },
  { name: '수학', tags: ['수학', '수학사', '해석기하학', '대수학', '미적분학', '기호학'] },
  { name: '사상', tags: ['철학', '문화예술', '과학철학', '동양철학', '법가사상', '정치철학', '법철학', 'AI철학', '종교', '디자인', '한비자', '데카르트', '홉스', '라이프니츠'] },
  { name: '과학', tags: ['생물학', '자연과학', '우주론', '시스템생물학', '공생발생', '진화생물학', '고유전학'] },
  { name: '경제', tags: ['경제경영', '기업재무', '가치평가', '조직설계', '생산성', '자영업경제학', '국제정치경제학'] }
];

const FIELD_TAGS = new Set([
  'AI', '컴퓨터과학', '노동법', '법학', '역사', '수학',
  '철학', '경제경영', '생물학', '자연과학', '사회과학', '문화예술'
]);
const FORMAT_TAGS = new Set(['인터뷰', '강연', '논문리뷰', '해설', '튜토리얼', '요약']);
const VALID_TAG_RE = /^[가-힣A-Za-z0-9]+(-[가-힣A-Za-z0-9]+)*$/;
const CONTROLLED_VOCAB = new Set([
  // 12 Field
  'AI', '컴퓨터과학', '노동법', '법학', '역사', '수학',
  '철학', '경제경영', '생물학', '자연과학', '사회과학', '문화예술',
  // 73 Topic
  'AGI', '에이전트', '언어모델', 'AI안전', 'AI윤리', 'AI철학', '해석가능성', '생성형AI', '정보이론',
  '계산이론', '컴퓨터구조', '컴퓨터과학사', '메모리모델', '포인터', '자료구조', '컴파일러',
  '시스템프로그래밍', '소프트웨어공학', '아키텍처', '프로그래밍언어', '객체지향', '가비지컬렉션',
  '압축', 'Python', 'CPython', 'C-Cpp', 'Go', 'Rust',
  '근로자성', '플랫폼노동', '종속성', '타인결정성', '근로자추정', '노동3권', '노동법사',
  '비교노동법', '독일노동법', '미국노동법', '해고법제', '형법', '업무방해죄', '공정거래법', '법철학', '규제',
  '고대사', '서양문명', '문화혼종성', '청동기시대', '스페인정복', '군사사', '지정학', '국제정치경제학',
  '수학사', '해석기하학', '대수학', '미적분학', '기호학', '우주론', '시스템생물학', '공생발생',
  '진화생물학', '고유전학',
  '과학철학', '동양철학', '법가사상', '정치철학', '종교', '디자인',
  '기업재무', '가치평가', '조직설계', '생산성', '자영업경제학',
  // 15 Entity
  '스튜어트러셀', '제프리헌틀리', '이선몰릭', '아스워스다모다란', '타일러코웬',
  '데니스노블', '블레즈아구에라이아르카스', '조세핀퀸', '한비자', '데카르트',
  '페르마', '뉴턴', '홉스', '라이프니츠', '앤트로픽',
  // 6 Format
  '인터뷰', '강연', '논문리뷰', '해설', '튜토리얼', '요약'
]);

function lintArticleTags(id, tags, controlledSet) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(tags) || tags.length < 2 || tags.length > 5) {
    errors.push(`[TAG-LINT:L1] 수량 위반 (${tags ? tags.length : 0}개): 태그는 2~5개여야 합니다.`);
  }
  const seen = new Set();
  for (const t of (tags || [])) {
    if (/\s/.test(t)) {
      errors.push(`[TAG-LINT:L2] 공백 포함 금지: '${t}' → '${t.replace(/\s+/g, '')}'`);
    }
    if (!VALID_TAG_RE.test(t)) {
      errors.push(`[TAG-LINT:L3] 특수기호 금지: '${t}'`);
    }
    const low = t.toLowerCase();
    if (seen.has(low)) errors.push(`[TAG-LINT:L4] 중복 태그 발견: '${t}'`);
    seen.add(low);
    if (controlledSet && !controlledSet.has(t)) {
      warnings.push(`[TAG-LINT:L7] 미등재 신규 태그 감지: '${t}' (표준 학문 분과명인지 확인하세요)`);
    }
  }
  const fieldCount = (tags || []).filter(t => FIELD_TAGS.has(t)).length;
  if (fieldCount === 0) {
    errors.push(`[TAG-LINT:L5] 필수 분야 태그 누락: 12대 분야 태그 중 최소 1개를 포함하세요.`);
  }
  const formatCount = (tags || []).filter(t => FORMAT_TAGS.has(t)).length;
  if (formatCount !== 1) {
    warnings.push(`[TAG-LINT:L6] 형식 태그 권장 위반 (현재 ${formatCount}개): 6대 형식 태그 중 1개 권장.`);
  }
  return { errors, warnings };
}

function presetsFor(tags) {
  const list = Array.isArray(tags) ? tags : [];
  return PRESETS.filter(preset => list.some(tag => preset.tags.includes(tag))).map(preset => preset.name);
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Read templates
const articleTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'article.html'), 'utf-8');
const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf-8');

/**
 * Simple YAML Frontmatter Parser
 */
function parseFrontMatter(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    return { data: {}, content: rawContent };
  }

  const yamlBlock = match[1];
  const bodyContent = rawContent.slice(match[0].length);
  const data = {};

  let currentKey = null;
  let isList = false;

  yamlBlock.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (line.startsWith('  - ') && currentKey && isList) {
      const val = trimmed.replace(/^-\s*/, '').trim().replace(/^['"]|['"]$/g, '');
      data[currentKey].push(val);
      return;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (val === '') {
        currentKey = key;
        isList = true;
        data[key] = [];
      } else {
        currentKey = null;
        isList = false;
        data[key] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  });

  return { data, content: bodyContent };
}

/**
 * Estimate reading time in minutes
 * 
 * [주의 / 임의 수정 금지]
 * OS별 줄바꿈(CRLF vs LF) 차이로 인해 Windows 환경에서 \r 문자가 글자 수에 가산되어
 * 리딩 타임이 부풀려지는 것을 방지하기 위해 계산용 clean 문자열에서 \r을 사전 제거합니다.
 * 이는 순수 리딩 타임 계산용 로컬 변수(clean)에만 적용되며 원본 본문 텍스트에는 영향을 주지 않습니다.
 */
function estimateReadingTime(text) {
  const clean = text.replace(/\r/g, '').replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '').trim();
  const charCount = clean.length;
  return Math.max(1, Math.ceil(charCount / 400));
}

/**
 * Slugify heading text for anchors
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s\uAC00-\uD7A3\u3131-\u318E-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

/**
 * Custom Markdown to HTML Compiler with TOC extraction
 */
function isCommandHeading(text) {
  const t = String(text || '').replace(/`/g, '').replace(/<[^>]+>/g, '').trim();
  return /^(mov|add|inc|cmp|jmp|jne(\s*\/.*)?|라벨|nop)\b/i.test(t);
}

function stripTocLabel(text) {
  return String(text || '').replace(/<[^>]+>/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();
}

function isGenericLang(lang) {
  const l = (lang || '').toLowerCase().trim();
  return !l || l === 'text' || l === 'ascii' || l === 'txt' || l === 'plain' || l === 'code';
}

function isTrivialDiagram(text, lang) {
  if (!isGenericLang(lang)) return false;
  const lines = String(text || '').replace(/\s+$/, '').split(/\n/).filter(Boolean);
  return lines.length <= 1;
}

/**
 * CommonMark closes a fence on the first ``` line with length >= opener.
 * Nested ```bash inside ```markdown therefore breaks the outer block.
 * Promote outer fences so they are longer than any nested fence in the body.
 */
function normalizeNestedCodeFences(md) {
  const lines = String(md || '').split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(/^( {0,3})(`{3,})([^`\n]*)$/);
    if (!open) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const indent = open[1];
    const openLen = open[2].length;
    const info = open[3];
    let j = i + 1;
    while (j < lines.length) {
      const innerOpen = lines[j].match(/^( {0,3})(`{3,})([\w+-.]*)\s*$/);
      if (innerOpen && innerOpen[3]) {
        const innerLen = innerOpen[2].length;
        j++;
        while (
          j < lines.length &&
          !new RegExp(`^( {0,3})\`{${innerLen},}\\s*$`).test(lines[j])
        ) {
          j++;
        }
        if (j < lines.length) j++;
        continue;
      }
      const closer = lines[j].match(/^( {0,3})(`{3,})\s*$/);
      if (closer && closer[2].length >= openLen) break;
      j++;
    }
    const body = lines.slice(i + 1, j);
    let maxInner = 0;
    for (const line of body) {
      const m = line.match(/(`{3,})/);
      if (m) maxInner = Math.max(maxInner, m[1].length);
    }
    const need = Math.max(openLen, maxInner > 0 ? maxInner + 1 : openLen);
    const fence = '`'.repeat(need);
    out.push(`${indent}${fence}${info}`);
    out.push(...body);
    if (j < lines.length) {
      out.push(`${indent}${fence}`);
      i = j + 1;
    } else {
      i = j;
    }
  }
  return out.join('\n');
}


function renderMarked(markdown, meta = {}, ctx = {}) {
  const headings = [];
  const headingCounts = {};
  const pageTitle = stripTocLabel(meta.title || '');
  const pageSubtitle = stripTocLabel(meta.subtitle || '');
  let skippedTitle = false;
  let skippedSubtitle = false;

  // Protect raw SVG blocks from markdown parser and math regex
  const svgPlaceholders = [];
  let protectedMd = markdown.replace(/<svg[\s\S]*?<\/svg>/gi, (m) => {
    const placeholder = `%%SVG_BLOCK_${svgPlaceholders.length}%%`;
    svgPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  // Protect Math blocks from markdown parsers
  const mathPlaceholders = [];
  protectedMd = protectedMd.replace(/\$\$([\s\S]*?)\$\$/g, (m) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  protectedMd = protectedMd.replace(/\\\[([\s\S]*?)\\\]/g, (m) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  // Inline math: Pandoc/KaTeX rules
  // 1. Opening $: not preceded by backslash, not followed by whitespace
  // 2. Content: cannot contain newlines or Korean characters (two $ across Korean sentences are not LaTeX math)
  // 3. Closing $: not preceded by whitespace, not followed by digit
  protectedMd = protectedMd.replace(/(?<!\\)\$(?!\s)([^$\n\uAC00-\uD7A3]+?)(?<!\s)\$(?!\d)/g, (m) => {
    const placeholder = `%%MATH_INLINE_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  protectedMd = protectedMd.replace(/\\\((.+?)\\\)/g, (m) => {
    const placeholder = `%%MATH_INLINE_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  // CommonMark quirk: when ** closes after punctuation (like ), %, ', ", ]) and is followed by Korean syllable,
  // CommonMark treats it as non-right-flanking delimiter and refuses to parse bold.
  // We convert it directly to <strong>...</strong> so it is preserved through marked.
  protectedMd = protectedMd.replace(/\*\*([^*\n]+?[\p{P}\p{S}])\*\*([\uAC00-\uD7A3])/gu, '<strong>$1</strong>$2');

  const renderer = new marked.Renderer();

  // Custom Headings.
  // Card already renders frontmatter title as the only h1. Skip a matching
  // leading title/subtitle, then shift remaining markdown levels down one
  // so "# 1장" / "# 부록" become h2 and "4.1" sections become h3.
  renderer.heading = function({ text, depth, tokens }) {
    // Parse inline markdown (**bold**, etc.) so Clean Bold headings render as <strong>.
    const inlineHtml = tokens ? this.parser.parseInline(tokens) : text;
    const cleanText = stripTocLabel(inlineHtml);
    if (!skippedTitle && depth === 1 && pageTitle && cleanText === pageTitle) {
      skippedTitle = true;
      return '';
    }
    if (!skippedSubtitle && pageSubtitle && cleanText === pageSubtitle) {
      skippedSubtitle = true;
      return '';
    }

    const htmlDepth = depth === 1 ? 2 : depth;
    let slug = slugify(cleanText) || `section-${headings.length + 1}`;

    if (headingCounts[slug]) {
      headingCounts[slug]++;
      slug = `${slug}-${headingCounts[slug]}`;
    } else {
      headingCounts[slug] = 1;
    }

    if (htmlDepth >= 2 && htmlDepth <= 4 && !isCommandHeading(cleanText)) {
      headings.push({ text: cleanText, depth: htmlDepth, id: slug });
    }

    return `<h${htmlDepth} id="${slug}"><a href="#${slug}" class="heading-anchor" aria-hidden="true">#</a> ${inlineHtml}</h${htmlDepth}>`;
  };

  // Custom Code blocks
  renderer.code = function({ text, lang }) {
    if ((lang || '').trim().toLowerCase() === 'mermaid') {
      if (ctx) ctx.hasMermaid = true;
      const escapedMath = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre class="mermaid">${escapedMath}</pre>`;
    }
    const generic = isGenericLang(lang);
    const ascii = generic && /[┌┐└┘│─├┤┬┴┼]/.test(text);
    const displayLang = ascii ? '도식' : (generic ? '평문' : lang);
    const langClass = generic ? 'code-lang lang-generic' : 'code-lang';
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const copyBtn = isTrivialDiagram(text, lang)
      ? ''
      : '<button class="copy-btn" type="button" aria-label="코드 복사">복사</button>';
    const header = generic && !copyBtn
      ? ''
      : `
  <div class="code-header">
    <span class="${langClass}">${displayLang}</span>
    ${copyBtn}
  </div>`;
    const codeClass = generic ? 'language-text' : `language-${lang}`;
    const wrapperClass = ascii ? 'code-block-wrapper ascii-diagram' : 'code-block-wrapper';
    return `
<div class="${wrapperClass}">${header}
  <pre><code class="${codeClass}">${escaped}</code></pre>
</div>`;
  };

  // Custom Table
  renderer.table = function(token) {
    const originalTable = marked.Renderer.prototype.table.call(this, token);
    return `<div class="table-wrapper" data-scroll-hint="좌우로 스크롤하여 확인" tabindex="0" role="region" aria-label="데이터 표">${originalTable}</div>`;
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: false
  });

  // GFM strikethrough: strictly require double tildes (~~...~~).
  // Single tilde (~) is standard Korean notation for numeric/date ranges (e.g. 10~20, 48~60셀).
  const strictDoubleTildeDel = /^(~~)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/;
  if (marked.Lexer?.rules?.inline) {
    for (const mode of Object.keys(marked.Lexer.rules.inline)) {
      if (marked.Lexer.rules.inline[mode]?.del) {
        marked.Lexer.rules.inline[mode].del = strictDoubleTildeDel;
      }
    }
  }

  protectedMd = normalizeNestedCodeFences(protectedMd);
  let html = marked.parse(protectedMd);

  // Restore Math blocks
  mathPlaceholders.forEach(({ placeholder, original }) => {
    html = html.replace(placeholder, () => original);
  });

  // Restore SVG blocks
  svgPlaceholders.forEach(({ placeholder, original }) => {
    html = html.replace(placeholder, () => original);
  });

  return { html, headings };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeAttr(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function pushSlot(slots, text) {
  const token = `OBSLOT${slots.length}ENDOBSLOT`;
  slots.push(text);
  return token;
}

function unmask(text, slots) {
  return String(text).replace(/OBSLOT(\d+)ENDOBSLOT/g, (_, n) => slots[Number(n)] ?? '');
}

function maskAll(md, slots) {
  const lines = normalizeNestedCodeFences(md).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^( {0,3})(`{3,})([^`]*)$/);
    if (!open) {
      out.push(lines[i]);
      continue;
    }
    const len = open[2].length;
    let j = i + 1;
    while (j < lines.length && !new RegExp(`^ {0,3}\`{${len},}\\s*$`).test(lines[j])) j++;
    const end = Math.min(j + (j < lines.length ? 1 : 0), lines.length);
    out.push(pushSlot(slots, lines.slice(i, end).join('\n')));
    i = j;
  }
  let text = out.join('\n');
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, (m) => pushSlot(slots, m));
  text = text.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g, (m) => pushSlot(slots, m));
  text = text.replace(/(?<!\\)\$(?!\s)([^$\n\uAC00-\uD7A3]+?)(?<!\s)\$(?!\d)/g, (m) => pushSlot(slots, m));
  text = text.replace(/\\\((.+?)\\\)/g, (m) => pushSlot(slots, m));
  text = text.replace(/``[^`]*``|`[^`\n]+`/g, (m) => pushSlot(slots, m));
  return text;
}

function stripObsidianComments(md) {
  return md.replace(/%%[\s\S]*?%%/g, '');
}

function normKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\.md$/i, '').replace(/\s+/g, ' ');
}

function makeCatalog(records) {
  const map = new Map();
  function add(key, rec) {
    const n = normKey(key);
    if (!n || map.has(n)) return;
    map.set(n, rec);
  }
  for (const rec of records) {
    add(rec.title, rec);
    add(rec.slug, rec);
    add(rec.fileStem, rec);
    add(String(rec.fileStem || '').replace(/-/g, ' '), rec);
  }
  return {
    lookup(name) {
      const n = normKey(name);
      if (!n) return null;
      return map.get(n)
        || map.get(n.replace(/[-_]/g, ' ').replace(/\s+/g, ' '))
        || map.get(n.replace(/ /g, '-'))
        || null;
    }
  };
}

function relUrl(fromPublic, toPublic) {
  const fromParts = String(fromPublic || '').split('/');
  fromParts.pop();
  const toParts = String(toPublic || '').split('/');
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  return fromParts.map(() => '..').concat(toParts).join('/');
}

function safeExistingFile(root, rel) {
  const cleaned = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..')) return null;
  const full = path.resolve(root, cleaned);
  const base = path.resolve(root);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  return fs.existsSync(full) && fs.statSync(full).isFile() ? full : null;
}

function findImage(rel) {
  const roots = [
    [path.join(SOURCES_DIR, 'attachments'), 'sources/attachments'],
    [path.join(__dirname, 'assets'), 'assets'],
    [SOURCES_DIR, 'sources']
  ];
  for (const [root, urlBase] of roots) {
    if (safeExistingFile(root, rel)) {
      return `${urlBase}/${String(rel).replace(/\\/g, '/')}`;
    }
  }
  return null;
}

function parseWikiInner(inner) {
  let main = inner;
  let alias = null;
  const pipe = inner.indexOf('|');
  if (pipe !== -1) {
    alias = inner.slice(pipe + 1).trim();
    main = inner.slice(0, pipe);
  }
  const hash = main.indexOf('#');
  if (hash === -1) return { target: main.trim(), sub: null, alias };
  return { target: main.slice(0, hash).trim(), sub: main.slice(hash + 1).trim(), alias };
}

function wikiHasWord(value) {
  return /[A-Za-z\uAC00-\uD7A3]/.test(value || '');
}

function inlineTitle(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

const CALLOUTS = {
  note: ['info', '노트'],
  info: ['info', '정보'],
  abstract: ['info', '요약'],
  summary: ['info', '요약'],
  tldr: ['info', '요약'],
  question: ['info', '질문'],
  help: ['info', '질문'],
  faq: ['info', '질문'],
  example: ['info', '예시'],
  todo: ['info', '할 일'],
  tip: ['tip', '팁'],
  hint: ['tip', '팁'],
  important: ['tip', '팁'],
  success: ['tip', '성공'],
  check: ['tip', '성공'],
  done: ['tip', '성공'],
  warning: ['warning', '주의'],
  caution: ['warning', '주의'],
  attention: ['warning', '주의'],
  bug: ['warning', '버그'],
  danger: ['danger', '위험'],
  error: ['danger', '위험'],
  failure: ['danger', '실패'],
  fail: ['danger', '실패'],
  missing: ['danger', '실패'],
  quote: ['quote', '인용'],
  cite: ['quote', '인용']
};

function calloutSpec(type) {
  return CALLOUTS[String(type || '').toLowerCase()] || CALLOUTS.note;
}

function stripQuotes(line, depth) {
  let rest = line;
  for (let i = 0; i < depth; i++) rest = rest.replace(/^> ?/, '');
  return rest;
}

function footnoteRef(num, primary) {
  const id = primary ? ` id="fnref-${num}"` : '';
  return `<a class="footnote-ref" href="#fn-${num}"${id}>${num}</a>`;
}

function pushNote(ctx, md) {
  const num = ctx.notes.length + 1;
  ctx.notes.push({ num, md });
  return num;
}

function renderFootnotes(notes) {
  if (!notes || !notes.length) return '';
  const items = notes.map((note) => {
    const body = note.md.includes('\n') ? marked.parse(note.md) : marked.parseInline(note.md);
    return `<li id="fn-${note.num}">${body}<a class="backlink" href="#fnref-${note.num}" aria-label="본문으로">↩</a></li>`;
  }).join('\n');
  return `<section class="footnotes-section"><h3>각주</h3><ol class="footnotes-list">${items}</ol></section>`;
}

function extractSection(md, headingText) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  const target = slugify(headingText);
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!h) continue;
    if (start < 0 && slugify(h[2]) === target) {
      start = i;
      level = h[1].length;
      continue;
    }
    if (start >= 0 && h[1].length <= level) return lines.slice(start, i).join('\n');
  }
  return start >= 0 ? lines.slice(start).join('\n') : null;
}

function wikiHref(rec, sub, ctx) {
  const base = rec ? relUrl(ctx.fromUrl, rec.publicUrl) : '';
  if (!sub) return base;
  if (sub.startsWith('^')) return `${base}#ob-${encodeURIComponent(sub.slice(1))}`;
  const hash = slugify(sub);
  return `${base}#${hash}`;
}

function missingWiki(label) {
  return `<span class="wikilink-missing">${escapeHtml(label)}</span>`;
}

function expandEmbed(inner, ctx, meta) {
  const parsed = parseWikiInner(inner);
  const label = parsed.alias || parsed.target || parsed.sub || inner;
  if (!wikiHasWord(parsed.target) && !wikiHasWord(parsed.sub || '')) return `![[${inner}]]`;
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(parsed.target)) {
    const urlBase = findImage(parsed.target);
    if (!urlBase) return `<span class="embed-missing">임베드 없음: ${escapeHtml(parsed.target)}</span>`;
    const width = parsed.alias && /^\d+$/.test(parsed.alias) ? parsed.alias : '';
    const alt = width ? parsed.target : (parsed.alias || parsed.target);
    const style = width ? ` style="max-width:${Number(width)}px"` : '';
    const src = `${ctx.rootPrefix || '../'}${urlBase}`;
    return `<img class="embed-image" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${style}>`;
  }
  const rec = ctx.catalog ? ctx.catalog.lookup(parsed.target) : null;
  if (!rec) return `<span class="embed-missing">임베드 없음: ${escapeHtml(label)}</span>`;
  const href = wikiHref(rec, parsed.sub, ctx);
  if (!parsed.sub || parsed.sub.startsWith('^') || (ctx.embedDepth || 0) >= 1) {
    return `<p class="note-embed"><a href="${escapeAttr(href)}">${escapeHtml(parsed.alias || rec.title)}</a></p>`;
  }
  const section = extractSection(rec.body, parsed.sub);
  if (section == null) return `<span class="embed-missing">임베드 없음: ${escapeHtml(parsed.target + '#' + parsed.sub)}</span>`;
  const child = compileMarkdown(section, { title: rec.title, subtitle: '' }, {
    ...ctx,
    nestedChrome: true,
    embedDepth: (ctx.embedDepth || 0) + 1
  });
  return `<aside class="note-embed"><p class="embed-source"><a href="${escapeAttr(href)}">${escapeHtml(rec.title)}</a></p>${child.html}</aside>`;
}

function applyWikilink(inner, ctx) {
  const parsed = parseWikiInner(inner);
  if (!wikiHasWord(parsed.target) && !wikiHasWord(parsed.sub || '')) return `[[${inner}]]`;
  const label = parsed.alias || parsed.target || parsed.sub;
  if (!parsed.target) {
    const hash = parsed.sub && parsed.sub.startsWith('^')
      ? `#ob-${encodeURIComponent(parsed.sub.slice(1))}`
      : `#${slugify(parsed.sub || '')}`;
    return `<a href="${escapeAttr(hash)}">${escapeHtml(label)}</a>`;
  }
  const rec = ctx.catalog ? ctx.catalog.lookup(parsed.target) : null;
  if (!rec) return missingWiki(label);
  return `<a href="${escapeAttr(wikiHref(rec, parsed.sub, ctx))}">${escapeHtml(label)}</a>`;
}

function applyHighlights(md) {
  return md.replace(/==([^=\n]+?)==/g, (_, inner) => {
    return `<mark class="md-highlight">${marked.parseInline(inner)}</mark>`;
  });
}

function applyBlockIds(md) {
  const lines = md.split('\n');
  const out = [];
  for (const line of lines) {
    const only = line.match(/^\^([A-Za-z][\w-]*)\s*$/);
    if (only && out.length) {
      out[out.length - 1] += `<span id="ob-${only[1]}" class="block-id"></span>`;
      continue;
    }
    const trail = line.match(/^(.*\S)[ \t]+\^([A-Za-z][\w-]*)\s*$/);
    if (trail && !/^\s*>/.test(trail[1])) {
      out.push(`${trail[1]}<span id="ob-${trail[2]}" class="block-id"></span>`);
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

function transformCallouts(md, ctx, slots, meta) {
  if ((ctx.calloutDepth || 0) > 8) return md;
  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^((?:> *)+)\[!([A-Za-z]+)\]([+-])?[ \t]*([^\n]*)$/);
    if (!open) {
      out.push(lines[i]);
      continue;
    }
    const depth = (open[1].match(/>/g) || []).length;
    const fold = open[3] || '';
    let custom = (open[4] || '').trim();
    const bodyLines = [];
    i++;
    while (i < lines.length) {
      if (lines[i].trim() === '') break;
      const quotes = (lines[i].match(/^(?:> *)*/) || [''])[0];
      const quoteCount = (quotes.match(/>/g) || []).length;
      if (quoteCount < depth) break;
      bodyLines.push(stripQuotes(lines[i], depth));
      i++;
    }
    i--;
    let body = bodyLines.join('\n');
    let title = custom;
    if (!title) {
      const peeled = body.match(/^\*\*([^*]+)\*\*[ \t]*(?:\n|$)/);
      if (peeled) {
        title = peeled[1].trim();
        body = body.slice(peeled[0].length);
      }
    }
    const spec = calloutSpec(open[2]);
    const titleHtml = inlineTitle(title || spec[1]);
    const inner = compileMarkdown(unmask(body, slots), meta, {
      ...ctx,
      nestedChrome: true,
      calloutDepth: (ctx.calloutDepth || 0) + 1
    });
    const cls = spec[0];
    out.push('');
    if (fold) {
      const opened = fold === '+' ? ' open' : '';
      out.push(`<details class="callout-box ${cls}"${opened}><summary class="callout-title">${titleHtml}</summary><div class="callout-body">${inner.html}</div></details>`);
    } else {
      out.push(`<div class="callout-box ${cls}"><div class="callout-title">${titleHtml}</div><div class="callout-body">${inner.html}</div></div>`);
    }
    out.push('');
  }
  return out.join('\n');
}

function processSegment(masked, ctx, slots, meta) {
  const defs = new Map();
  let text = masked.replace(/^\[\^([^\]\n]+)\]:[ \t]*([^\n]*)(?:\n((?:[ \t]+[^\n]*(?:\n|$))*))?/gm, (_, id, first, rest) => {
    defs.set(id, unmask([first, rest || ''].join('\n').trim(), slots));
    return '';
  });
  if (!ctx.seenNotes) ctx.seenNotes = new Map();
  text = text.replace(/!\[\[([^\]]+)\]\]|\^\[([^\]\n]+)\]|\[\^([^\]\n]+)\]/g, (full, embed, inline, named) => {
    if (embed) {
      if ((ctx.embedDepth || 0) >= 1) return applyWikilink(embed, ctx);
      return expandEmbed(embed, ctx, meta);
    }
    if (inline) return footnoteRef(pushNote(ctx, unmask(inline, slots)), true);
    if (!defs.has(named)) return full;
    if (ctx.seenNotes.has(named)) return footnoteRef(ctx.seenNotes.get(named), false);
    const num = pushNote(ctx, defs.get(named));
    ctx.seenNotes.set(named, num);
    return footnoteRef(num, true);
  });
  text = applyHighlights(text);
  text = text.replace(/(?<!!)\[\[([^\]]+)\]\]/g, (full, inner) => applyWikilink(inner, ctx));
  text = applyBlockIds(text);
  text = transformCallouts(text, ctx, slots, meta);
  return text;
}

function canvasClass(svg) {
  const open = svg.match(/^<svg\b[^>]*>/i);
  const style = open && open[0].match(/style="([^"]*)"/i);
  const bg = style && style[1].match(/background(?:-color)?:\s*([^;]+)/i);
  const picked = bg ? bg[1] : firstCanvasFill(svg);
  return classifyCanvas(picked);
}

function firstCanvasFill(svg) {
  const vb = svg.match(/viewBox="\s*[\d.\-]+\s+[\d.\-]+\s+([\d.]+)/i);
  const viewW = vb ? Number(vb[1]) : 0;
  const rects = svg.match(/<rect\b[^>]*>/gi) || [];
  for (const rect of rects.slice(0, 6)) {
    const fill = rect.match(/\bfill="([^"]+)"/i);
    if (!fill) continue;
    const width = rect.match(/\bwidth="([\d.]+)"/i);
    if (viewW && width && Number(width[1]) < viewW * 0.6) continue;
    return fill[1];
  }
  return '';
}

function classifyCanvas(raw) {
  const color = String(raw || '').trim().toLowerCase();
  if (!color || color.startsWith('var(')) return 'diagram-adaptive';
  let hex = color.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
  hex = hex.slice(0, 6);
  if (['ffffff', 'f8fafc', 'f1f5f9', 'f9fafb', 'fafafa'].includes(hex)) return 'diagram-light';
  if (['0f172a', '020617', '1e293b', '0b0f19', '111827', '131b2e', '0d1117'].includes(hex)) return 'diagram-dark';
  return 'diagram-adaptive';
}

function figureFor(svg) {
  const labelMatch = svg.match(/\baria-label="([^"]*)"/i);
  const vb = svg.match(/viewBox="\s*[\d.\-]+\s+[\d.\-]+\s+([\d.]+)/i);
  const width = vb ? Math.max(1, Math.round(Number(vb[1]))) : 720;
  const caption = labelMatch
    ? `<figcaption>${escapeHtml(decodeAttr(labelMatch[1]))}</figcaption>`
    : '';
  return `<figure class="diagram diagram-scroll ${canvasClass(svg)}" style="--diagram-w:${width}px" data-scroll-hint="좌우로 밀어서 그림 전체 보기">${svg}${caption}</figure>`;
}

function wrapDiagrams(html) {
  const unwrapped = html.replace(/<p>(\s*<svg\b[\s\S]*?<\/svg>\s*)<\/p>/gi, '$1');
  return unwrapped.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svg, offset, whole) => {
    const before = whole.slice(Math.max(0, offset - 140), offset);
    if (/class="[^"]*\bdiagram\b[^"]*"[^>]*>\s*$/.test(before)) return svg;
    return figureFor(svg);
  });
}

function compileMarkdown(markdown, meta = {}, ctx = {}) {
  if (!ctx.notes) ctx.notes = [];
  if (!ctx.seenNotes) ctx.seenNotes = new Map();
  const slots = [];
  const masked = stripObsidianComments(maskAll(String(markdown || '').replace(/\r\n/g, '\n'), slots));
  const transformed = processSegment(masked, ctx, slots, meta);
  const rendered = renderMarked(unmask(transformed, slots), meta, ctx);
  if (ctx.nestedChrome) return rendered;
  return {
    html: wrapDiagrams(rendered.html) + renderFootnotes(ctx.notes),
    headings: rendered.headings
  };
}

function assertObsidianFixtures() {
  const catalog = makeCatalog([{
    title: '있는 글',
    slug: 'exists',
    fileStem: '있는-글',
    publicUrl: 'articles/exists.html',
    body: '## 포함된 제목\n\n본문 단락.\n\n## 다음\n\n뒤.\n'
  }]);
  const ctx = {
    catalog,
    fromUrl: 'articles/self.html',
    rootPrefix: '../',
    notes: [],
    seenNotes: new Map(),
    hasMermaid: false,
    embedDepth: 0
  };
  const md = [
    '> [!NOTE] 직접 제목',
    '> 본문 ==강조== %%숨김%%',
    '',
    '> [!warning]-',
    '> **굵은 제목**',
    '> 접힘',
    '',
    '각주[^a]와 인라인^[옆].',
    '',
    '[^a]: 정의 **굵게**',
    '',
    '[[있는 글|별칭]]과 [[3]]과 `[[3]]`',
    '',
    '![[있는 글#포함된 제목]]',
    '',
    '![[없는그림.png]]',
    '',
    '```',
    '%%keep%%',
    '```',
    '',
    '```mermaid',
    'graph TD; A-->B',
    '```',
    '',
    '- [ ] 할 일',
    '- [x] 끝'
  ].join('\n');
  const { html } = compileMarkdown(md, { title: '픽스처', subtitle: '' }, ctx);
  const checks = [
    ['callout title', html.includes('직접 제목') && html.includes('callout-box info')],
    ['folded callout', html.includes('<details') && html.includes('굵은 제목') && !html.includes('**굵은 제목**') && !html.includes('[!warning]') && !html.includes('[!NOTE]')],
    ['highlight', html.includes('class="md-highlight"') && html.includes('강조')],
    ['comment removed', !html.includes('숨김')],
    ['comment in code', html.includes('%%keep%%')],
    ['footnote', html.includes('footnote-ref') && html.includes('footnotes-section') && html.includes('굵게')],
    ['wikilink', html.includes('별칭') && html.includes('exists.html')],
    ['literal brackets', html.includes('[[3]]')],
    ['embed section', html.includes('note-embed') && html.includes('본문 단락')],
    ['missing embed', html.includes('임베드 없음: 없는그림.png')],
    ['mermaid', html.includes('class="mermaid"') && ctx.hasMermaid === true],
    ['task', html.includes('type="checkbox"')]
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) {
    throw new Error(`Obsidian fixture failed: ${failed.join(', ')}\n${html.slice(0, 2500)}`);
  }
}

/**
 * Generate TOC HTML
 */
function renderTOC(headings) {
  if (!headings || headings.length === 0) {
    return '<p style="color: var(--text-muted); font-size: 14px;">목차가 없습니다.</p>';
  }

  let html = '<ul class="toc-list">';
  headings.forEach(h => {
    const badgeLabel = h.depth === 2 ? '대주제' : (h.depth === 3 ? '중주제' : '소주제');
    html += `<li class="depth-${h.depth}"><a href="#${h.id}" class="toc-link"><span class="toc-badge badge-h${h.depth}">${badgeLabel}</span><span class="toc-text">${stripTocLabel(h.text)}</span></a></li>`;
  });
  html += '</ul>';
  return html;
}

/**
 * Simple Mustache-like interpolation helper
 */
function interpolate(template, data) {
  let result = template;

  // Conditional blocks {{#key}}...{{/key}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, inner) => {
    const val = data[key];
    if (Array.isArray(val)) {
      if (val.length === 0) return '';
      return val.map(item => {
        if (typeof item === 'object') {
          return interpolate(inner, item);
        }
        return inner.replace(/\{\{\.\}\}/g, item);
      }).join('');
    }
    if (val) {
      return inner.replace(/\{\{\.\}\}/g, val).replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    }
    return '';
  });

  // Simple tags {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : '';
  });

  return result;
}

async function build() {
  console.log('🚀 Starting Pages Build...');

  if (!fs.existsSync(SOURCES_DIR)) {
    console.error('❌ Sources directory does not exist:', SOURCES_DIR);
    return;
  }

  function collectMarkdownJobs() {
    const jobs = [];
    const rootFiles = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));
    for (const file of rootFiles) {
      jobs.push({ file, relDir: '', preview: false });
    }
    const previewDir = path.join(SOURCES_DIR, 'preview');
    if (fs.existsSync(previewDir) && fs.statSync(previewDir).isDirectory()) {
      const previewFiles = fs.readdirSync(previewDir).filter(f => f.endsWith('.md'));
      for (const file of previewFiles) {
        jobs.push({ file, relDir: 'preview', preview: true });
      }
    }
    return jobs;
  }

  function truthyFrontmatter(val) {
    if (val === true) return true;
    const s = String(val ?? '').trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === '1';
  }

  assertObsidianFixtures();
  console.log('  ✓ Obsidian fixture');

  const jobs = collectMarkdownJobs();
  const loaded = [];
  const articles = [];

  for (const job of jobs) {
    const filePath = job.relDir
      ? path.join(SOURCES_DIR, job.relDir, job.file)
      : path.join(SOURCES_DIR, job.file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.startsWith('---')) {
      console.warn('  ! Skipped non-article (no frontmatter):', job.file);
      continue;
    }
    const { data, content } = parseFrontMatter(raw);

    // Fallbacks
    const stats = fs.statSync(filePath);
    const fallbackDate = stats.mtime.toISOString().split('T')[0];
    const firstH1Match = content.match(/^#\s+(.+)$/m);
    const defaultTitle = firstH1Match ? firstH1Match[1].trim() : path.basename(job.file, '.md');

    const firstParagraphMatch = content.replace(/^#+.*$/gm, '').replace(/```[\s\S]*?```/g, '').trim().match(/^([^\n]+)/);
    const defaultSummary = firstParagraphMatch ? firstParagraphMatch[1].slice(0, 140) + '...' : '문서 내용 미리보기';

    const slug = data.slug || path.basename(job.file, '.md').replace(/\s+/g, '_');
    const title = data.title || defaultTitle;
    const subtitle = data.subtitle || '';
    const date = data.date || fallbackDate;
    const author = data.author || '';
    const summary = data.summary || defaultSummary;
    const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
    const unlisted = job.preview || truthyFrontmatter(data.unlisted) || truthyFrontmatter(data.draft);
    const isPreview = job.preview;
    const outSubdir = isPreview ? 'preview' : 'articles';
    const publicUrl = `${outSubdir}/${slug}.html`;
    const fileStem = path.basename(job.file, '.md');
    const archive_url = data.archive_url || '';
    const source_url = data.source_url || '';
    loaded.push({
      content, title, subtitle, date, author, summary, tags, unlisted, isPreview,
      publicUrl, slug, fileStem, outSubdir, archive_url, source_url
    });
  }

  const catalog = makeCatalog(loaded);

  for (const item of loaded) {
    const {
      content, title, subtitle, date, author, summary, tags, unlisted, isPreview,
      publicUrl, outSubdir, archive_url, source_url
    } = item;
    const readingTime = estimateReadingTime(content);
    const ctx = {
      catalog,
      fromUrl: publicUrl,
      rootPrefix: '../',
      notes: [],
      seenNotes: new Map(),
      hasMermaid: false,
      embedDepth: 0
    };
    const { html: contentHtml, headings } = compileMarkdown(content, { title, subtitle }, ctx);
    const tocHtml = renderTOC(headings);

    const outDir = path.join(OUTPUT_DIR, outSubdir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFileName = path.posix.basename(publicUrl);
    const outFilePath = path.join(outDir, outFileName);
    const homeUrl = '../index.html';
    const rootPath = '../';
    const robotsMeta = unlisted
      ? '<meta name="robots" content="noindex, nofollow">'
      : '';

    const articleHtml = interpolate(articleTemplate, {
      title,
      subtitle,
      date,
      author,
      summary,
      tags,
      reading_time: readingTime,
      toc_html: tocHtml,
      content: contentHtml,
      home_url: homeUrl,
      root_path: rootPath,
      robots_meta: robotsMeta,
      mermaid: ctx.hasMermaid,
      archive_url,
      source_url
    });

    fs.writeFileSync(outFilePath, articleHtml, 'utf-8');
    const label = unlisted ? (isPreview ? 'preview' : 'unlisted') : 'article';
    console.log(`  ✓ Rendered ${label}: ${publicUrl} (${title})`);

    if (!unlisted) {
      articles.push({
        title,
        subtitle,
        date,
        summary,
        tags,
        tag_string: tags.join(' '),
        reading_time: readingTime,
        url: publicUrl,
        archive_url,
        _timestamp: new Date(date).getTime() || 0
      });
    }
  }

  // Include special rich legacy / standalone articles (e.g., cpu_dram_memory_interface.html, python deep-dives)
  const legacyArticles = [
    {
      title: "예측하는 기계는 왜 압축하는 기계인가",
      subtitle: "섀넌의 엔트로피에서 산술 부호화, 솔로모노프와 후터를 거쳐 두 편의 LLM 압축 논문까지",
      date: "2026-10-22",
      summary: "다음 기호를 잘 예측하는 모델은 곧 좋은 압축기라는 생각을 따라, 섀넌의 엔트로피와 허프만·산술 부호화, 솔로모노프와 후터의 이론을 거쳐 언어 모델을 압축기로 쓰는 두 편의 LLM 압축 논문까지 살피고, 압축률이 지능을 얼마나 비추는지 정리합니다.",
      tags: ["AI", "언어모델", "정보이론", "압축", "논문리뷰"],
      tag_string: "AI 언어모델 정보이론 압축 논문리뷰",
      reading_time: 44,
      url: "articles/language_modeling_compression_intelligence.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-22-언어모델압축.html",
      _timestamp: new Date("2026-10-22T13:15:00Z").getTime()
    },
    {
      title: "유전자는 설계도가 아니다, 데니스 노블이 다시 묻는 생명의 인과",
      subtitle: "스스로 뛰는 심장 모델에서 중심 원리, 이기적 유전자, 생물학적 상대성, 다유전자 점수, 행위자성까지",
      date: "2026-10-22",
      summary: "스스로 뛰는 심장 세포 모델을 만든 생리학자 데니스 노블의 주장을 따라, 크릭의 중심 원리와 그 위에 덧쌓인 '유전자 설계도' 해석, 세포에 기대는 DNA 복제, 이기적 유전자 논쟁, 특권적 인과 층위가 없다는 생물학적 상대성을 살피고, 그의 말 가운데 단단한 대목과 과장된 대목을 갈라 읽습니다.",
      tags: ["생물학", "시스템생물학", "과학철학", "데니스노블", "해설"],
      tag_string: "생물학 시스템생물학 과학철학 데니스노블 해설",
      reading_time: 30,
      url: "articles/noble_genes_not_blueprint.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-22-데니스노블.html",
      _timestamp: new Date("2026-10-22T08:20:00Z").getTime()
    },
    {
      title: "만들었다고 이해한 것은 아니다, 언어 모델의 속을 들여다보는 일",
      subtitle: "앤트로픽 해석가능성 연구자 엠마뉴엘 아메이젠이 말하는 개념, 계획, 정렬, 그리고 의인화",
      date: "2026-10-18",
      summary: "언어 모델은 짜인 것이 아니라 자라난 것이라 만든 사람도 그 속을 모릅니다. 앤트로픽 해석가능성 연구자 엠마뉴엘 아메이젠의 Lenny's Podcast 이야기를 따라, 형식과 언어를 가리지 않는 개념 표상, 말하지 않는 계획, 도약처럼 보이는 성능 향상, 감시받을 때만 착한 모델이라는 걱정, 의인화의 쓸모를 정리합니다.",
      tags: ["AI", "해석가능성", "언어모델", "AI안전", "인터뷰"],
      tag_string: "AI 해석가능성 언어모델 AI안전 인터뷰",
      reading_time: 41,
      url: "articles/inside_the_black_box_how_llms_think.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-19-언어모델_블랙박스.html",
      _timestamp: new Date("2026-10-18T14:20:00Z").getTime()
    },
    {
      title: "코딩 에이전트 직접 만들기, 300줄 루프를 6단계로 따라가기",
      subtitle: "Geoffrey Huntley의 무료 워크숍 「how to build a coding agent」와 Go 실습 저장소 심층 학습",
      date: "2026-10-16",
      summary: "코딩 에이전트는 LLM 토큰과 함께 루프를 도는 300줄 코드라는 Geoffrey Huntley의 워크숍을 따라, 대화 루프에 read_file, list_files, bash, edit_file, code_search 도구를 하나씩 붙여 가는 6단계를 실제 Go 코드로 읽습니다.",
      tags: ["AI", "컴퓨터과학", "에이전트", "Go", "튜토리얼"],
      tag_string: "AI 컴퓨터과학 에이전트 Go 튜토리얼",
      reading_time: 35,
      url: "articles/build_a_coding_agent_workshop.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-16-코딩에이전트_워크숍.html",
      _timestamp: new Date("2026-10-15T19:50:00Z").getTime()
    },
    {
      title: "영한 대조 심화 학습서, nobody should type code by hand anymore",
      subtitle: "Geoffrey Huntley의 글을 영·한 병렬 대조와 25개 심화 주석으로 읽기",
      date: "2026-10-15",
      summary: "Josh Wulf와의 4부작 대담을 정리한 Geoffrey Huntley의 글을 96개 영·한 대조 블록으로 읽고, 인간 엔지니어에게 남은 비전·결정론적 검증·주체성을 25개 심화 주석과 챕터, 자가 점검으로 짚습니다.",
      tags: ["AI", "에이전트", "소프트웨어공학", "제프리헌틀리", "튜토리얼"],
      tag_string: "AI 에이전트 소프트웨어공학 제프리헌틀리 튜토리얼",
      reading_time: 50,
      url: "articles/huntley_nobody_should_type_code_by_hand.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-15-헌틀리_손코딩.html",
      _timestamp: new Date("2026-10-15T13:00:00Z").getTime()
    },
    {
      title: "가비지 컬렉션 심화분석, 수동 관리에서 마크 앤 스윕까지",
      subtitle: "Computerphile의 Laurence Tratt 강의와 슬라이드로 읽는 자동 메모리 관리의 논리",
      date: "2026-10-15",
      summary: "malloc과 free의 세 가지 오류에서 참조 횟수 계산의 한계, 마크 앤 스윕의 도달 가능성 발상, 그리고 GC가 있어도 누수가 생기는 이유까지 짚습니다.",
      tags: ["컴퓨터과학", "가비지컬렉션", "메모리모델", "프로그래밍언어", "해설"],
      tag_string: "컴퓨터과학 가비지컬렉션 메모리모델 프로그래밍언어 해설",
      reading_time: 20,
      url: "articles/garbage_collection_mark_and_sweep.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-15-가비지컬렉션_마크앤스윕.html",
      _timestamp: new Date("2026-10-15T12:00:00Z").getTime()
    },
    {
      title: "디지털 장인정신, AI 시대에 의도·품질·예술성을 키우는 법",
      subtitle: "Katie Dill(Stripe) 강연 'How to scale intent, quality, and artistry with AI' 정리",
      date: "2026-10-13",
      summary: "좀비 건물에서 좀비 UI까지, AI 시대에 제품의 의도와 품질, 예술성을 지키는 함정과 해독제를 Stripe 디자인 리더 Katie Dill의 강연으로 정리합니다.",
      tags: ["AI", "디자인", "소프트웨어공학", "강연"],
      tag_string: "AI 디자인 소프트웨어공학 강연",
      reading_time: 20,
      url: "articles/digital_craftsmanship_ai_era.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-10-13-디지털장인정신.html",
      _timestamp: new Date("2026-10-13T12:00:00Z").getTime()
    },
    {
      title: "[1부] 파이썬 객체 생성과 바인딩의 기계적 실체",
      subtitle: "클래스 정의부터 tp_new, Bound Method 동적 생성, 7가지 임시 객체까지",
      date: "2026-09-15",
      summary: "클래스 정의부터 tp_new, Bound Method(PyMethodObject) 동적 생성(m1 is m2 -> False), 7가지 숨은 임시 객체까지 CPython 힙 메모리와 디스크립터 프로토콜의 기계적 원리를 완전 해부합니다.",
      tags: ["컴퓨터과학", "Python", "CPython", "메모리모델", "해설"],
      tag_string: "컴퓨터과학 Python CPython 메모리모델 해설",
      reading_time: 18,
      url: "articles/python_object_creation_and_binding.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-09-15-CPython1부_객체바인딩.html",
      _timestamp: new Date("2026-09-15T12:00:00Z").getTime()
    },
    {
      title: "[2부] 파이썬 호출 가능 객체(Callable)와 CPython 실행 엔진",
      subtitle: "obj(1, 2) 바이트코드 CALL부터 tp_call, vectorcall, 그리고 순환 메모리 구조까지",
      date: "2026-09-15",
      summary: "obj(1, 2) 바이트코드 CALL부터 tp_call, PEP 590 vectorcall 고속 경로, 프레임 스택 평가, PyObject와 PyTypeObject의 순환 메모리 구조까지 CPython 실행 엔진을 완전 해부합니다.",
      tags: ["컴퓨터과학", "Python", "CPython", "시스템프로그래밍", "해설"],
      tag_string: "컴퓨터과학 Python CPython 시스템프로그래밍 해설",
      reading_time: 22,
      url: "articles/python_callable_and_execution_engine.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-09-15-CPython2부_실행엔진.html",
      _timestamp: new Date("2026-09-15T12:01:00Z").getTime()
    },
    {
      title: "CPU와 메모리 인터페이스 — 구조와 구현",
      subtitle: "Memory Controller, DDR PHY, DRAM 내부 구조와 데이터 흐름",
      date: "2026-09-01",
      summary: "CPU와 DDR DRAM 사이의 Memory Controller, DDR PHY, DRAM 내부 구조와 데이터 흐름을 대화형 도식과 다이어그램으로 완벽 정리한 문서입니다.",
      tags: ["컴퓨터과학", "컴퓨터구조", "메모리모델", "해설"],
      tag_string: "컴퓨터과학 컴퓨터구조 메모리모델 해설",
      reading_time: 15,
      url: "articles/cpu_dram_memory_interface.html",
      archive_url: "https://yghnsim.github.io/Archive/pages/2026-09-01-CPU_DRAM_인터페이스.html",
      _timestamp: new Date("2026-09-01").getTime()
    }
  ];


  legacyArticles.forEach(item => {
    if (!articles.find(a => a.url === item.url)) {
      articles.push(item);
    }
  });

  // Sort articles descending by date
  articles.sort((a, b) => b._timestamp - a._timestamp);

  let totalErrors = 0;
  const tagCounts = new Map();
  articles.forEach(article => {
    const { errors, warnings } = lintArticleTags(article.url, article.tags, CONTROLLED_VOCAB);
    if (warnings.length > 0) {
      warnings.forEach(w => console.warn(`  [TAG-LINT:WARN] ${article.url}: ${w}`));
    }
    if (errors.length > 0) {
      errors.forEach(e => console.error(`  [TAG-LINT:ERROR] ${article.url}: ${e}`));
      totalErrors += errors.length;
    }
    const matched = presetsFor(article.tags);
    article.preset_json = escapeAttr(JSON.stringify(matched));
    article.tag_json = escapeAttr(JSON.stringify(article.tags));
    article.title_attr = escapeAttr(article.title);
    article.summary_attr = escapeAttr(article.summary);
    if (matched.length === 0) {
      console.warn(`  ! No preset: ${article.url}`);
    }
    new Set(article.tags).forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  if (totalErrors > 0) {
    throw new Error(`태그 규칙 위반 (총 ${totalErrors}건)으로 빌드를 중단합니다.`);
  }

  const tagEntries = Array.from(tagCounts.entries()).sort((a, b) => {
    return b[1] - a[1] || a[0].localeCompare(b[0], 'ko');
  });
  const tagRow = ([name, count]) => ({
    name_html: escapeAttr(name),
    name_attr: escapeAttr(name),
    count
  });
  const frequentTags = tagEntries.filter(([, count]) => count >= 2).map(tagRow);
  const singletonTags = tagEntries.filter(([, count]) => count === 1).map(tagRow);
  const presetRows = PRESETS.map(preset => ({
    name_html: escapeAttr(preset.name),
    name_attr: escapeAttr(preset.name),
    count: articles.filter(article => presetsFor(article.tags).includes(preset.name)).length
  })).filter(preset => preset.count > 0);

  // Generate Index Page
  const indexHtml = interpolate(indexTemplate, {
    total_count: articles.length,
    presets: presetRows,
    frequent_tags: frequentTags,
    singleton_tags: singletonTags,
    singleton_count: singletonTags.length,
    articles: articles
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8');
  console.log(`  ✓ Rendered index: index.html (Total ${articles.length} articles, ${presetRows.length} presets, ${tagEntries.length} tags)`);

  console.log('🎉 Build completed successfully!');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
