import type { CauseDTO, ChainDTO, InterestDTO, MatchDTO, MeDTO, QuestDetailDTO, SponsorDTO, BadgeDTO } from '@/lib/contracts';

export const MOCK_INTERESTS: InterestDTO[] = [
  { slug: 'animals', label: 'Animals', emoji: '🐶' },
  { slug: 'parks', label: 'Parks', emoji: '🌳' },
  { slug: 'food', label: 'Food', emoji: '🍲' },
  { slug: 'teaching', label: 'Teaching', emoji: '📚' },
  { slug: 'art', label: 'Art', emoji: '🎨' },
  { slug: 'history', label: 'History', emoji: '🏛️' },
  { slug: 'gardening', label: 'Gardening', emoji: '🌱' },
  { slug: 'seniors', label: 'Seniors', emoji: '🧓' },
  { slug: 'fitness', label: 'Fitness', emoji: '💪' },
  { slug: 'music', label: 'Music', emoji: '🎵' },
  { slug: 'tech', label: 'Tech', emoji: '💻' },
  { slug: 'cleanups', label: 'Cleanups', emoji: '🧹' },
];

export const MOCK_BADGES: BadgeDTO[] = [
  { slug: 'first-steps', name: 'First Steps', icon: '👣', description: 'Complete your first quest' },
  { slug: 'regular', name: 'Regular', icon: '⭐', description: 'Complete 5 quests' },
  { slug: 'explorer', name: 'Explorer', icon: '🗺️', description: 'Complete quests in 3 neighborhoods' },
  { slug: 'patron', name: 'Patron', icon: '💛', description: 'Donate credits to a cause' },
  { slug: 'team-player', name: 'Team Player', icon: '🤝', description: 'Complete a group quest' },
  { slug: 'chain-breaker', name: 'Chain Breaker', icon: '⛓️', description: 'Complete a full quest chain' },
];

const orgs = {
  rail: { id: 'org-rail', name: 'Railroad Park Foundation', emoji: '🚂', verified: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Railroad_park_bham.JPG/500px-Railroad_park_bham.JPG' },
  bot: { id: 'org-bot', name: 'Birmingham Botanical Society', emoji: '🌺', verified: true },
  kelly: { id: 'org-kelly', name: 'Kelly Ingram Park Friends', emoji: '🕊️', verified: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/KellyIngramPark.jpg/500px-KellyIngramPark.jpg' },
  sloss: { id: 'org-sloss', name: 'Sloss Furnaces Volunteers', emoji: '🏭', verified: true },
  avon: { id: 'org-avon', name: 'Avondale Community Garden', emoji: '🥕', verified: true },
  humane: { id: 'org-humane', name: 'Greater Birmingham Humane Society', emoji: '🐕', verified: true },
  meals: { id: 'org-meals', name: 'Magic City Meals', emoji: '🍽️', verified: true },
};

type Seed = Omit<QuestDetailDTO, 'participantCount' | 'spotsLeft' | 'status' | 'party' | 'myStatus' | 'interestSlugs' | 'rewardXp' | 'address'> &
  Partial<Pick<QuestDetailDTO, 'interestSlugs' | 'address'>>;

function q(s: Seed): QuestDetailDTO {
  return {
    interestSlugs: [],
    address: 'Birmingham, AL',
    ...s,
    rewardXp: s.rewardCredits * 2,
    participantCount: 0,
    spotsLeft: s.capacity,
    status: 'OPEN',
    party: [],
    myStatus: null,
  };
}

export const MOCK_QUESTS: QuestDetailDTO[] = [
  q({ id: 'q-dog', title: 'Dog Day at the Shelter', description: 'Walk, play and socialize with shelter dogs.', category: 'animals', interestSlugs: ['animals'], lat: 33.5012, lng: -86.7965, neighborhood: 'Five Points South', difficulty: 1, durationMin: 90, rewardCredits: 35, capacity: 6, org: orgs.humane }),
  q({ id: 'q-sloss', title: 'Sloss Spring Cleanup', description: 'Help clear grounds around the historic furnaces.', category: 'cleanup', interestSlugs: ['cleanups', 'history'], lat: 33.5136, lng: -86.7923, neighborhood: 'Lakeview', difficulty: 2, durationMin: 120, rewardCredits: 55, capacity: 8, org: orgs.sloss }),
  q({ id: 'q-meal', title: 'Meal Prep Brigade', description: 'Chop, pack and label meals for neighbors.', category: 'food', interestSlugs: ['food'], lat: 33.5052, lng: -86.8008, neighborhood: 'Southside', difficulty: 1, durationMin: 120, rewardCredits: 45, capacity: 6, org: orgs.meals }),
  q({ id: 'q-rail', title: 'Railroad Park Litter Sweep', description: 'Quick lap with a grabber and a bag.', category: 'cleanup', interestSlugs: ['parks', 'cleanups'], lat: 33.5116, lng: -86.8128, neighborhood: 'Downtown', difficulty: 1, durationMin: 30, rewardCredits: 15, capacity: 1, org: orgs.rail }),
  q({ id: 'q-kelly', title: 'Kelly Ingram Garden Tidy', description: 'Weed and mulch the memorial beds.', category: 'environment', interestSlugs: ['parks', 'history', 'gardening'], lat: 33.5164, lng: -86.8143, neighborhood: 'Downtown', difficulty: 2, durationMin: 60, rewardCredits: 25, capacity: 3, org: orgs.kelly }),
  q({ id: 'q-bot', title: 'Botanical Gardens Plant Labels', description: 'Make and place new plant labels.', category: 'education', interestSlugs: ['gardening', 'teaching'], lat: 33.489, lng: -86.777, neighborhood: 'Highland Park', difficulty: 1, durationMin: 40, rewardCredits: 20, capacity: 2, org: orgs.bot }),
  q({ id: 'q-sen1', title: 'Porch Visit & Tea', description: 'Chat with a neighbor over tea.', category: 'seniors', interestSlugs: ['seniors'], lat: 33.5238, lng: -86.7712, neighborhood: 'Avondale', difficulty: 1, durationMin: 45, rewardCredits: 20, capacity: 1, org: orgs.avon }),
  q({ id: 'q-ch1', title: 'Clear the Beds', description: 'Step 1 of Restore Avondale Park.', category: 'environment', interestSlugs: ['gardening'], lat: 33.5222, lng: -86.7692, neighborhood: 'Avondale', difficulty: 2, durationMin: 60, rewardCredits: 25, capacity: 4, org: orgs.avon, chain: { id: 'chain-avon', title: 'Restore Avondale Park', order: 1, total: 3 } }),
  q({ id: 'q-ch2', title: 'Plant the Rows', description: 'Step 2 of Restore Avondale Park.', category: 'environment', interestSlugs: ['gardening'], lat: 33.5226, lng: -86.7685, neighborhood: 'Avondale', difficulty: 2, durationMin: 60, rewardCredits: 25, capacity: 4, org: orgs.avon, chain: { id: 'chain-avon', title: 'Restore Avondale Park', order: 2, total: 3 } }),
  q({ id: 'q-ch3', title: 'Paint the Fence', description: 'Step 3 of Restore Avondale Park.', category: 'arts', interestSlugs: ['art'], lat: 33.5219, lng: -86.7699, neighborhood: 'Avondale', difficulty: 1, durationMin: 60, rewardCredits: 20, capacity: 4, org: orgs.avon, chain: { id: 'chain-avon', title: 'Restore Avondale Park', order: 3, total: 3 } }),
];

export const MOCK_CHAIN: ChainDTO = {
  id: 'chain-avon', title: 'Restore Avondale Park', description: 'Three steps to bring the park back to life.', bonusCredits: 60,
  steps: [
    { questId: 'q-ch1', title: 'Clear the Beds', order: 1, done: false },
    { questId: 'q-ch2', title: 'Plant the Rows', order: 2, done: false },
    { questId: 'q-ch3', title: 'Paint the Fence', order: 3, done: false },
  ],
};

export const MOCK_SPONSORS: SponsorDTO[] = [
  { id: 's-coffee', name: 'Magic City Beans', emoji: '☕', description: 'Neighborhood coffee shop (demo)', lat: 33.5185, lng: -86.8089, offers: [
    { id: 'o-coffee', title: 'Free drip coffee', description: 'Any size', costCredits: 20, stock: 50 },
    { id: 'o-latte', title: 'Latte + pastry', description: 'Treat yourself', costCredits: 45, stock: 30 } ] },
  { id: 's-book', name: 'Red Mountain Books', emoji: '📖', description: 'Indie bookstore (demo)', lat: 33.5, lng: -86.795, offers: [
    { id: 'o-book', title: '$5 off any book', description: 'One per visit', costCredits: 30, stock: 40 },
    { id: 'o-tote', title: 'Tote bag', description: 'Canvas tote', costCredits: 60, stock: 20 } ] },
  { id: 's-taco', name: 'Taco Vulcan', emoji: '🌮', description: 'Taco spot (demo)', lat: 33.5051, lng: -86.8033, offers: [
    { id: 'o-taco', title: 'Free taco', description: 'Your choice', costCredits: 25, stock: 40 },
    { id: 'o-combo', title: 'Taco combo', description: '3 tacos + drink', costCredits: 70, stock: 25 } ] },
];

export const MOCK_CAUSES: CauseDTO[] = [
  { id: 'c-park', title: 'New Playground at Avondale Park', description: 'Help fund new equipment.', orgName: 'Avondale Community Garden', goalCredits: 800, raisedCredits: 310 },
  { id: 'c-meals', title: 'Fill the Food Pantry', description: 'Stock shelves for winter.', orgName: 'Magic City Meals', goalCredits: 500, raisedCredits: 420 },
  { id: 'c-shelter', title: 'Shelter Dog Winter Beds', description: 'Warm beds for shelter dogs.', orgName: 'Greater Birmingham Humane Society', goalCredits: 300, raisedCredits: 90 },
];

export const MOCK_ME: MeDTO = {
  id: 'me', email: 'demo@rpgbirmingham.app', displayName: 'Alex the Wanderer', bio: '', favoriteArtist: 'Alabama Shakes', hobby: 'Hiking',
  avatarClass: 'wanderer', avatarEmoji: '🧭',
  xp: 0, level: 1, xpIntoLevel: 0, xpForNext: 40, credits: 40,
  interests: MOCK_INTERESTS.filter((i) => ['animals', 'gardening', 'parks'].includes(i.slug)),
  badges: [],
  stats: { questsCompleted: 0, creditsEarned: 0, creditsDonated: 0, neighborhoods: [] },
  revealedDistricts: [],
};

export const MOCK_MATCHES: MatchDTO[] = [
  { userId: 'n1', displayName: 'Maya', avatarEmoji: '🍞', avatarClass: 'keeper', level: 4, score: 11, sharedInterests: MOCK_INTERESTS.slice(0, 2), reason: "Both into Animals & Parks · Both on 'Dog Day at the Shelter'" },
  { userId: 'n2', displayName: 'Jordan', avatarEmoji: '🌲', avatarClass: 'scout', level: 3, score: 9, sharedInterests: [MOCK_INTERESTS[1], MOCK_INTERESTS[6]], reason: 'Both into Parks & Gardening' },
  { userId: 'n3', displayName: 'Sam', avatarEmoji: '🔨', avatarClass: 'builder', level: 2, score: 7, sharedInterests: [MOCK_INTERESTS[0]], reason: 'Both into Animals' },
  { userId: 'n4', displayName: 'Priya', avatarEmoji: '📚', avatarClass: 'teacher', level: 5, score: 6, sharedInterests: [MOCK_INTERESTS[6]], reason: 'Both into Gardening' },
  { userId: 'n5', displayName: 'Chris', avatarEmoji: '🎨', avatarClass: 'bard', level: 2, score: 4, sharedInterests: [MOCK_INTERESTS[1]], reason: 'Both into Parks' },
];

// Teammates already signed up for Dog Day, so party vibes show in offline mode too.
const dog = MOCK_QUESTS.find((x) => x.id === 'q-dog');
if (dog) {
  dog.party = [
    { userId: 'n1', displayName: 'Maya', avatarEmoji: '🍞', avatarClass: 'keeper', level: 2, favoriteArtist: 'Alabama Shakes', hobby: 'Hiking' },
    { userId: 'n2', displayName: 'Jordan', avatarEmoji: '🌲', avatarClass: 'scout', level: 3, favoriteArtist: 'Taylor Swift', hobby: 'Photography' },
  ];
  dog.participantCount = 2;
  dog.spotsLeft = dog.capacity - 2;
}
