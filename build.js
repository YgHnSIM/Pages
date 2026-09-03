import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCES_DIR = path.join(__dirname, 'sources');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = __dirname;

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
 */
function estimateReadingTime(text) {
  const clean = text.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '').trim();
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

function compileMarkdown(markdown, meta = {}) {
  const headings = [];
  const headingCounts = {};
  const pageTitle = stripTocLabel(meta.title || '');
  const pageSubtitle = stripTocLabel(meta.subtitle || '');
  let skippedTitle = false;
  let skippedSubtitle = false;

  // Protect Math blocks from markdown parsers
  const mathPlaceholders = [];
  let protectedMd = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (m) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  protectedMd = protectedMd.replace(/\\\[([\s\S]*?)\\\]/g, (m) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  protectedMd = protectedMd.replace(/\$([^\$\n]+?)\$/g, (m) => {
    const placeholder = `%%MATH_INLINE_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  protectedMd = protectedMd.replace(/\\\((.+?)\\\)/g, (m) => {
    const placeholder = `%%MATH_INLINE_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ placeholder, original: m });
    return placeholder;
  });

  const renderer = new marked.Renderer();

  // Custom Headings.
  // Card already renders frontmatter title as the only h1. Skip a matching
  // leading title/subtitle, then shift remaining markdown levels down one
  // so "# 1장" / "# 부록" become h2 and "4.1" sections become h3.
  renderer.heading = function({ text, depth }) {
    const cleanText = stripTocLabel(text);
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

    if (htmlDepth >= 2 && htmlDepth <= 3 && !isCommandHeading(cleanText)) {
      headings.push({ text: cleanText, depth: htmlDepth, id: slug });
    }

    return `<h${htmlDepth} id="${slug}"><a href="#${slug}" class="heading-anchor" aria-hidden="true">#</a> ${text}</h${htmlDepth}>`;
  };

  // Custom Code blocks
  renderer.code = function({ text, lang }) {
    const generic = isGenericLang(lang);
    const displayLang = generic ? '평문' : lang;
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
    return `
<div class="code-block-wrapper">${header}
  <pre><code class="${codeClass}">${escaped}</code></pre>
</div>`;
  };

  // Custom Table
  renderer.table = function(token) {
    const originalTable = marked.Renderer.prototype.table.call(this, token);
    return `<div class="table-wrapper">${originalTable}</div>`;
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: false
  });

  let html = marked.parse(protectedMd);

  // Restore Math blocks
  mathPlaceholders.forEach(({ placeholder, original }) => {
    html = html.replace(placeholder, original);
  });

  return { html, headings };
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
    html += `<li class="depth-${h.depth}"><a href="#${h.id}" class="toc-link">${stripTocLabel(h.text)}</a></li>`;
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

  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));
  const articles = [];
  const allTagsSet = new Set();

  for (const file of files) {
    const filePath = path.join(SOURCES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseFrontMatter(raw);

    // Fallbacks
    const stats = fs.statSync(filePath);
    const fallbackDate = stats.mtime.toISOString().split('T')[0];
    const firstH1Match = content.match(/^#\s+(.+)$/m);
    const defaultTitle = firstH1Match ? firstH1Match[1].trim() : path.basename(file, '.md');

    const firstParagraphMatch = content.replace(/^#+.*$/gm, '').replace(/```[\s\S]*?```/g, '').trim().match(/^([^\n]+)/);
    const defaultSummary = firstParagraphMatch ? firstParagraphMatch[1].slice(0, 140) + '...' : '문서 내용 미리보기';

    const slug = data.slug || path.basename(file, '.md').replace(/\s+/g, '_');
    const title = data.title || defaultTitle;
    const subtitle = data.subtitle || '';
    const date = data.date || fallbackDate;
    const author = data.author || '';
    const summary = data.summary || defaultSummary;
    const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
    tags.forEach(t => allTagsSet.add(t));

    const readingTime = estimateReadingTime(content);
    const { html: contentHtml, headings } = compileMarkdown(content, { title, subtitle });
    const tocHtml = renderTOC(headings);

    const outFileName = `${slug}.html`;
    const outFilePath = path.join(OUTPUT_DIR, outFileName);

    const articleHtml = interpolate(articleTemplate, {
      title,
      subtitle,
      date,
      author,
      summary,
      tags,
      reading_time: readingTime,
      toc_html: tocHtml,
      content: contentHtml
    });

    fs.writeFileSync(outFilePath, articleHtml, 'utf-8');
    console.log(`  ✓ Rendered article: ${outFileName} (${title})`);

    articles.push({
      title,
      subtitle,
      date,
      summary,
      tags,
      tag_string: tags.join(' '),
      reading_time: readingTime,
      url: outFileName,
      _timestamp: new Date(date).getTime() || 0
    });
  }

  // Include special rich legacy articles (e.g., cpu_dram_memory_interface.html)
  const legacyArticles = [
    {
      title: "CPU와 메모리 인터페이스 — 구조와 구현",
      subtitle: "Memory Controller, DDR PHY, DRAM 내부 구조와 데이터 흐름",
      date: "2026-03-01",
      summary: "CPU와 DDR DRAM 사이의 Memory Controller, DDR PHY, DRAM 내부 구조와 데이터 흐름을 대화형 도식과 다이어그램으로 완벽 정리한 문서입니다.",
      tags: ["컴퓨터 구조", "DRAM", "Memory Controller", "PHY", "다이어그램"],
      tag_string: "컴퓨터 구조 DRAM Memory Controller PHY 다이어그램",
      reading_time: 15,
      url: "cpu_dram_memory_interface.html",
      _timestamp: new Date("2026-03-01").getTime()
    }
  ];

  legacyArticles.forEach(item => {
    item.tags.forEach(t => allTagsSet.add(t));
    // If not already in list
    if (!articles.find(a => a.url === item.url)) {
      articles.push(item);
    }
  });

  // Sort articles descending by date
  articles.sort((a, b) => b._timestamp - a._timestamp);

  // Generate Index Page
  const allTags = Array.from(allTagsSet);
  const indexHtml = interpolate(indexTemplate, {
    total_count: articles.length,
    all_tags: allTags,
    articles: articles
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8');
  console.log(`  ✓ Rendered index: index.html (Total ${articles.length} articles, ${allTags.length} tags)`);

  console.log('🎉 Build completed successfully!');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
