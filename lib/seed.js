// Demo seed data. Everything here is FICTIONAL demo content: the four partner organizations have not
// endorsed this app, quest sites/coordinates are approximate placeholders, and NPC adventurers are fake.
const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const reward = (dur, diff) => round5((dur / 15) * 5 * (0.8 + 0.2 * diff));

const orgs = [
  { id: "promise", name: "Birmingham Promise", emoji: "🎓", color: "#f5c542",
    description: "Education and career pathways for Birmingham students. (demo listing)" },
  { id: "firehouse", name: "Firehouse Ministries", emoji: "🔥", color: "#ff5d6c",
    description: "Meals, shelter and support for neighbors experiencing homelessness. (demo listing)" },
  { id: "farm", name: "Jones Valley Teaching Farm", emoji: "🌱", color: "#7ee26a",
    description: "Urban farms and food education for students and neighbors. (demo listing)" },
  { id: "edfarm", name: "Ed Farm", emoji: "💡", color: "#4c8dff",
    description: "Technology and digital-skills programs for educators and learners. (demo listing)" },
];

// category: education | food | farm | tech | seniors | community
const q = (id, org_id, title, description, category, tags, lat, lng, address, difficulty, duration_min, capacity, verify_code) => ({
  id, org_id, title, description, category, tags, lat, lng, address, difficulty, duration_min, capacity,
  verify_code: "1234", // demo: every quest uses the same host code
  reward_credits: reward(duration_min, difficulty), reward_xp: reward(duration_min, difficulty) * 2,
});

const quests = [
  // Birmingham Promise
  q("bp-homework", "promise", "Homework Help Hour", "Sit with a student, work through math or reading together, and be a friendly face after school.", "education", "teaching,community", 33.5131, -86.8110, "Downtown Birmingham (demo site)", 1, 60, 4, "1111"),
  q("bp-resume", "promise", "Résumé Rally", "Help graduating seniors polish résumés and practice a 60-second intro. No experience needed, just kindness.", "education", "teaching,tech", 33.5030, -86.8040, "Southside, near campus (demo site)", 2, 90, 3, "1212"),
  q("bp-tour", "promise", "Campus Tour Guide Squad", "Walk first-gen students around campus and answer their 'what's it really like?' questions.", "education", "teaching,outdoors", 33.4985, -86.8075, "UAB area (demo site)", 1, 45, 5, "1313"),
  q("bp-scholar", "promise", "Scholarship Night Setup", "Set up tables, greet families and keep the snacks flowing for the big scholarship night.", "community", "community,food", 33.5190, -86.8030, "Downtown Birmingham (demo site)", 2, 120, 6, "1414"),
  // Firehouse Ministries
  q("fh-meal", "firehouse", "Serve a Hot Meal", "Join the serving line, say hello to every neighbor, and help clean up. The warmest 90 minutes in town.", "food", "food,community", 33.5180, -86.8140, "Near Kelly Ingram Park (demo site)", 2, 90, 5, "2121"),
  q("fh-closet", "firehouse", "Sort the Clothing Closet", "Sort and shelve donated coats, shoes and basics so people can find what fits.", "community", "community", 33.5205, -86.8090, "Downtown Birmingham (demo site)", 1, 60, 4, "2222"),
  q("fh-kits", "firehouse", "Pack Hygiene Kits", "Assembly line for 200 hygiene kits. Music on, good company guaranteed.", "community", "community,music", 33.5155, -86.8180, "Downtown West (demo site)", 1, 45, 6, "2323"),
  q("fh-table", "firehouse", "Share a Meal, Share a Story", "Eat dinner with guests and just talk. Connection is the whole quest. Great if you live alone.", "food", "food,seniors,community", 33.5170, -86.8105, "Downtown Birmingham (demo site)", 1, 60, 8, "2424"),
  // Jones Valley Teaching Farm
  q("jv-workday", "farm", "Downtown Farm Workday", "Weed, mulch and plant alongside farm staff and neighbors. Gloves and good vibes provided.", "farm", "gardening,outdoors", 33.5240, -86.7960, "Downtown farm (demo site)", 2, 120, 8, "3131"),
  q("jv-harvest", "farm", "Harvest & Wash", "Pick, wash and bundle produce for school kitchens and neighbors.", "farm", "gardening,food", 33.5232, -86.7985, "Downtown farm (demo site)", 1, 60, 6, "3232"),
  q("jv-seeds", "farm", "Seed Starting Station", "Quick win: start seed trays for the next planting. Dirty hands, happy heart.", "farm", "gardening", 33.5218, -86.8002, "Downtown farm (demo site)", 1, 30, 4, "3333"),
  q("jv-class", "farm", "Farm-to-Classroom Helper", "Assist a teacher with a hands-on lesson about growing and cooking real food.", "education", "teaching,gardening,food", 33.5262, -86.7915, "Near Avondale (demo site)", 2, 90, 3, "3434"),
  // Ed Farm
  q("ef-refurb", "edfarm", "Device Refurb Day", "Wipe, update and box laptops that will go to students who need them.", "tech", "tech,community", 33.5148, -86.7893, "Innovation district (demo site)", 2, 120, 6, "4141"),
  q("ef-seniors", "edfarm", "Teach a Neighbor Smartphones", "One-on-one: help an older neighbor with video calls, photos and staying in touch.", "seniors", "seniors,tech,teaching", 33.5060, -86.7945, "Five Points area (demo site)", 1, 75, 3, "4242"),
  q("ef-code", "edfarm", "Code Club Mentor", "Help middle schoolers build their first tiny game. You'll learn more than they do.", "tech", "tech,teaching", 33.5090, -86.8220, "West Birmingham (demo site)", 3, 90, 4, "4343"),
  q("ef-lab", "edfarm", "Digital Skills Open Lab", "Drop-in help for adults learning email, forms and online job applications.", "tech", "tech,community,seniors", 33.5300, -86.8200, "North Birmingham (demo site)", 2, 60, 4, "4444"),
];

quests.push(...require("./seed_more")(q)); // neighborhood quests outside downtown
quests.push(...require("./seed_districts")(q)); // at least one quest in every neighborhood

const offers = [
  { id: "of-coffee", sponsor_name: "Southside Coffee Co.", emoji: "☕", title: "Free drip coffee", description: "One medium drip, any day.", cost_credits: 20, stock: 100 },
  { id: "of-pastry", sponsor_name: "Southside Coffee Co.", emoji: "🥐", title: "Coffee + pastry combo", description: "Any coffee and a fresh pastry.", cost_credits: 45, stock: 60 },
  { id: "of-book", sponsor_name: "Five Points Books", emoji: "📚", title: "$5 off any book", description: "Valid on any paperback.", cost_credits: 35, stock: 80 },
  { id: "of-book2", sponsor_name: "Five Points Books", emoji: "📖", title: "Free used book", description: "Pick one from the Magic City shelf.", cost_credits: 60, stock: 40 },
  { id: "of-taco", sponsor_name: "Taqueria Magica", emoji: "🌮", title: "Taco Tuesday for two", description: "Two taco plates, Tuesdays only.", cost_credits: 90, stock: 30 },
  { id: "of-scoop", sponsor_name: "Vulcan Scoops", emoji: "🍦", title: "Double scoop", description: "Any two flavors in a waffle cone.", cost_credits: 40, stock: 50 },
  { id: "of-climb", sponsor_name: "Red Mountain Climbing", emoji: "🧗", title: "Day pass", description: "Full-day climbing pass with gear.", cost_credits: 120, stock: 20 },
];

const causes = [
  { id: "c-meals", org_id: "firehouse", title: "Warm Meals Fund", description: "Credits become meals served at Firehouse Ministries.", goal_credits: 800, raised_credits: 410 },
  { id: "c-laptops", org_id: "edfarm", title: "Laptops for Learners", description: "Help put refurbished laptops in students' hands.", goal_credits: 1000, raised_credits: 560 },
  { id: "c-farm", org_id: "farm", title: "Plant a School Garden", description: "Seeds, soil and tools for a new school garden.", goal_credits: 500, raised_credits: 190 },
  { id: "c-promise", org_id: "promise", title: "Promise Scholarship Pool", description: "A little boost toward a student's first semester.", goal_credits: 1000, raised_credits: 330 },
];

const npcs = [
  ["Maya R.", "🌻", 1180, "gardening,food"], ["Devon T.", "🧑‍💻", 960, "tech,teaching"], ["Priya S.", "📚", 870, "teaching,community"],
  ["Marcus J.", "🔨", 790, "tech,outdoors"], ["Ellie W.", "🍞", 700, "food,community"], ["Tomás G.", "🌿", 610, "gardening,outdoors"],
  ["June H.", "💚", 540, "seniors,community"], ["Sam K.", "🎸", 450, "music,community"], ["Rosa M.", "🌮", 380, "food,seniors"],
  ["Ben A.", "🧭", 300, "outdoors,tech"], ["Nia L.", "🎨", 220, "teaching,music"], ["Walt P.", "🧓", 150, "seniors,gardening"],
].map(([name, emoji, xp, interests], i) => ({
  id: "npc-" + (i + 1), email: `npc${i + 1}@demo.rpgbirmingham.app`, name, emoji, xp, credits: Math.round(xp / 6),
  interests, is_npc: true, klass: ["scout", "builder", "teacher", "builder", "keeper", "scout", "healer", "bard", "keeper", "wanderer", "teacher", "healer"][i],
}));

// A few fake adventurers already signed up for group quests so parties aren't empty.
const npcParticipations = [
  ["bp-homework", "npc-3"], ["bp-homework", "npc-11"], ["fh-meal", "npc-5"], ["fh-meal", "npc-7"], ["fh-meal", "npc-9"],
  ["fh-table", "npc-7"], ["fh-table", "npc-12"], ["jv-workday", "npc-1"], ["jv-workday", "npc-6"], ["jv-workday", "npc-12"],
  ["jv-harvest", "npc-1"], ["ef-refurb", "npc-2"], ["ef-refurb", "npc-4"], ["ef-seniors", "npc-9"], ["ef-code", "npc-2"],
].map(([quest_id, user_id]) => ({ quest_id, user_id, status: "ACCEPTED" }));


// ---- schedule ------------------------------------------------------------------------------
// Dates are relative to "today in Birmingham" so the demo always has events today, tomorrow and later.
// Stored as floating local date + HH:MM (no timezone math). The DB doesn't hold them: they derive from the quest id.
const TZ = "America/Chicago";
const chicagoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const addDays = (ymd, n) => { const [y, m, d] = ymd.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); };
// [dayOffset, "HH:MM"] for the headline quests (two of them deliberately overlap today so the rule is easy to demo)
const FIXED = {
  "bp-homework": [0, "10:00"], "fh-meal": [0, "10:30"], "ef-refurb": [0, "14:00"], "jv-harvest": [0, "16:30"],
  "bp-resume": [1, "13:00"], "jv-workday": [1, "09:00"], "ef-seniors": [2, "13:00"], "ef-code": [3, "15:00"], "fh-table": [2, "18:00"],
};
const OFFSETS = [0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14];
const HOURS = ["09:00", "10:00", "11:00", "13:00", "14:00", "16:00", "17:30"];
function scheduleFor(id, today = chicagoToday()) {
  let [off, time] = FIXED[id] || [null, null];
  if (off === null) {
    let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    off = OFFSETS[h % OFFSETS.length]; time = HOURS[(h >>> 5) % HOURS.length];
  }
  return { date: addDays(today, off), time };
}
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
/** true when two scheduled quests overlap in time on the same date */
function overlaps(a, durA, b, durB) {
  if (a.date !== b.date) return false;
  const s1 = toMin(a.time), e1 = s1 + durA, s2 = toMin(b.time), e2 = s2 + durB;
  return s1 < e2 && s2 < e1;
}

module.exports = { orgs, quests, offers, causes, npcs, npcParticipations, scheduleFor, chicagoToday, overlaps };
