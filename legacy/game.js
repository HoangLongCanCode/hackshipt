// RPG Birmingham: game UI (login, quest pins, quest flow, ranks, store, people, profile).
// Talks to /api/* (Vercel functions + Supabase in production; in-memory data in local dev).
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CAT = { education: "📚", food: "🍲", farm: "🌱", tech: "💻", seniors: "🤝", community: "💬" };
  const INTERESTS = [["food", "🍲 Food"], ["gardening", "🌱 Gardening"], ["teaching", "📚 Teaching"], ["tech", "💻 Tech"], ["seniors", "🤝 Seniors"], ["community", "💬 Community"], ["outdoors", "🌳 Outdoors"], ["music", "🎸 Music"]];
  const TITLES = { quests: "Quest board", quest: "Quest", ranks: "Leaderboard", store: "Store & donate", people: "Adventurers like you", me: "Adventurer" };

  const S = { token: null, data: null, tab: null, selected: null, orgOff: new Set(), markers: new Map(), mapReady: false, qDistrict: {}, busy: false };
  try { S.token = localStorage.getItem("rpgb-token"); } catch (e) {}

  // ---------- API ----------
  async function api(method, path, body) {
    const res = await fetch("/api/" + path, {
      method, headers: { "Content-Type": "application/json", ...(S.token ? { Authorization: "Bearer " + S.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let j; try { j = await res.json(); } catch (e) { throw new Error("Server unavailable"); }
    if (!j.ok) { const err = new Error(j.error.message); err.code = j.error.code; throw err; }
    return j.data;
  }
  const orgOf = (id) => S.data.orgs.find((o) => o.id === id) || {};
  const questOf = (id) => S.data.quests.find((q) => q.id === id);

  // ---------- toasts / modal ----------
  function toast(msg, isErr) {
    const el = document.createElement("div");
    el.className = "toast" + (isErr ? " err" : ""); el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), isErr ? 4200 : 3000);
  }
  function modal(html) { const m = $("#modal"); m.innerHTML = `<div class="card">${html}</div>`; m.hidden = false; m.onclick = (e) => { if (e.target === m) m.hidden = true; }; const b = m.querySelector("[data-close]"); if (b) b.onclick = () => (m.hidden = true); }

  // ---------- HUD ----------
  const tween = (el, to) => { const from = Number(el.dataset.v || to); el.dataset.v = to; const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 700); el.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
  function renderHud() {
    const me = S.data.me; $("#hud").hidden = !me; $("#topSub").style.display = me ? "none" : "";
    if (!me) return;
    $("#hudEmoji").textContent = me.avatarEmoji; $("#hudName").textContent = me.name;
    $("#hudClass").textContent = `${me.emoji} ${me.klass}`;
    $("#hudLv").textContent = me.level; $("#hudXp").style.width = me.pct + "%";
    tween($("#hudCredits"), me.credits);
    $("#hudRank").textContent = S.data.myRank ? `rank #${S.data.myRank}` : "";
  }

  // ---------- org filter chips ----------
  function renderChips() {
    $("#chips").innerHTML = S.data.orgs.map((o) => `<button class="chip ${S.orgOff.has(o.id) ? "off" : "on"}" data-org="${o.id}" style="--c:${o.color}" title="${esc(o.name)}"><i></i>${esc(o.name)}</button>`).join("");
  }
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-org]"); if (!b) return;
    const id = b.dataset.org; S.orgOff.has(id) ? S.orgOff.delete(id) : S.orgOff.add(id);
    renderChips(); renderMarkers(); renderStrip(); if (S.tab === "quests") renderDrawer();
  });

  // ---------- map pins ----------
  function pinClass(q) {
    return "qpin" + (q.myStatus === "COMPLETED" ? " done" : q.myStatus === "ACCEPTED" || q.myStatus === "CHECKED_IN" ? " mine" : q.spotsLeft === 0 ? " full" : "") + (S.selected === q.id ? " sel" : "");
  }
  const bangOf = (q) => (q.myStatus === "COMPLETED" ? "✓" : q.myStatus === "ACCEPTED" || q.myStatus === "CHECKED_IN" ? "▶" : q.spotsLeft === 0 ? "•" : "!");
  function renderMarkers() {
    if (!S.mapReady || !S.data) return;
    const map = window.RPGB_MAP.map;
    for (const q of S.data.quests) {
      let m = S.markers.get(q.id);
      if (!m) {
        const el = document.createElement("div");
        el.style.setProperty("--c", orgOf(q.orgId).color);
        el.innerHTML = `<div class="stem"></div><div class="ring"></div><div class="fl"><div class="hex"><i>${CAT[q.category] || "❔"}</i></div><div class="bang"></div></div><div class="lbl">${esc(q.title)}</div>`;
        el.addEventListener("click", (e) => { e.stopPropagation(); select(q.id); });
        m = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([q.lng, q.lat]).addTo(map);
        S.markers.set(q.id, m);
      }
      const el = m.getElement();
      el.classList.remove("done", "mine", "full", "sel"); el.classList.add(...pinClass(q).split(" ")); // keep maplibre's own marker class
      el.querySelector(".bang").textContent = bangOf(q);
      el.style.display = S.orgOff.has(q.orgId) ? "none" : "";
    }
  }

  // ---------- districts ----------
  function computeDistricts() {
    if (!S.mapReady || !S.data) return;
    for (const q of S.data.quests) { const a = window.RPGB_MAP.areaAt(q.lng, q.lat); S.qDistrict[q.id] = a ? a.name : "Birmingham"; }
  }
  window.RPGB_onArea = (a) => {
    const meta = $("#areaMeta");
    if (!a || !S.data) { meta.textContent = ""; return; }
    const qs = S.data.quests.filter((q) => S.qDistrict[q.id] === a.name);
    const done = qs.filter((q) => q.myStatus === "COMPLETED").length;
    meta.textContent = qs.length ? `${qs.length} quest${qs.length > 1 ? "s" : ""} here${S.data.me ? ` · ${done}/${qs.length} done` : ""}` : "No quests yet";
  };

  // ---------- mobile bottom sheet: peek / half / full + quest strip (layout idea from frontend-kit) ----------
  const mobile = () => innerWidth <= 700;
  const PEEK = 168;
  function sheetOffset(snap) { const d = $("#drawer"), h = d.offsetHeight; const vis = snap === "peek" ? PEEK : snap === "half" ? Math.round(innerHeight * 0.5) : h; return Math.max(0, h - Math.min(vis, h)); }
  function setSnap(snap) {
    const d = $("#drawer"); d.dataset.snap = snap; d.style.transform = mobile() ? `translateY(${sheetOffset(snap)}px)` : "";
    if (S.mapReady && mobile()) window.RPGB_MAP.map.easeTo({ padding: { bottom: Math.min(d.offsetHeight - sheetOffset(snap), innerHeight * 0.6), top: 0, left: 0, right: 0 }, duration: 400 });
  }
  (function () {
    const g = $("#grab"), d = $("#drawer"); let st = null;
    g.addEventListener("pointerdown", (e) => { g.setPointerCapture(e.pointerId); st = { y: e.clientY, o: sheetOffset(d.dataset.snap), v: 0, ly: e.clientY, lt: performance.now() }; d.classList.add("drag"); });
    g.addEventListener("pointermove", (e) => { if (!st) return; const n = performance.now(); st.v = (e.clientY - st.ly) / Math.max(1, n - st.lt); st.ly = e.clientY; st.lt = n; st.cur = Math.min(sheetOffset("peek"), Math.max(0, st.o + e.clientY - st.y)); d.style.transform = `translateY(${st.cur}px)`; });
    const up = () => { if (!st) return; d.classList.remove("drag"); const proj = (st.cur ?? st.o) + st.v * 180; const best = ["full", "half", "peek"].reduce((a, b) => Math.abs(sheetOffset(b) - proj) < Math.abs(sheetOffset(a) - proj) ? b : a); st = null; setSnap(best); };
    g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSnap({ peek: "half", half: "full", full: "peek" }[d.dataset.snap]); } });
    addEventListener("resize", () => { if (!$("#drawer").hidden) setSnap(d.dataset.snap); });
  })();
  function renderStrip() {
    const el = $("#strip"); if (!S.data || S.tab) { el.hidden = true; return; }
    const list = S.data.quests.filter((q) => !S.orgOff.has(q.orgId) && q.myStatus !== "COMPLETED").sort((a, b) => b.rewardCredits - a.rewardCredits);
    el.hidden = !list.length;
    el.innerHTML = list.map((q) => { const o = orgOf(q.orgId); return `<button class="qcard" data-act="select" data-id="${q.id}" style="--c:${o.color}"><div class="t"><span>${CAT[q.category] || ""} ${esc(q.title)}</span></div><div class="o">${esc(o.name)}</div><div class="meta">${tagsOf(q)}</div></button>`; }).join("");
  }
  $("#strip").addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) requireLogin(() => select(b.dataset.id)); });

  // ---------- drawer ----------
  function openTab(tab) {
    if (tab === "map") { closeDrawer(); return; }
    S.tab = tab; renderDrawer(); renderMarkers(); renderStrip();
  }
  function closeDrawer() {
    S.tab = null; S.selected = null; $("#drawer").hidden = true; document.body.classList.remove("drawer-open");
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === "map"));
    renderMarkers(); renderStrip(); $("#drawer").style.transform = "";
    if (S.mapReady) window.RPGB_MAP.map.easeTo({ padding: { right: 0, bottom: 0, left: 0, top: 0 }, duration: 500 });
  }
  function select(id) {
    S.selected = id; S.tab = "quest"; renderDrawer(); renderMarkers(); renderStrip();
    const q = questOf(id);
    if (S.mapReady && q) {
      const small = innerWidth <= 700;
      window.RPGB_MAP.map.flyTo({ center: [q.lng, q.lat], zoom: Math.max(window.RPGB_MAP.map.getZoom(), 15.8), pitch: 60, duration: 1200,
        padding: small ? { bottom: Math.round(innerHeight * 0.45), top: 0, left: 0, right: 0 } : { right: 380, top: 0, bottom: 0, left: 0 } });
    }
  }
  $("#dClose").onclick = closeDrawer;
  $("#nav").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { requireLogin(() => openTab(b.dataset.tab)); } });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { if (!$("#modal").hidden) $("#modal").hidden = true; else closeDrawer(); } });

  function renderDrawer() {
    if (!S.data || !S.tab) return;
    const tab = S.tab;
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === (tab === "quest" ? "quests" : tab)));
    const wasHidden = $("#drawer").hidden; $("#drawer").hidden = false; document.body.classList.add("drawer-open");
    if (wasHidden || S.snapFor !== tab) { S.snapFor = tab; setSnap(tab === "quest" ? "half" : "full"); }
    $("#dTitle").textContent = TITLES[tab];
    const body = $("#dBody"); const scroll = body.scrollTop;
    body.innerHTML = { quests: vQuests, quest: vQuest, ranks: vRanks, store: vStore, people: vPeople, me: vMe }[tab]();
    body.scrollTop = scroll;
    if (tab === "people" && !S.people) loadPeople();
  }

  const tagsOf = (q) => `<span class="tag gold">🪙 +${q.rewardCredits}</span><span class="tag xp">⚡ ${q.rewardXp} xp</span><span class="tag">⏱ ${q.durationMin}m</span><span class="tag">👥 ${q.capacity > 1 ? q.spotsLeft + "/" + q.capacity + " spots" : "solo"}</span>`;
  const statusTag = (q) => q.myStatus === "COMPLETED" ? `<span class="tag ok">✓ done</span>` : q.myStatus === "ACCEPTED" ? `<span class="tag mine">accepted</span>` : q.myStatus === "CHECKED_IN" ? `<span class="tag mine">checked in</span>` : q.spotsLeft === 0 ? `<span class="tag">full</span>` : "";

  function vQuests() {
    const list = S.data.quests.filter((q) => !S.orgOff.has(q.orgId));
    const sorted = list.slice().sort((a, b) => (a.myStatus === "COMPLETED") - (b.myStatus === "COMPLETED") || b.rewardCredits - a.rewardCredits);
    return `<div class="fine" style="margin-bottom:8px">${list.length} quests · tap one to see it on the map. Org filters are at the top.</div>` +
      sorted.map((q) => { const o = orgOf(q.orgId); return `<button class="qcard" data-act="select" data-id="${q.id}" style="--c:${o.color}"><div class="t"><span>${CAT[q.category] || ""} ${esc(q.title)}</span>${statusTag(q)}</div><div class="o">${esc(o.name)} · ${esc(S.qDistrict[q.id] || "")}</div><div class="meta">${tagsOf(q)}</div></button>`; }).join("");
  }

  const navUrl = (q) => `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&travelmode=driving`;
  function vQuest() {
    const q = questOf(S.selected); if (!q) return `<button class="back" data-act="tab" data-tab="quests">← All quests</button><div class="fine">Quest not found.</div>`;
    const o = orgOf(q.orgId), st = q.myStatus;
    const stage = st === "COMPLETED" ? 3 : st === "CHECKED_IN" ? 2 : st === "ACCEPTED" ? 1 : 0;
    const steps = ["Accept", "Check in", "Complete"].map((t, i) => `<div class="${i < stage ? "done" : i === stage && stage < 3 ? "on" : ""}">${i < stage ? "✓ " : ""}${t}</div>`).join("");
    let action;
    if (st === "COMPLETED") action = `<div class="hint" style="color:var(--ok);border-color:rgba(61,220,151,.5);background:rgba(61,220,151,.08)">✓ Quest complete. Nice work!</div>`;
    else if (st === "ACCEPTED") action = `<div class="hint">Head to the site: ${esc(q.address)}. Then check in.</div><a class="btn primary navBtn" href="${navUrl(q)}" target="_blank" rel="noopener">🧭 Navigate in Google Maps</a><button class="btn" data-act="checkin">📍 I'm here: check in</button><button class="btn danger" data-act="abandon">Abandon quest</button>`;
    else if (st === "CHECKED_IN") action = `<div class="hint">Ask the host for the 4-digit code.${q.demoCode ? ` <b>Demo mode: host code is ${esc(q.demoCode)}</b>` : ""}</div><input id="codeIn" class="codeIn" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off"><button class="btn primary" data-act="complete">✅ Complete quest</button><button class="btn danger" data-act="abandon">Abandon quest</button>`;
    else action = q.spotsLeft === 0 ? `<button class="btn" disabled>Quest is full</button>` : `<button class="btn primary" data-act="accept">Accept quest and get directions</button>`;
    const party = q.party.length ? q.party.map((p) => `<span class="pm"><span>${esc(p.emoji)}</span>${esc(p.isMe ? "You" : p.name)}</span>`).join("") : `<span class="fine">Be the first to join.</span>`;
    return `<div class="qd" style="--c:${o.color}"><button class="back" data-act="tab" data-tab="quests">← All quests</button>
      <div class="org">${o.emoji || ""} ${esc(o.name)}</div><h3>${CAT[q.category] || ""} ${esc(q.title)}</h3>
      <div class="meta">${tagsOf(q)}<span class="tag">${"★".repeat(q.difficulty)}${"☆".repeat(5 - q.difficulty)}</span></div>
      <p>${esc(q.description)}</p><div class="fine">📍 ${esc(q.address)} · ${esc(S.qDistrict[q.id] || "")}</div>
      <div class="steps">${steps}</div>${action}
      <div class="sect">Party${q.capacity > 1 ? ` · ${q.spotsLeft} spot${q.spotsLeft === 1 ? "" : "s"} left` : ""}</div><div class="party">${party}</div>
      <div class="fine" style="margin-top:14px">Demo quest. ${esc(o.name)} has not endorsed this app.</div></div>`;
  }

  function vRanks() {
    const d = S.data;
    return d.leaderboard.map((r) => `<div class="lb ${r.isMe ? "me" : ""}"><span class="rk">${r.rank}</span><span class="em">${esc(r.emoji)}</span><div class="grow"><b>${esc(r.name)}${r.isMe ? " (you)" : ""}</b><div class="fine">${esc(d.classEmoji[r.klass] || "")} ${esc(r.klass)} · Lv ${r.level}</div></div><span class="xpv">${r.xp.toLocaleString()} xp</span></div>`).join("") +
      (d.myRank && d.myRank > d.leaderboard.length ? `<div class="fine" style="margin-top:8px">You're #${d.myRank}. Complete a quest to climb!</div>` : "") +
      `<div class="fine" style="margin-top:10px">Other adventurers are demo characters.</div>`;
  }

  function vStore() {
    const d = S.data, cr = d.me.credits;
    const bySponsor = {}; d.offers.forEach((o) => (bySponsor[o.sponsor] = bySponsor[o.sponsor] || []).push(o));
    const offers = Object.entries(bySponsor).map(([s, list]) => `<div class="sect">${esc(s)}</div>` + list.map((o) => `<div class="offer"><span class="em">${esc(o.emoji)}</span><div class="grow"><b>${esc(o.title)}</b><div class="fine">${esc(o.description)} · ${o.stock} left</div></div>${o.stock <= 0 ? `<button class="btn sm" disabled>Sold out</button>` : cr >= o.cost ? `<button class="btn sm primary" data-act="redeem" data-id="${o.id}">🪙 ${o.cost}</button>` : `<button class="btn sm" disabled title="Need ${o.cost - cr} more">🪙 ${o.cost}</button>`}</div>`).join("")).join("");
    const causes = d.causes.map((c) => { const pct = Math.min(100, Math.round((c.raised / c.goal) * 100)); const o = orgOf(c.orgId); return `<div class="cause" style="border-left:3px solid ${o.color}"><b>${esc(c.title)}</b><div class="fine">${esc(o.name)} · ${esc(c.description)}</div><div class="prog"><i style="width:${pct}%"></i></div><div class="row"><span class="fine grow">${c.raised}/${c.goal} credits (${pct}%)</span>${[10, 25, 50].map((n) => `<button class="btn sm" data-act="donate" data-id="${c.id}" data-n="${n}" ${cr < n ? "disabled" : ""}>+${n}</button>`).join("")}</div></div>`; }).join("");
    const reds = d.redemptions.length ? `<div class="sect">My reward codes</div>` + d.redemptions.map((r) => `<div class="ledger"><span>${esc(r.title)} <span class="fine">@ ${esc(r.sponsor)}</span></span><span class="codeBox">${esc(r.code)}</span></div>`).join("") : "";
    return `<div class="row"><b class="coin">🪙 ${cr} credits</b><span class="fine grow" style="text-align:right">Earn more by finishing quests</span></div>` +
      `<div class="sect">Rewards from local sponsors</div>${offers}<div class="sect" style="margin-top:18px">Donate your credits</div>${causes}${reds}<div class="fine" style="margin-top:10px">Demo: sponsors and rewards are fictional.</div>`;
  }

  async function loadPeople() { try { S.people = await api("GET", "people"); } catch (e) { S.people = []; } if (S.tab === "people") renderDrawer(); }
  function vPeople() {
    if (!S.people) return `<div class="fine">Finding adventurers like you…</div>`;
    return `<div class="fine" style="margin-bottom:8px">Matched on shared interests and quests. Pick interests on the Me tab to improve matches.</div>` +
      S.people.map((p) => `<div class="lb"><span class="em">${esc(p.emoji)}</span><div class="grow"><b>${esc(p.name)}</b> <span class="fine">${esc(S.data.classEmoji[p.klass] || "")} Lv ${p.level}</span><div class="fine">${esc(p.reason)}</div></div></div>`).join("") + `<div class="fine" style="margin-top:10px">Demo: these adventurers are fictional.</div>`;
  }

  function vMe() {
    const me = S.data.me, d = S.data, have = new Set(me.badges.map((b) => b.slug));
    return `<div class="profHead"><div class="big">${esc(me.avatarEmoji)}</div><h3 style="margin:6px 0 0">${esc(me.name)}</h3><div class="muted">${me.emoji} ${esc(me.klass)} · Level ${me.level}</div>
      <div class="bar" style="margin:8px 20px 2px"><i style="width:${me.pct}%"></i></div><div class="fine">${me.xpIntoLevel}/${me.xpForNext} xp to level ${me.level + 1}</div></div>
      <div class="meta" style="justify-content:center"><span class="tag gold">🪙 ${me.credits}</span><span class="tag">✅ ${me.stats.questsCompleted} quests</span><span class="tag">🏛 ${me.stats.orgsHelped} orgs</span><span class="tag">💛 ${me.stats.creditsDonated} donated</span></div>
      <div class="sect">Badges</div><div class="badges">${d.badgeDefs.map((b) => `<div class="badge ${have.has(b.slug) ? "" : "locked"}" title="${esc(b.description)}"><span class="ic">${b.icon}</span>${esc(b.name)}</div>`).join("")}</div>
      <div class="sect">Interests</div><div class="chipRow">${INTERESTS.map(([s, l]) => `<button class="chip ${me.interests.includes(s) ? "on" : "off"}" data-act="interest" data-slug="${s}">${l}</button>`).join("")}</div>
      <div class="sect">Recent activity</div>${d.ledger.map((l) => `<div class="ledger"><span>${esc(l.note)}</span><span class="${l.delta >= 0 ? "pos" : "neg"}">${l.delta >= 0 ? "+" : ""}${l.delta}</span></div>`).join("") || `<div class="fine">Nothing yet.</div>`}
      <button class="btn ghost" data-act="logout" style="margin-top:16px">Sign out</button>`;
  }

  // ---------- actions ----------
  $("#dBody").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]"); if (!b || S.busy) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === "select") return select(id);
    if (act === "tab") { S.tab = b.dataset.tab; S.selected = null; renderDrawer(); renderMarkers(); return; }
    if (act === "logout") { try { localStorage.removeItem("rpgb-token"); } catch (e2) {} location.reload(); return; }
    if (act === "interest") {
      const set = new Set(S.data.me.interests); set.has(b.dataset.slug) ? set.delete(b.dataset.slug) : set.add(b.dataset.slug);
      S.data.me.interests = [...set]; S.people = null; renderDrawer(); api("POST", "profile", { interests: [...set] }).catch(() => {}); return;
    }
    S.busy = true; b.disabled = true;
    let navWin = null;
    // open the tab synchronously (popup blockers), then point it at directions once the accept succeeds
    if (act === "accept") { try { navWin = window.open("", "_blank"); } catch (e3) {} }
    try {
      if (["accept", "checkin", "abandon"].includes(act)) {
        await api("POST", `quests/${S.selected}/${act}`, {});
        if (navWin) { const q0 = questOf(S.selected); navWin.location.href = navUrl(q0); navWin = null; }
        await refresh(); toast({ accept: "Quest accepted! Head to the site.", checkin: "Checked in. Get to work!", abandon: "Quest abandoned." }[act]);
      } else if (act === "complete") {
        const r = await api("POST", `quests/${S.selected}/complete`, { code: ($("#codeIn") || {}).value || "" });
        await refresh(); S.people = null; celebrate(r, questOf(S.selected));
      } else if (act === "redeem") {
        const r = await api("POST", "redeem", { offerId: id }); await refresh();
        modal(`<div class="celebrate"><div class="big">🎁</div><h2>${esc(r.title)}</h2><div class="muted">${esc(r.sponsor)}</div><div class="hint">Show this code to redeem:<br><span class="codeBox" style="font-size:22px">${esc(r.code)}</span></div><button class="btn primary" data-close>Done</button></div>`);
      } else if (act === "donate") {
        const r = await api("POST", "donate", { causeId: id, amount: Number(b.dataset.n) }); await refresh(); toast(`💛 Donated ${r.amount} credits to “${r.title}”. Thank you!`);
      }
    } catch (err) {
      if (navWin) navWin.close();
      toast(err.message, true);
      if (err.code === "UNAUTHENTICATED") showLogin();
      else await refresh().catch(() => {});
    } finally { S.busy = false; }
  });

  function celebrate(r, q) {
    const badges = r.newBadges.map((b) => `<div class="tag gold" style="margin:3px">${b.icon} ${esc(b.name)}</div>`).join("");
    modal(`<div class="celebrate"><div class="big">🎉</div><h2>Quest complete!</h2><div class="muted">${esc(q ? q.title : "")}</div>
      <div class="earn">+${r.earned.credits} 🪙 &nbsp; +${r.earned.xp} ⚡</div>
      ${r.levelUp ? `<div class="lvup">LEVEL UP · ${r.level}</div>` : ""}${badges ? `<div class="sect">New badges</div><div>${badges}</div>` : ""}
      <div class="fine" style="margin:8px 0">You're now a ${r.klassEmoji} ${esc(r.klass)}.</div>
      <button class="btn primary" data-close>Keep exploring</button><button class="btn ghost" id="seeRanks">See leaderboard 🏆</button></div>`);
    const sr = $("#seeRanks"); if (sr) sr.onclick = () => { $("#modal").hidden = true; openTab("ranks"); };
  }

  // ---------- login ----------
  function showLogin() { $("#login").hidden = false; }
  function requireLogin(fn) { if (S.data && S.data.me) fn(); else showLogin(); }
  const selInterests = new Set();
  $("#lgInterests").innerHTML = INTERESTS.map(([s, l]) => `<button type="button" class="chip off" data-slug="${s}">${l}</button>`).join("");
  $("#lgInterests").addEventListener("click", (e) => { const b = e.target.closest("[data-slug]"); if (!b) return; const s = b.dataset.slug; selInterests.has(s) ? selInterests.delete(s) : selInterests.add(s); b.classList.toggle("on", selInterests.has(s)); b.classList.toggle("off", !selInterests.has(s)); });
  async function doLogin(name, email) {
    $("#lgErr").textContent = "";
    try {
      const r = await api("POST", "login", { name, email, interests: [...selInterests] });
      S.token = r.token; try { localStorage.setItem("rpgb-token", r.token); } catch (e) {}
      await refresh(); $("#login").hidden = true; toast(`Welcome, ${S.data.me.name}! You start with ${S.data.me.credits} credits. Pick a quest.`);
      openTab("quests");
    } catch (e) { $("#lgErr").textContent = e.message; }
  }
  $("#loginForm").addEventListener("submit", (e) => { e.preventDefault(); doLogin($("#lgName").value, $("#lgEmail").value); });
  $("#lgDemo").onclick = () => doLogin("Alex", "demo@rpgbirmingham.app");

  // ---------- boot ----------
  async function refresh() {
    S.data = await api("GET", "bootstrap");
    computeDistricts(); renderHud(); renderChips(); renderMarkers(); renderStrip(); renderDrawer();
    if (S.data.backend === "memory") $("#msg").textContent = "demo data (in-memory)"; else $("#msg").textContent = "";
    return S.data;
  }
  window.addEventListener("rpgb-map-ready", () => { S.mapReady = true; if (S.data) { computeDistricts(); renderMarkers(); } });
  (async function boot() {
    try { await refresh(); } catch (e) { $("#msg").textContent = "Can't reach the server: " + e.message; return; }
    if (!S.data.me) showLogin(); else { $("#login").hidden = true; }
  })();
})();
