// Local dev server: serves the static site + the same /api handler Vercel runs.
//   node dev-server.js [port]     (uses in-memory data unless SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set)
const http = require("http");
const fs = require("fs");
const path = require("path");
const api = require("./api/[...path].js");

const root = path.join(__dirname, "public");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
const hidden = /^\/(\.|assets\/inspo)/;

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/api/")) {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      res.status = (n) => { res.statusCode = n; return res; };
      res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
      api(req, res);
    });
    return;
  }
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = path.join(root, p);
  if (hidden.test(p) || !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(Number(process.argv[2]) || 8001, () => console.log("dev server on http://localhost:" + (Number(process.argv[2]) || 8001)));
