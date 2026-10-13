// scripts/take-phase3-screenshots.mjs
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const anonKey = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

const outDir = path.resolve("reports/screenshots/phase-3");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Find Edge executable on Windows
const edgePaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
let edgePath = edgePaths.find(p => fs.existsSync(p));
if (!edgePath) {
  console.error("Microsoft Edge not found at standard paths");
  process.exit(1);
}

const port = 9222;
const userDataDir = path.resolve("scratch/edge-profile-phase3");

// Launch Edge Headless
const edgeProcess = spawn(edgePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank",
]);

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/new`, { method: "PUT" });
      const data = await res.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error("Edge CDP page target not available");
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WS = globalThis.WebSocket;
    return new Promise((resolve, reject) => {
      this.ws = new WS(this.wsUrl);
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function getAuthCookies(email, password = "Test@1234") {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // Format token into Supabase auth cookies
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionStr = JSON.stringify(data.session);
  const base64Session = Buffer.from(sessionStr).toString("base64");

  return [
    {
      name: cookieName,
      value: `base64-${base64Session}`,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
    },
  ];
}

async function captureScreen(cdp, url, outFile, cookies = [], width = 1280, height = 800) {
  console.log(`Capturing: ${url} -> ${outFile}`);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCookies");
  
  for (const c of cookies) {
    await cdp.send("Network.setCookie", c);
  }

  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url });
  
  // Wait for load and animations
  await new Promise(r => setTimeout(r, 2500));

  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, outFile), Buffer.from(screenshot.data, "base64"));
  console.log(`Saved: ${outFile} ✅`);
}

async function run() {
  const wsUrl = await getWsUrl();
  const cdp = new SimpleCDP(wsUrl);
  await cdp.connect();

  try {
    // 1. Neha (unverified, no vehicle) -> /rides/new (shows banner)
    const nehaCookies = await getAuthCookies("neha@test.com");
    await captureScreen(cdp, "http://localhost:3000/rides/new", "offer-ride-banner.png", nehaCookies);

    // 2. Neha -> /verification (shows verification form)
    await captureScreen(cdp, "http://localhost:3000/verification", "driver-verification.png", nehaCookies);

    // 3. Rahul (verified with car) -> /vehicles (shows vehicle card with Indian plate)
    const rahulCookies = await getAuthCookies("rahul@test.com");
    await captureScreen(cdp, "http://localhost:3000/vehicles", "my-vehicles.png", rahulCookies);

    // 4. Rahul -> /rides/new (shows offer ride form with live preview)
    await captureScreen(cdp, "http://localhost:3000/rides/new", "offer-ride-form.png", rahulCookies);

    // 5. Admin -> /admin/verifications (shows pending/processed verifications)
    const adminCookies = await getAuthCookies("admin@test.com");
    await captureScreen(cdp, "http://localhost:3000/admin/verifications", "admin-verifications.png", adminCookies);

    console.log("All Phase 3 screenshots captured successfully!");
  } finally {
    cdp.close();
    edgeProcess.kill();
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error("Screenshot capture error:", err);
  edgeProcess.kill();
  process.exit(1);
});
