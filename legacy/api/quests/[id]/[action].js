// POST /api/quests/:id/:action  (accept | checkin | complete | abandon)
const handle = require("../../../lib/http");
module.exports = (req, res) => {
  const q = req.query || {};
  return handle(req, res, `quests/${encodeURIComponent(q.id || "")}/${encodeURIComponent(q.action || "")}`);
};
