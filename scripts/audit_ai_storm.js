import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'file:///C:/Pages/earnings_cashflows_stock_prices_ai_storm.html';
const SCREENSHOT_DIR = path.join(process.cwd(), 'audit_screenshots', 'ai_storm');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function auditPage() {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-audit-ai-storm-'));
  const port = 9352;

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

  // Wait for KaTeX and webfonts to settle
  console.log('[Audit] Waiting for assets (KaTeX, Pretendard webfonts) to load...');
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

  // Check Math & SVG elements
  const contentAudit = (await send('Runtime.evaluate', {
    expression: `(() => {
      const katexCount = document.querySelectorAll('.katex').length;
      const katexErrors = document.querySelectorAll('.katex-error').length;
      const svgs = Array.from(document.querySelectorAll('svg')).map(s => {
        const rect = s.getBoundingClientRect();
        return {
          aria: s.getAttribute('aria-label') || s.getAttribute('class') || 'icon',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      });
      const headings = document.querySelectorAll('h1, h2, h3').length;
      const tables = document.querySelectorAll('table').length;
      return { katexCount, katexErrors, svgs, headings, tables };
    })()`,
    returnByValue: true
  })).result.value;

  console.log(`Content Audit:`);
  console.log(`  • Headings: ${contentAudit.headings} found`);
  console.log(`  • Tables: ${contentAudit.tables} found`);
  console.log(`  • KaTeX Equations: ${contentAudit.katexCount} rendered (Errors: ${contentAudit.katexErrors})`);
  console.log(`  • SVGs: ${contentAudit.svgs.length} total found`);
  contentAudit.svgs.forEach((s, idx) => {
    if (s.width > 100) {
      console.log(`    - Infographic ${idx+1}: "${s.aria}" -> ${s.width}x${s.height}px (Visible: ${s.visible})`);
    }
  });

  // Capture Desktop Screenshots
  const desktopShots = [
    { name: '01_desktop_hero.png', expr: 'window.scrollTo(0, 0);' },
    {
      name: '02_desktop_table_macro.png',
      expr: `document.querySelector('table').scrollIntoView({ behavior: 'instant', block: 'center' });`
    },
    {
      name: '03_desktop_svg1_accounting_loop.png',
      expr: `(() => {
        const s = document.querySelectorAll('svg')[2];
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '04_desktop_svg2_capital_transition.png',
      expr: `(() => {
        const s = document.querySelectorAll('svg')[3];
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '05_desktop_svg3_investor_pathways.png',
      expr: `(() => {
        const s = document.querySelectorAll('svg')[4];
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    }
  ];

  for (const s of desktopShots) {
    await send('Runtime.evaluate', { expression: s.expr });
    await sleep(400);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(SCREENSHOT_DIR, s.name);
    fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
    console.log(`  📸 Saved desktop screenshot: ${s.name} (${fs.statSync(p).size.toLocaleString()} bytes)`);
  }

  // Test Theme Toggle (Dark Mode)
  console.log('\n--- [2] INTERACTIVE CONTROLS: THEME & DRAWER AUDIT ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.click();
    })()`
  });
  await sleep(400);

  const themeResult = (await send('Runtime.evaluate', {
    expression: `(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      const bg = window.getComputedStyle(document.body).backgroundColor;
      return { theme, bg };
    })()`,
    returnByValue: true
  })).result.value;

  console.log(`Theme Toggle Result: data-theme="${themeResult.theme}", body bg="${themeResult.bg}"`);
  const shotDark = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, '06_desktop_dark_mode.png'), Buffer.from(shotDark.data, 'base64'));
  console.log('  📸 Saved dark mode screenshot: 06_desktop_dark_mode.png');

  // Toggle back to light
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.click();
    })()`
  });
  await sleep(300);

  // Test TOC Drawer Toggle
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tocBtn = document.getElementById('toc-toggle');
      if (tocBtn) tocBtn.click();
    })()`
  });
  await sleep(400);

  const drawerResult = (await send('Runtime.evaluate', {
    expression: `(() => {
      const drawer = document.getElementById('toc-drawer');
      const overlay = document.getElementById('drawer-overlay');
      return {
        drawerActive: drawer ? drawer.classList.contains('active') : false,
        overlayActive: overlay ? overlay.classList.contains('active') : false
      };
    })()`,
    returnByValue: true
  })).result.value;

  console.log(`TOC Drawer Opened: Drawer Active=${drawerResult.drawerActive}, Overlay Active=${drawerResult.overlayActive}`);
  const shotDrawer = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, '07_desktop_toc_drawer.png'), Buffer.from(shotDrawer.data, 'base64'));
  console.log('  📸 Saved TOC drawer screenshot: 07_desktop_toc_drawer.png');

  // Close Drawer
  await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.getElementById('toc-close');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await sleep(300);

  // 3. MOBILE VIEWPORT AUDIT (390 x 844 iPhone 14 / modern mobile)
  console.log('\n--- [3] MOBILE VIEWPORT AUDIT (390 x 844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(600);

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
    console.error(`❌ Mobile Overflow detected: ${mobileMetrics.overflow}px!`);
    // Find what is overflowing
    const overflowEls = (await send('Runtime.evaluate', {
      expression: `(() => {
        const els = Array.from(document.querySelectorAll('*')).filter(el => {
          return el.getBoundingClientRect().right > window.innerWidth + 1;
        }).map(el => el.tagName + (el.className ? '.' + el.className : '') + (el.id ? '#' + el.id : ''));
        return els.slice(0, 5);
      })()`,
      returnByValue: true
    })).result.value;
    console.error('Overflowing elements sample:', overflowEls);
  } else {
    console.log('✅ Mobile Horizontal Overflow: ZERO (0px) - Perfectly Responsive (PASS)');
  }

  // Check SVG scaling on mobile
  const mobileSvgScaling = (await send('Runtime.evaluate', {
    expression: `(() => {
      const svgs = Array.from(document.querySelectorAll('svg')).filter(s => s.getBoundingClientRect().width > 100);
      return svgs.map(s => ({
        aria: s.getAttribute('aria-label') || 'diagram',
        width: Math.round(s.getBoundingClientRect().width),
        fitsMobile: s.getBoundingClientRect().width <= window.innerWidth
      }));
    })()`,
    returnByValue: true
  })).result.value;

  console.log('Mobile SVG Responsiveness Check:');
  mobileSvgScaling.forEach((s, idx) => {
    console.log(`  • Diagram ${idx+1}: width=${s.width}px, fitsMobile=${s.fitsMobile} (${s.aria})`);
  });

  const mobileShots = [
    { name: '08_mobile_hero.png', expr: 'window.scrollTo(0, 0);' },
    {
      name: '09_mobile_svg1_accounting_loop.png',
      expr: `(() => {
        const s = document.querySelectorAll('svg')[2];
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '10_mobile_svg2_capital_transition.png',
      expr: `(() => {
        const s = document.querySelectorAll('svg')[3];
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '11_mobile_svg3_investor_pathways.png',
      expr: `(() => {
        const s = document.querySelectorAll('svg')[4];
        if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    }
  ];

  for (const s of mobileShots) {
    await send('Runtime.evaluate', { expression: s.expr });
    await sleep(400);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(SCREENSHOT_DIR, s.name);
    fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
    console.log(`  📸 Saved mobile screenshot: ${s.name} (${fs.statSync(p).size.toLocaleString()} bytes)`);
  }

  ws.close();
  cleanup();

  console.log('\n=========================================');
  console.log('🎉 AUDIT SUMMARY & INTEGRITY CHECK:');
  const allScreenshots = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  console.log(`Total Screenshots Captured: ${allScreenshots.length}`);
  let allShotsValid = true;
  for (const f of allScreenshots) {
    const sz = fs.statSync(path.join(SCREENSHOT_DIR, f)).size;
    const ok = sz > 25000;
    if (!ok) allShotsValid = false;
    console.log(`  [${ok ? 'OK' : 'FAIL'}] ${f}: ${sz.toLocaleString()} bytes`);
  }

  const passed = desktopMetrics.overflow === 0 &&
                 mobileMetrics.overflow === 0 &&
                 contentAudit.katexErrors === 0 &&
                 themeResult.theme === 'dark' &&
                 drawerResult.drawerActive &&
                 allShotsValid;

  if (passed) {
    console.log('\n🏆 ALL RENDERING & RESPONSIVE AUDITS PASSED WITH ZERO DEFECTS!');
  } else {
    console.error('\n⚠️ SOME AUDIT CHECKS FAILED!');
    process.exit(1);
  }
}

auditPage().catch(err => {
  console.error('[Audit] Fatal error:', err);
  process.exit(1);
});
