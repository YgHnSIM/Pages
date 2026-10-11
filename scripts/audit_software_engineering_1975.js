import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'file:///C:/Pages/software_engineering_framework_1975_dossier.html';
const SCREENSHOT_DIR = path.join(process.cwd(), 'audit_screenshots', 'software_engineering_1975');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function auditPage() {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-audit-se-1975-'));
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

  console.log('[Audit] Initializing CDP domains...');
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await sleep(1000);

  // 1. Desktop Visual Check & Element Counts
  console.log('[Audit] Evaluating DOM elements and structure...');
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const vcs = document.querySelectorAll('.verification-card').length;
      const tables = document.querySelectorAll('.table-wrapper').length;
      const katexMath = document.querySelectorAll('.katex').length;
      const mathErrors = document.querySelectorAll('.katex-error').length;
      const leakedCodeBlocks = document.querySelectorAll('pre code').length;
      const leakedDivs = Array.from(document.querySelectorAll('pre code')).filter(c => c.textContent.includes('<div') || c.textContent.includes('<table')).length;

      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent || '',
        vcCount: vcs,
        tableCount: tables,
        katexCount: katexMath,
        katexErrorCount: mathErrors,
        totalCodeBlocks: leakedCodeBlocks,
        leakedHtmlInCode: leakedDivs
      };
    })()`,
    returnByValue: true
  });

  console.log('[Audit] DOM Structure Stats:', JSON.stringify(evalResult.result.value, null, 2));

  // 2. Desktop Screenshots
  console.log('[Audit] Capturing Desktop Header Area Screenshot...');
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
  await sleep(300);
  const snapHeader = await send('Page.captureScreenshot', { format: 'png' });
  const headerBuf = Buffer.from(snapHeader.data, 'base64');
  const headerPath = path.join(SCREENSHOT_DIR, '01_desktop_header.png');
  fs.writeFileSync(headerPath, headerBuf);
  console.log(`[Audit] Header screenshot saved: ${headerPath} (${headerBuf.length} bytes)`);

  console.log('[Audit] Capturing Desktop Matrix Table Screenshot...');
  await send('Runtime.evaluate', { expression: `document.querySelector('.table-wrapper')?.scrollIntoView();` });
  await sleep(300);
  const snapTable = await send('Page.captureScreenshot', { format: 'png' });
  const tableBuf = Buffer.from(snapTable.data, 'base64');
  const tablePath = path.join(SCREENSHOT_DIR, '02_desktop_matrix_table.png');
  fs.writeFileSync(tablePath, tableBuf);
  console.log(`[Audit] Matrix table screenshot saved: ${tablePath} (${tableBuf.length} bytes)`);

  console.log('[Audit] Capturing Desktop Verification Card #01 Screenshot...');
  await send('Runtime.evaluate', { expression: `document.querySelector('#vc-01')?.scrollIntoView();` });
  await sleep(300);
  const snapVc = await send('Page.captureScreenshot', { format: 'png' });
  const vcBuf = Buffer.from(snapVc.data, 'base64');
  const vcPath = path.join(SCREENSHOT_DIR, '03_desktop_vc_01.png');
  fs.writeFileSync(vcPath, vcBuf);
  console.log(`[Audit] VC-01 screenshot saved: ${vcPath} (${vcBuf.length} bytes)`);

  // 3. Mobile Viewport Test (390 x 844)
  console.log('[Audit] Testing Mobile Viewport (390 x 844)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(500);

  const mobileEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const overflow = scrollWidth - innerWidth;
      return {
        scrollWidth,
        innerWidth,
        overflow,
        hasHorizontalScroll: overflow > 0
      };
    })()`,
    returnByValue: true
  });

  console.log('[Audit] Mobile Viewport Metrics:', JSON.stringify(mobileEval.result.value, null, 2));

  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
  await sleep(300);
  const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
  const mobileBuf = Buffer.from(snapMobile.data, 'base64');
  const mobilePath = path.join(SCREENSHOT_DIR, '04_mobile_view.png');
  fs.writeFileSync(mobilePath, mobileBuf);
  console.log(`[Audit] Mobile screenshot saved: ${mobilePath} (${mobileBuf.length} bytes)`);

  // Validation
  if (headerBuf.length < 20000 || tableBuf.length < 20000 || vcBuf.length < 20000 || mobileBuf.length < 20000) {
    throw new Error('Screenshot file size below 20,000 bytes threshold! Potential blank page.');
  }

  if (mobileEval.result.value.hasHorizontalScroll) {
    throw new Error(`Mobile viewport horizontal overflow detected: ${mobileEval.result.value.overflow}px!`);
  }

  if (evalResult.result.value.leakedHtmlInCode > 0) {
    throw new Error(`Leaked HTML code blocks detected: ${evalResult.result.value.leakedHtmlInCode} instances!`);
  }

  console.log('✅ ALL AUDIT AND VISUAL CHECKS PASSED PERFECTLY!');
  cleanup();
  process.exit(0);
}

auditPage().catch(err => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
