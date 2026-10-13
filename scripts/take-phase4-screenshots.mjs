// scripts/take-phase4-screenshots.mjs
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const outDir = path.resolve("reports/screenshots/phase-4");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Find Edge executable on Windows
const edgePaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edgePath = edgePaths.find((p) => fs.existsSync(p));
if (!edgePath) {
  console.error("Microsoft Edge not found at standard paths");
  process.exit(1);
}

const port = 9223;
const userDataDir = path.resolve("scratch/edge-profile-phase4");

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
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Edge CDP page target not available");
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new globalThis.WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function takeScreenshots() {
  try {
    console.log("Waiting for Edge to initialize...");
    const wsUrl = await getWsUrl();
    const cdp = new SimpleCDP(wsUrl);
    await cdp.connect();

    console.log("CDP connected.");
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");

    // Sign in as Aman to get session
    const amanAuth = await createClient(supabaseUrl, anonKey).auth.signInWithPassword({
      email: "aman@test.com",
      password: "Test@1234",
    });
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    if (amanAuth.data.session) {
      await cdp.send("Network.setCookie", {
        name: cookieName,
        value: "base64-" + Buffer.from(JSON.stringify(amanAuth.data.session)).toString("base64"),
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
      });
    }

    const SEC_62_ID = "077cb7c3-91e8-492b-8ae5-3567fd1feeb0";
    const COLLEGE_ID = "993a28bb-a454-42c6-8262-54d234664b4c";
    const RIDE_DATE = "2026-10-14";

    // 1. Desktop Search Results (Best Match)
    console.log("Capturing search-best-match-desktop.png...");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const searchUrl = `http://localhost:3000/rides/search?from=${SEC_62_ID}&to=${COLLEGE_ID}&date=${RIDE_DATE}&time=08:15`;
    await cdp.send("Page.navigate", { url: searchUrl });
    await new Promise((r) => setTimeout(r, 2000));

    const shot1 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, "search-best-match-desktop.png"), Buffer.from(shot1.data, "base64"));

    // 2. Mobile Search Results
    console.log("Capturing search-best-match-mobile.png...");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shot2 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, "search-best-match-mobile.png"), Buffer.from(shot2.data, "base64"));

    // 3. Desktop Empty State
    console.log("Capturing search-empty-state.png...");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Page.navigate", {
      url: `http://localhost:3000/rides/search?from=${SEC_62_ID}&to=${COLLEGE_ID}&date=2028-01-01`,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shot3 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, "search-empty-state.png"), Buffer.from(shot3.data, "base64"));

    // 4. Rahul viewing own ride
    console.log("Capturing search-own-ride.png...");
    const rahulAuth = await createClient(supabaseUrl, anonKey).auth.signInWithPassword({
      email: "rahul@test.com",
      password: "Test@1234",
    });
    if (rahulAuth.data.session) {
      await cdp.send("Network.setCookie", {
        name: cookieName,
        value: "base64-" + Buffer.from(JSON.stringify(rahulAuth.data.session)).toString("base64"),
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
      });
    }
    await cdp.send("Page.navigate", { url: searchUrl });
    await new Promise((r) => setTimeout(r, 1500));
    const shot4 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, "search-own-ride.png"), Buffer.from(shot4.data, "base64"));

    cdp.close();
    console.log("All Phase 4 screenshots captured successfully!");
  } finally {
    edgeProcess.kill();
  }
}

takeScreenshots().catch(console.error);
