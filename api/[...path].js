// Vercel serverless entry: /api/*  (same handler is used by dev-server.js locally)
const { route, HttpError } = require("../lib/game");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const url = new URL(req.url, "http://x");
    const path = url.pathname.replace(/^\/api\/?/, "");
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const data = await route(req.method, path, body, token);
    res.status(200).json({ ok: true, data });
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ ok: false, error: { code: e.code, message: e.message } });
    console.error(e);
    res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Something went wrong on our side. Try again." } });
  }
};
