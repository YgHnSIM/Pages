import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'file:///C:/Pages/douglas_ross_plex_struct_origin_dossier.html';
const SCREENSHOT_DIR = path.join(process.cwd(), 'audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVisualAudit() {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-audit-'));
  const port = 9350;

  console.log(`[CDP] Starting Headless Chrome on port ${port}...`);
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=390,844',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars'
  ]);

  // Ensure process terminates on script exit
  const cleanup = () => {
    try { chromeProcess.kill(); } catch {}
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  // Wait for Chrome remote debugging
  let version = null;
  for (let i = 0; i < 25; i++) {
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

  console.log('[CDP] Creating new target tab...');
  const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(TARGET_URL)}`, { method: 'PUT' });
  const target = await newTabRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
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

  console.log('[CDP] Initializing DevTools protocol domains...');
  await send('Page.enable');
  await send('Runtime.enable');

  // Set device metrics: Mobile 390 x 844
  console.log('[CDP] Setting mobile viewport: 390 x 844 px...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Give fonts and KaTeX equations time to finish rendering
  await sleep(2000);

  // 1. Audit Overflow
  console.log('[CDP] Running layout overflow checks...');
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const winW = window.innerWidth;
      const docW = document.documentElement.scrollWidth;
      const overflow = Math.max(0, docW - winW);
      return { winW, docW, overflow };
    })()`,
    returnByValue: true
  });
  const metrics = evalRes.result.value;
  console.log(`[CDP] Layout Check -> Viewport: ${metrics.winW}px, Document: ${metrics.docW}px, Overflow: ${metrics.overflow}px`);
  if (metrics.overflow > 0) {
    console.error(`[CDP] ❌ FAILED: Horizontal overflow of ${metrics.overflow}px detected!`);
  } else {
    console.log('[CDP] ✅ PASSED: ZERO Horizontal Overflow (0px)!');
  }

  // 2. Take screenshots of key sections
  const targets = [
    {
      name: '01_mobile_header.png',
      desc: 'Top Header & Article Title Area',
      evalExpr: 'window.scrollTo(0, 0);'
    },
    {
      name: '02_summary_table.png',
      desc: '8-Issue Executive Summary Matrix Table',
      evalExpr: `(() => {
        const el = document.getElementById('8대-쟁점-전수-검증-매트릭스-표') || document.querySelector('.table-wrapper');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    },
    {
      name: '03_vc_01_card.png',
      desc: 'Verification Card vc-01 (5-Step Structure)',
      evalExpr: `(() => {
        const el = document.getElementById('vc-01');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    },
    {
      name: '04_math_model.png',
      desc: 'Quantitative Mathematical Model & KaTeX Formulas',
      evalExpr: `(() => {
        const el = document.getElementById('3-계량-수리-모델-및-마이크로아키텍처-비교-quantitative-architecture-model') || document.querySelector('.katex-display');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    },
    {
      name: '05_references_section.png',
      desc: 'Primary Source Archival Registry',
      evalExpr: `(() => {
        const el = document.getElementById('4-1차-원전-사료-아카이브-및-등록-레지스트리-primary-source-registry') || document.querySelector('.references-collapsible');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    }
  ];

  console.log('\n[CDP] Capturing section screenshots...');
  const shotResults = [];

  for (const t of targets) {
    await send('Runtime.evaluate', { expression: t.evalExpr });
    await sleep(400);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, t.name);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    const size = fs.statSync(filePath).size;
    console.log(`  ✓ ${t.name} (${t.desc}): ${size.toLocaleString()} bytes`);
    shotResults.push({ name: t.name, size, pass: size > 20000 });
  }

  console.log('\n=== Screenshot File Integrity (> 20,000 bytes) ===');
  let allPass = true;
  for (const r of shotResults) {
    if (r.pass) {
      console.log(`✅ ${r.name}: ${r.size.toLocaleString()} bytes (VALID)`);
    } else {
      console.error(`❌ ${r.name}: ${r.size.toLocaleString()} bytes (INVALID - Blank Screen)`);
      allPass = false;
    }
  }

  ws.close();
  cleanup();

  if (metrics.overflow === 0 && allPass) {
    console.log('\n🎉 ALL CDP VISUAL AUDITS PASSED WITH ZERO ERRORS!');
  } else {
    process.exit(1);
  }
}

runVisualAudit().catch(err => {
  console.error('[CDP] Execution error:', err);
  process.exit(1);
});
