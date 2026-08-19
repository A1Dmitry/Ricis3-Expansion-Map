import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

const port = 9229;
const profile = '/tmp/ricis-cdp-mobile-profile';
const url = 'http://127.0.0.1:3000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJsonList() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await response.json();
      const page = pages.find((candidate) => candidate.type === 'page');
      if (page) return page;
    } catch {
      // Chromium has not opened its debugging endpoint yet.
    }
    await sleep(250);
  }
  throw new Error('Chromium CDP endpoint did not become available.');
}

async function connectCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
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
    if (payload.method === 'Runtime.consoleAPICalled' || payload.method === 'Runtime.exceptionThrown' || payload.method === 'Log.entryAdded') {
      events.push(payload);
    }
  });

  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  return { socket, command, events };
}

await rm(profile, { recursive: true, force: true });
const chromium = spawn('chromium', [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--window-size=390,844',
  'about:blank',
], { stdio: 'ignore' });

try {
  const page = await waitForJsonList();
  const { socket, command, events } = await connectCdp(page.webSocketDebuggerUrl);
  await command('Runtime.enable');
  await command('Log.enable');
  await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  await command('Page.navigate', { url });
  await sleep(6000);
  const state = await command('Runtime.evaluate', {
    expression: `JSON.stringify({
      href: location.href,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      mobileQuery: window.matchMedia('(max-width: 767px), ((pointer: coarse) and (max-width: 1023px))').matches,
      rootText: document.getElementById('root')?.innerText,
      rootHtml: document.getElementById('root')?.innerHTML.slice(0, 1000),
      indexedDb: typeof indexedDB !== 'undefined'
    })`,
    returnByValue: true,
  });
  const normalizedEvents = events.map((event) => {
    if (event.method === 'Runtime.consoleAPICalled') {
      return {
        type: event.params.type,
        args: event.params.args.map((arg) => arg.value ?? arg.description ?? arg.type),
      };
    }
    if (event.method === 'Runtime.exceptionThrown') {
      return { type: 'exception', text: event.params.exceptionDetails.text, description: event.params.exceptionDetails.exception?.description };
    }
    return { type: event.params.entry.level, text: event.params.entry.text };
  });
  console.log(JSON.stringify({ state: JSON.parse(state.result.value), events: normalizedEvents }, null, 2));
  socket.close();
} finally {
  chromium.kill('SIGTERM');
}
