import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=') || 'true'];
}));
const width = Number(args.width ?? 390);
const height = Number(args.height ?? 844);
const scenario = args.scenario ?? 'map';
const output = args.out ?? `/tmp/ricis-mobile-${scenario}-${width}x${height}.png`;
const port = Number(args.port ?? 9230);
const url = args.url ?? 'http://127.0.0.1:3000';
const profile = `/tmp/ricis-mobile-cdp-${process.pid}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPage() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await response.json();
      const page = pages.find((candidate) => candidate.type === 'page');
      if (page) return page;
    } catch {
      // Chromium has not opened CDP yet.
    }
    await sleep(250);
  }
  throw new Error('Chromium CDP endpoint did not become available.');
}

async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 1;
  const pending = new Map();
  const events = [];
  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(String(event.data));
    if (payload.id) {
      const request = pending.get(payload.id);
      pending.delete(payload.id);
      if (!request) return;
      if (payload.error) request.reject(new Error(payload.error.message));
      else request.resolve(payload.result);
      return;
    }
    if (payload.method === 'Runtime.consoleAPICalled' || payload.method === 'Runtime.exceptionThrown' || payload.method === 'Log.entryAdded') events.push(payload);
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const commandId = id++;
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
  return { socket, command, events };
}

async function waitFor(command, expression, description) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true });
    if (result.result.value) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function click(command, expression, description) {
  const result = await command('Runtime.evaluate', {
    expression: `(() => { const element = ${expression}; if (!element) return false; element.click(); return true; })()`,
    returnByValue: true,
  });
  if (!result.result.value) throw new Error(`Could not click ${description}.`);
  await sleep(250);
}

await rm(profile, { recursive: true, force: true });
await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true });
const chromium = spawn('chromium', [
  '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  `--window-size=${width},${height}`, 'about:blank',
], { stdio: 'ignore' });

try {
  const page = await waitForPage();
  const { socket, command, events } = await connect(page.webSocketDebuggerUrl);
  await command('Runtime.enable');
  await command('Log.enable');
  await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: true, screenWidth: width, screenHeight: height,
  });
  await command('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await command('Page.navigate', { url });
  await waitFor(command, "Boolean(document.querySelector('[data-testid=\"mobile-map-shell\"]'))", 'mobile shell');
  await sleep(1200);

  if (scenario === 'menu') {
    await click(command, "document.querySelector('button[aria-label=\"Открыть меню\"]')", 'mobile menu');
    await waitFor(command, "Boolean(document.querySelector('[data-testid=\"mobile-menu-screen\"]'))", 'menu screen');
  }
  if (scenario === 'details') {
    await click(command, "document.querySelector('button[aria-label=\"Открыть меню\"]')", 'mobile menu');
    await waitFor(command, "Boolean(document.querySelector('[data-testid=\"mobile-menu-screen\"]'))", 'menu screen');
    await click(command, "Array.from(document.querySelectorAll('[data-testid=\"mobile-menu-screen\"] section button')).find(Boolean)", 'first search result');
    await waitFor(command, "Boolean(document.querySelector('[data-testid=\"mobile-details-screen\"]'))", 'details screen');
  }
  if (scenario === 'settings') {
    await click(command, "document.querySelector('button[aria-label=\"Открыть меню\"]')", 'mobile menu');
    await waitFor(command, "Boolean(document.querySelector('[data-testid=\"mobile-menu-screen\"]'))", 'menu screen');
    await click(command, "document.querySelector('details.mobile-menu-secondary > summary')", 'secondary tools group');
    await waitFor(command, "Boolean(document.querySelector('details.mobile-menu-secondary[open]'))", 'expanded secondary tools group');
    await click(command, "Array.from(document.querySelectorAll('[data-testid=\"mobile-menu-screen\"] button')).find((button) => button.textContent.includes('Настройки интерфейса'))", 'settings action');
    await waitFor(command, "document.body.innerText.includes('Настройки')", 'settings screen');
  }
  if (scenario === 'immersive') {
    await click(command, "document.querySelector('button[aria-label=\"Развернуть 3D на полный экран\"]')", 'immersive action');
    await waitFor(command, "Boolean(document.querySelector('button[aria-label=\"Выйти из полноэкранного режима\"]')) || document.body.innerText.includes('Выйти')", 'immersive map');
  }
  if (args.scroll === 'end') {
    await command('Runtime.evaluate', {
      expression: `(() => { const element = document.querySelector('[data-testid="mobile-details-screen"]') || document.querySelector('[data-testid="mobile-menu-screen"]'); if (!element) return false; element.scrollTop = element.scrollHeight; return element.scrollTop > 0; })()`,
      returnByValue: true,
    });
    await sleep(250);
  }

  const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(output, Buffer.from(screenshot.data, 'base64'));
  const summary = await command('Runtime.evaluate', {
    expression: `JSON.stringify({ scenario: ${JSON.stringify(scenario)}, viewport: [window.innerWidth, window.innerHeight], text: document.getElementById('root')?.innerText.slice(0, 500), activeTestIds: Array.from(document.querySelectorAll('[data-testid]')).map((item) => item.getAttribute('data-testid')), mobileMenuResultsGridColumns: (() => { const element = document.querySelector('.mobile-menu-results'); return element ? getComputedStyle(element).gridTemplateColumns : null; })() })`,
    returnByValue: true,
  });
  const errors = events.filter((event) => event.method === 'Runtime.exceptionThrown' || event.params?.type === 'error' || event.params?.entry?.level === 'error');
  console.log(JSON.stringify({ output, summary: JSON.parse(summary.result.value), errors }, null, 2));
  socket.close();
} finally {
  chromium.kill('SIGTERM');
}
