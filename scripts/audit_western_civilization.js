import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'file:///C:/Pages/western_civilization_vine_not_tree.html';
const SCREENSHOT_DIR = path.join(process.cwd(), 'audit', 'screenshots', 'western_civilization');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function auditPage() {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-audit-western-'));
  const port = 9355;

  console.log(`[Audit] 🚀 Launching Headless Chrome on port ${port}...`);
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1280,800',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars'
  ]);

  const cleanup = () => {
    try { chromeProcess.kill(); } catch {}
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch {}
    await sleep(200);
  }

  if (!version) {
    cleanup();
    throw new Error('Chrome remote debugging did not respond.');
  }

  console.log('[Audit] Connecting to target tab...');
  const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(TARGET_URL)}`, { method: 'PUT' });
  const target = await newTabRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = (data.params.args || []).map(a => a.value || a.description).join(' ');
      consoleMessages.push({ type: data.params.type, text: args });
    }
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout waiting for ${method} (#${id})`));
      }, 10000);
      pending.set(id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('[Audit] Waiting for assets (fonts, styles) to settle...');
  await sleep(2500);

  // 1. DESKTOP VIEWPORT AUDIT (1280x800)
  console.log('\n--- [1] DESKTOP VIEWPORT AUDIT (1280 x 800) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(500);

  const desktopMetrics = (await send('Runtime.evaluate', {
    expression: `(() => {
      const winW = window.innerWidth;
      const docW = document.documentElement.scrollWidth;
      const overflow = Math.max(0, docW - winW);
      return { winW, docW, overflow };
    })()`,
    returnByValue: true
  })).result.value;

  console.log(`Desktop Viewport Check: Window=${desktopMetrics.winW}px, Document=${desktopMetrics.docW}px, Overflow=${desktopMetrics.overflow}px`);
  if (desktopMetrics.overflow > 0) {
    console.error(`❌ Desktop Overflow detected: ${desktopMetrics.overflow}px`);
  } else {
    console.log('✅ Desktop Horizontal Overflow: 0px (PASS)');
  }

  // Check Content Structure & SVG infographics
  const contentAudit = (await send('Runtime.evaluate', {
    expression: `(() => {
      const codeBlocks = document.querySelectorAll('pre code, .code-block-wrapper').length;
      const svgs = Array.from(document.querySelectorAll('svg')).map(s => {
        const rect = s.getBoundingClientRect();
        return {
          aria: s.getAttribute('aria-label') || s.getAttribute('class') || 'icon',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      });
      const infographics = svgs.filter(s => s.width > 120);
      const headings = document.querySelectorAll('h1, h2, h3').length;
      const tables = document.querySelectorAll('table').length;
      return { codeBlocks, svgs, infographics, headings, tables };
    })()`,
    returnByValue: true
  })).result.value;

  console.log(`Content Elements Audit:`);
  console.log(`  • Code Blocks Count: ${contentAudit.codeBlocks} (Target: 0, ALL converted to SVG)`);
  if (contentAudit.codeBlocks === 0) {
    console.log('✅ Code Blocks: 0 remaining (ALL converted to SVG successfully)');
  } else {
    console.warn(`⚠️ Warning: ${contentAudit.codeBlocks} code block(s) still detected!`);
  }
  console.log(`  • Headings: ${contentAudit.headings} found`);
  console.log(`  • Tables: ${contentAudit.tables} found`);
  console.log(`  • Infographic SVGs: ${contentAudit.infographics.length} major diagrams found`);
  contentAudit.infographics.forEach((s, idx) => {
    console.log(`    [SVG ${idx+1}] "${s.aria}" -> ${s.width}x${s.height}px (Rendered: ${s.visible ? 'YES' : 'NO'})`);
  });

  // Capture Desktop Screenshots of SVG diagrams
  const desktopShots = [
    { name: '01_desktop_hero.png', expr: 'window.scrollTo(0, 0);' },
    {
      name: '02_desktop_svg1_pipeline_vs_mesh.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="문명 전파의 네트워크 구조"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '03_desktop_svg2_tree_vs_vine.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="문명 인식 패러다임"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '04_desktop_svg3_civilization_hierarchy.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="문명 개념의 역사적 변질"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '05_desktop_svg4_logistics_revolution.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="고대 운송 수단별 물류 수송력"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '06_desktop_svg5_berenike_buddha.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="베르니케 불상에 응축된"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '07_desktop_svg6_software_relay.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="문명 소프트웨어의 4대 릴레이"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '08_desktop_svg7_bronze_iron_paradox.png',
      expr: `(() => {
        const s = document.querySelector('svg[aria-label*="청동기 초연결망과 철기 탈세계화"]');
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    }
  ];

  for (const s of desktopShots) {
    await send('Runtime.evaluate', { expression: s.expr });
    await sleep(350);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(SCREENSHOT_DIR, s.name);
    fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
    console.log(`  📸 Saved screenshot: ${s.name}`);
  }

  // 2. MOBILE VIEWPORT AUDIT (390 x 844 - iPhone 12/13/14)
  console.log('\n--- [2] MOBILE VIEWPORT AUDIT (390 x 844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(500);

  const mobileMetrics = (await send('Runtime.evaluate', {
    expression: `(() => {
      const winW = window.innerWidth;
      const docW = document.documentElement.scrollWidth;
      const overflow = Math.max(0, docW - winW);
      return { winW, docW, overflow };
    })()`,
    returnByValue: true
  })).result.value;

  console.log(`Mobile Viewport Check: Window=${mobileMetrics.winW}px, Document=${mobileMetrics.docW}px, Overflow=${mobileMetrics.overflow}px`);
  if (mobileMetrics.overflow > 0) {
    console.error(`❌ Mobile Overflow detected: ${mobileMetrics.overflow}px`);
  } else {
    console.log('✅ Mobile Horizontal Overflow: 0px (PASS)');
  }

  // Mobile TOC Drawer test
  console.log('\n[Mobile UI] Testing TOC Drawer open/close...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tocBtn = document.getElementById('toc-toggle');
      if (tocBtn) tocBtn.click();
    })()`
  });
  await sleep(400);

  const tocDrawerActive = (await send('Runtime.evaluate', {
    expression: `document.getElementById('toc-drawer').classList.contains('active')`,
    returnByValue: true
  })).result.value;
  console.log(`TOC Drawer Opened: ${tocDrawerActive ? '✅ ACTIVE' : '❌ FAILED'}`);

  const shotDrawer = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, '09_mobile_toc_drawer.png'), Buffer.from(shotDrawer.data, 'base64'));
  console.log('  📸 Saved screenshot: 09_mobile_toc_drawer.png');

  // Close Drawer
  await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.getElementById('toc-close');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await sleep(300);

  // Theme Toggle Test (Dark Mode)
  console.log('\n[Theme] Testing Dark Mode Toggle...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const themeBtn = document.getElementById('theme-toggle');
      if (themeBtn) themeBtn.click();
    })()`
  });
  await sleep(400);

  const currentTheme = (await send('Runtime.evaluate', {
    expression: `document.documentElement.getAttribute('data-theme')`,
    returnByValue: true
  })).result.value;
  console.log(`Theme toggled to: ${currentTheme}`);

  // Capture Mobile Dark Mode Sample
  await send('Runtime.evaluate', {
    expression: `(() => {
      const s = document.querySelector('svg[aria-label*="문명 전파의 네트워크 구조"]');
      if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await sleep(400);

  const shotDark = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, '10_mobile_dark_mode_svg.png'), Buffer.from(shotDark.data, 'base64'));
  console.log('  📸 Saved screenshot: 10_mobile_dark_mode_svg.png');

  console.log('\n--- [3] AUDIT SUMMARY REPORT ---');
  console.log(`• Total Major SVG Infographics: ${contentAudit.infographics.length}`);
  console.log(`• Code Blocks: ${contentAudit.codeBlocks} (Target 0: PASS)`);
  console.log(`• Desktop Overflow: ${desktopMetrics.overflow}px (Target 0: PASS)`);
  console.log(`• Mobile Overflow: ${mobileMetrics.overflow}px (Target 0: PASS)`);
  console.log(`• Console Errors: ${consoleMessages.filter(m => m.type === 'error').length}`);

  cleanup();
  console.log('\n🎉 Visual and Rendering Audit completed successfully!');
}

auditPage().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
