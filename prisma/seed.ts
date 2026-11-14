/* Idempotent seed: wipes everything (FK order) and recreates the Birmingham demo world.
 * All data is invented for the demo; no real organization endorses anything here. */
import { PrismaClient } from '@prisma/client';
import { badgesEarned, computeReward, deriveClass, levelFromXp } from '../lib/domain';
import { CLASS_META } from '../lib/constants';
import type { AvatarClass, Category } from '../lib/contracts';

const db = new PrismaClient();
const DAY = 86400000;

const INTERESTS = [
  ['animals', 'Animals', '🐶'], ['parks', 'Parks', '🌳'], ['food', 'Food', '🍲'], ['teaching', 'Teaching', '📚'],
  ['art', 'Art', '🎨'], ['history', 'History', '🏛️'], ['gardening', 'Gardening', '🌱'], ['seniors', 'Seniors', '🧓'],
  ['fitness', 'Fitness', '💪'], ['music', 'Music', '🎵'], ['tech', 'Tech', '💻'], ['cleanups', 'Cleanups', '🧹'],
] as const;

const BADGES = [
  ['first-steps', 'First Steps', '👣', 'Complete your first quest'],
  ['regular', 'Regular', '⭐', 'Complete 5 quests'],
  ['explorer', 'Explorer', '🗺️', 'Complete quests in 3 different neighborhoods'],
  ['patron', 'Patron', '💛', 'Donate credits to a cause'],
  ['team-player', 'Team Player', '🤝', 'Complete a group quest'],
  ['chain-breaker', 'Chain Breaker', '⛓️', 'Complete every step of a quest chain'],
] as const;

const ORGS = [
  { key: 'rail', name: 'Railroad Park Foundation', kind: 'nonprofit', emoji: '🚂', lat: 33.5116, lng: -86.8128, hood: 'Downtown', desc: 'Keeps the big green strip through downtown clean and lively.' },
  { key: 'bot', name: 'Birmingham Botanical Society', kind: 'nonprofit', emoji: '🌺', lat: 33.489, lng: -86.777, hood: 'Highland Park', desc: 'Tends gardens and teaches folks to grow things.' },
  { key: 'kelly', name: 'Kelly Ingram Park Friends', kind: 'neighbor', emoji: '🕊️', lat: 33.5164, lng: -86.8143, hood: 'Downtown', desc: 'Neighbors caring for a historic downtown park.' },
  { key: 'sloss', name: 'Sloss Furnaces Volunteers', kind: 'nonprofit', emoji: '🏭', lat: 33.5136, lng: -86.7923, hood: 'Lakeview', desc: 'Volunteers helping steward an iron-age landmark.' },
  { key: 'avon', name: 'Avondale Community Garden', kind: 'neighbor', emoji: '🥕', lat: 33.5222, lng: -86.7692, hood: 'Avondale', desc: 'A neighborhood garden growing food and friendships.' },
  { key: 'wood', name: 'Woodlawn Foundation', kind: 'nonprofit', emoji: '🏘️', lat: 33.5504, lng: -86.7634, hood: 'Woodlawn', desc: 'Neighbors investing in murals, seniors and youth.' },
  { key: 'humane', name: 'Greater Birmingham Humane Society', kind: 'nonprofit', emoji: '🐕', lat: 33.501, lng: -86.795, hood: 'Five Points South', desc: 'Shelter caring for dogs, cats and the people who love them.' },
  { key: 'meals', name: 'Magic City Meals', kind: 'nonprofit', emoji: '🍽️', lat: 33.505, lng: -86.8, hood: 'Southside', desc: 'Food bank and community kitchen.' },
] as const;
type OrgKey = (typeof ORGS)[number]['key'];

interface QuestSeed {
  n: number; title: string; desc: string; org: OrgKey; cat: Category; tags: string[];
  lat: number; lng: number; hood: string; addr: string; diff: number; dur: number; cap: number; code: string;
  chain?: number;
}
const QUESTS: QuestSeed[] = [
  { n: 1, title: 'Dog Day at the Shelter', desc: 'Walk, play with and socialize shelter dogs so they are ready for forever homes. Great with friends.', org: 'humane', cat: 'animals', tags: ['animals'], lat: 33.5014, lng: -86.7958, hood: 'Five Points South', addr: '20th St S (demo)', diff: 1, dur: 90, cap: 6, code: '1111' },
  { n: 2, title: 'Kitten Socializing Hour', desc: 'Cuddle and play with shy kittens for an hour.', org: 'humane', cat: 'animals', tags: ['animals'], lat: 33.5008, lng: -86.7942, hood: 'Five Points South', addr: 'Cat Room, 20th St S (demo)', diff: 1, dur: 40, cap: 1, code: '2222' },
  { n: 3, title: 'Sloss Spring Cleanup', desc: 'Clear brush and litter around the historic furnaces.', org: 'sloss', cat: 'cleanup', tags: ['cleanups', 'history', 'parks'], lat: 33.5136, lng: -86.7923, hood: 'Lakeview', addr: '32nd St N (demo)', diff: 2, dur: 120, cap: 8, code: '3333' },
  { n: 4, title: 'Furnace Tour Helper', desc: 'Help greet visitors and hand out maps.', org: 'sloss', cat: 'education', tags: ['history', 'teaching'], lat: 33.5142, lng: -86.7915, hood: 'Lakeview', addr: 'Visitor Center (demo)', diff: 2, dur: 90, cap: 2, code: '4444' },
  { n: 5, title: 'Meal Prep Brigade', desc: 'Chop, pack and label meals for neighbors in need.', org: 'meals', cat: 'food', tags: ['food'], lat: 33.5052, lng: -86.8008, hood: 'Southside', addr: 'Community Kitchen (demo)', diff: 1, dur: 120, cap: 6, code: '5555' },
  { n: 6, title: 'Pantry Shelf Stocking', desc: 'Sort donations and stock the pantry shelves.', org: 'meals', cat: 'food', tags: ['food'], lat: 33.5046, lng: -86.7995, hood: 'Southside', addr: 'Pantry Door B (demo)', diff: 1, dur: 60, cap: 3, code: '6666' },
  { n: 7, title: 'Railroad Park Litter Sweep', desc: 'A quick lap with a grabber and a bag.', org: 'rail', cat: 'cleanup', tags: ['parks', 'cleanups'], lat: 33.5116, lng: -86.8128, hood: 'Downtown', addr: 'Railroad Park, main lawn (demo)', diff: 1, dur: 30, cap: 1, code: '7777' },
  { n: 8, title: 'Lawn Games Setup', desc: 'Set out cornhole and ladder golf for the weekend crowd.', org: 'rail', cat: 'community', tags: ['parks', 'fitness'], lat: 33.511, lng: -86.811, hood: 'Downtown', addr: 'Railroad Park, east lawn (demo)', diff: 2, dur: 90, cap: 4, code: '8888' },
  { n: 9, title: 'Kelly Ingram Garden Tidy', desc: 'Weed and mulch the memorial beds.', org: 'kelly', cat: 'environment', tags: ['parks', 'history', 'gardening'], lat: 33.5164, lng: -86.8143, hood: 'Downtown', addr: '16th St N (demo)', diff: 2, dur: 60, cap: 3, code: '9999' },
  { n: 10, title: 'Memorial Storytellers', desc: 'Share the park\'s history with visitors.', org: 'kelly', cat: 'education', tags: ['history', 'teaching'], lat: 33.517, lng: -86.813, hood: 'Downtown', addr: 'Park gate (demo)', diff: 2, dur: 60, cap: 2, code: '1010' },
  { n: 11, title: 'Botanical Plant Labels', desc: 'Make and place new plant labels.', org: 'bot', cat: 'education', tags: ['gardening', 'teaching'], lat: 33.489, lng: -86.777, hood: 'Highland Park', addr: 'Garden Gate 2 (demo)', diff: 1, dur: 60, cap: 2, code: '1212' },
  { n: 12, title: 'Greenhouse Helper', desc: 'Pot seedlings and tidy the greenhouse.', org: 'bot', cat: 'environment', tags: ['gardening', 'parks'], lat: 33.4885, lng: -86.7785, hood: 'Highland Park', addr: 'Greenhouse (demo)', diff: 2, dur: 90, cap: 3, code: '1313' },
  { n: 13, title: 'Clear the Beds', desc: 'Step 1 of Restore Avondale Park: pull weeds and clear old growth.', org: 'avon', cat: 'environment', tags: ['gardening'], lat: 33.5222, lng: -86.7692, hood: 'Avondale', addr: '41st Ave S (demo)', diff: 2, dur: 60, cap: 4, code: '1414', chain: 1 },
  { n: 14, title: 'Plant the Rows', desc: 'Step 2 of Restore Avondale Park: plant seedlings in neat rows.', org: 'avon', cat: 'environment', tags: ['gardening'], lat: 33.5226, lng: -86.7685, hood: 'Avondale', addr: '41st Ave S (demo)', diff: 2, dur: 60, cap: 4, code: '1515', chain: 2 },
  { n: 15, title: 'Paint the Fence', desc: 'Step 3 of Restore Avondale Park: give the fence a fresh coat.', org: 'avon', cat: 'arts', tags: ['art'], lat: 33.5219, lng: -86.7699, hood: 'Avondale', addr: '41st Ave S (demo)', diff: 1, dur: 60, cap: 4, code: '1616', chain: 3 },
  { n: 16, title: 'Porch Visit & Tea', desc: 'Chat with a neighbor over tea. Easy and heartwarming.', org: 'avon', cat: 'seniors', tags: ['seniors'], lat: 33.5238, lng: -86.7712, hood: 'Avondale', addr: 'Porch on 4th Ave (demo)', diff: 1, dur: 45, cap: 1, code: '1717' },
  { n: 17, title: 'Senior Center Tech Help', desc: 'Help seniors with phones, video calls and email.', org: 'wood', cat: 'seniors', tags: ['seniors', 'tech', 'teaching'], lat: 33.55, lng: -86.764, hood: 'Woodlawn', addr: 'Senior Center (demo)', diff: 1, dur: 60, cap: 2, code: '1818' },
  { n: 18, title: 'Woodlawn Mural Brigade', desc: 'Paint a community mural with local artists.', org: 'wood', cat: 'arts', tags: ['art', 'music'], lat: 33.5508, lng: -86.7628, hood: 'Woodlawn', addr: '1st Ave N (demo)', diff: 3, dur: 120, cap: 5, code: '1919' },
  { n: 19, title: 'Ensley Mural Touch-up', desc: 'Refresh a faded mural on a neighborhood wall.', org: 'wood', cat: 'arts', tags: ['art'], lat: 33.512, lng: -86.88, hood: 'Ensley', addr: 'Ave E (demo)', diff: 2, dur: 90, cap: 4, code: '2020' },
];

const SPONSORS = [
  { name: 'Magic City Beans', emoji: '☕', desc: 'Neighborhood coffee shop (demo)', lat: 33.5185, lng: -86.8089, offers: [['Free drip coffee', 'Any size, any time', 20], ['Latte + pastry', 'Treat yourself', 45]] },
  { name: 'Red Mountain Books', emoji: '📖', desc: 'Indie bookstore (demo)', lat: 33.5, lng: -86.795, offers: [['$5 off any book', 'One per visit', 30], ['Canvas tote bag', 'Locally printed', 60]] },
  { name: 'Taco Vulcan', emoji: '🌮', desc: 'Taco spot (demo)', lat: 33.5051, lng: -86.8033, offers: [['Free taco', 'Your choice', 25], ['Taco combo', '3 tacos + drink', 70]] },
  { name: 'Iron City Climbing', emoji: '🧗', desc: 'Climbing gym (demo)', lat: 33.5105, lng: -86.7905, offers: [['Day pass', 'Climb all day', 80], ['Gear rental', 'Shoes + harness', 35]] },
  { name: 'Birdie\'s Ice Cream', emoji: '🍦', desc: 'Scoop shop (demo)', lat: 33.5022, lng: -86.7968, offers: [['Single scoop', 'Any flavor', 20], ['Banana split', 'Share it (or not)', 120]] },
] as const;

const CAUSES: [OrgKey, string, string, number, number][] = [
  ['avon', 'New Playground at Avondale Park', 'Fund new play equipment for neighborhood kids (demo).', 800, 310],
  ['meals', 'Fill the Food Pantry', 'Stock the shelves for the winter months (demo).', 500, 420],
  ['humane', 'Shelter Dog Winter Beds', 'Warm beds for every shelter dog (demo).', 300, 90],
  ['rail', 'Shade Trees for Railroad Park', 'Plant a grove along the main lawn (demo).', 1000, 250],
];

interface NpcSeed { name: string; interests: string[]; done: number[]; active?: number[]; donated?: number }
const NPCS: NpcSeed[] = [
  { name: 'Maya', interests: ['animals', 'parks', 'gardening'], done: [2, 5], active: [1] },
  { name: 'Jordan', interests: ['animals', 'gardening', 'parks', 'fitness'], done: [9, 12, 13], active: [1] },
  { name: 'Sam', interests: ['animals', 'cleanups', 'history'], done: [3, 6], active: [1], donated: 15 },
  { name: 'Priya', interests: ['teaching', 'history', 'gardening'], done: [4, 10, 11] },
  { name: 'Chris', interests: ['art', 'music', 'parks'], done: [18, 19] },
  { name: 'Dee', interests: ['seniors', 'tech', 'teaching'], done: [17, 12] },
  { name: 'Marcus', interests: ['fitness', 'cleanups', 'parks'], done: [7, 8, 3] },
  { name: 'Lena', interests: ['food', 'animals', 'seniors'], done: [16, 6, 5], donated: 20 },
  { name: 'Tom', interests: ['tech', 'music', 'fitness'], done: [17, 19] },
  { name: 'Rosa', interests: ['gardening', 'parks', 'art'], done: [13, 14, 15] },
  { name: 'Ben', interests: ['history', 'teaching', 'art'], done: [9, 10, 4] },
  { name: 'Ava', interests: ['animals', 'food', 'parks'], done: [8, 6], active: [1] },
];

async function main() {
  // wipe in FK order
  await db.userBadge.deleteMany(); await db.donation.deleteMany(); await db.redemption.deleteMany();
  await db.ledgerEntry.deleteMany(); await db.participation.deleteMany(); await db.userInterest.deleteMany();
  await db.user.deleteMany(); await db.quest.deleteMany(); await db.questChain.deleteMany();
  await db.cause.deleteMany(); await db.offer.deleteMany(); await db.sponsor.deleteMany();
  await db.org.deleteMany(); await db.badge.deleteMany(); await db.interest.deleteMany();

  for (const [slug, label, emoji] of INTERESTS) await db.interest.create({ data: { slug, label, emoji } });
  for (const [slug, name, icon, description] of BADGES) await db.badge.create({ data: { slug, name, icon, description } });
  const interestId = Object.fromEntries((await db.interest.findMany()).map((i) => [i.slug, i.id]));
  const badgeId = Object.fromEntries((await db.badge.findMany()).map((b) => [b.slug, b.id]));

  const orgId: Record<string, string> = {};
  for (const o of ORGS) {
    const row = await db.org.create({ data: { name: o.name, kind: o.kind, emoji: o.emoji, lat: o.lat, lng: o.lng, neighborhood: o.hood, description: `${o.desc} (demo)`, verified: true } });
    orgId[o.key] = row.id;
  }

  const chain = await db.questChain.create({ data: { title: 'Restore Avondale Park', description: 'Three steps to bring Avondale Park back to life. Finish all three for a bonus.', bonusCredits: 60 } });
  type QRow = { id: string; seed: QuestSeed; rewardCredits: number; rewardXp: number };
  const quests: Record<number, QRow> = {};
  for (const s of QUESTS) {
    const { credits, xp } = computeReward(s.dur, s.diff);
    const q = await db.quest.create({
      data: {
        orgId: orgId[s.org], title: s.title, description: s.desc, category: s.cat, interestSlugs: s.tags.join(','),
        lat: s.lat, lng: s.lng, neighborhood: s.hood, address: s.addr, difficulty: s.diff, durationMin: s.dur,
        rewardCredits: credits, rewardXp: xp, capacity: s.cap, verifyCode: s.code, status: 'OPEN',
        chainId: s.chain ? chain.id : null, chainOrder: s.chain ?? null,
      },
    });
    quests[s.n] = { id: q.id, seed: s, rewardCredits: credits, rewardXp: xp };
  }

  for (const s of SPONSORS) {
    const sp = await db.sponsor.create({ data: { name: s.name, emoji: s.emoji, description: s.desc, lat: s.lat, lng: s.lng } });
    for (const [title, description, costCredits] of s.offers) await db.offer.create({ data: { sponsorId: sp.id, title, description, costCredits, stock: 50 } });
  }
  const causeIds: string[] = [];
  for (const [org, title, description, goalCredits, raisedCredits] of CAUSES) {
    const c = await db.cause.create({ data: { orgId: orgId[org], title, description, goalCredits, raisedCredits } });
    causeIds.push(c.id);
  }

  // Demo user
  const demo = await db.user.create({
    data: { email: 'demo@rpgbirmingham.app', displayName: 'Alex the Wanderer', avatarClass: 'wanderer', avatarEmoji: CLASS_META.wanderer.emoji, bio: 'New in town, ready for side quests.', xp: 0, credits: 40 },
  });
  for (const slug of ['animals', 'gardening', 'parks']) await db.userInterest.create({ data: { userId: demo.id, interestId: interestId[slug] } });
  await db.ledgerEntry.create({ data: { userId: demo.id, delta: 40, kind: 'BONUS', note: 'Welcome to RPG Birmingham!', refType: null } });

  // NPCs with consistent history
  const chainSteps = QUESTS.filter((q) => q.chain).map((q) => q.n);
  let donorIdx = 0;
  for (let i = 0; i < NPCS.length; i++) {
    const n = NPCS[i];
    const done = n.done.map((k) => quests[k]);
    const completions = done.map((q, j) => ({ category: q.seed.cat, completedAt: Date.now() - (done.length - j) * 2 * DAY - i * 3600000 }));
    const cls: AvatarClass = deriveClass(completions);
    let credits = 0; let xp = 0;
    for (const q of done) { credits += q.rewardCredits; xp += q.rewardXp; }
    const donated = n.donated ?? 0;
    const bonus = chainSteps.every((s) => n.done.includes(s)) ? 60 : 0;
    credits += bonus - donated;
    const user = await db.user.create({
      data: { email: `${n.name.toLowerCase()}@npc.rpgbirmingham.app`, displayName: n.name, avatarClass: cls, avatarEmoji: CLASS_META[cls].emoji, bio: 'Local adventurer (demo).', xp, credits, isNpc: true },
    });
    for (const slug of n.interests) await db.userInterest.create({ data: { userId: user.id, interestId: interestId[slug] } });
    for (let j = 0; j < done.length; j++) {
      const at = new Date(completions[j].completedAt as number);
      await db.participation.create({ data: { questId: done[j].id, userId: user.id, status: 'COMPLETED', acceptedAt: new Date(+at - 3 * 3600000), checkedInAt: new Date(+at - 2 * 3600000), completedAt: at } });
      await db.ledgerEntry.create({ data: { userId: user.id, delta: done[j].rewardCredits, kind: 'EARN', refType: 'quest', refId: done[j].id, note: `Completed: ${done[j].seed.title}`, createdAt: at } });
    }
    if (bonus) await db.ledgerEntry.create({ data: { userId: user.id, delta: bonus, kind: 'BONUS', refType: 'chain', refId: chain.id, note: 'Chain complete: Restore Avondale Park' } });
    if (donated) {
      const causeId = causeIds[donorIdx++ % causeIds.length];
      await db.donation.create({ data: { userId: user.id, causeId, amount: donated } });
      await db.ledgerEntry.create({ data: { userId: user.id, delta: -donated, kind: 'DONATE', refType: 'cause', refId: causeId, note: 'Donated to a cause' } });
    }
    for (const k of n.active ?? []) {
      await db.participation.create({ data: { questId: quests[k].id, userId: user.id, status: 'ACCEPTED', acceptedAt: new Date(Date.now() - 3600000) } });
    }
    const slugs = badgesEarned({
      completed: done.length,
      distinctNeighborhoods: new Set(done.map((q) => q.seed.hood)).size,
      donations: donated ? 1 : 0,
      completedGroupQuest: done.some((q) => q.seed.cap > 1),
      completedChain: !!bonus,
    });
    for (const s of slugs) await db.userBadge.create({ data: { userId: user.id, badgeId: badgeId[s] } });
    void levelFromXp;
  }

  const counts = {
    interests: await db.interest.count(), badges: await db.badge.count(), orgs: await db.org.count(),
    chains: await db.questChain.count(), quests: await db.quest.count(), sponsors: await db.sponsor.count(),
    offers: await db.offer.count(), causes: await db.cause.count(), users: await db.user.count(),
    npcs: await db.user.count({ where: { isNpc: true } }), participations: await db.participation.count(),
    ledger: await db.ledgerEntry.count(), donations: await db.donation.count(), userBadges: await db.userBadge.count(),
  };
  console.log('Seeded:', counts);
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
