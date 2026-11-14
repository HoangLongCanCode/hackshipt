import type { AvatarClass, Category } from './contracts';

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  cleanup: { label: 'Cleanup', emoji: '🧹', color: '#f59e0b' },
  food: { label: 'Food', emoji: '🍲', color: '#f97316' },
  education: { label: 'Education', emoji: '📚', color: '#60a5fa' },
  seniors: { label: 'Seniors', emoji: '🧓', color: '#34d399' },
  animals: { label: 'Animals', emoji: '🐾', color: '#f472b6' },
  arts: { label: 'Arts', emoji: '🎨', color: '#c084fc' },
  environment: { label: 'Environment', emoji: '🌳', color: '#4ade80' },
  community: { label: 'Community', emoji: '🏘️', color: '#fbbf24' },
};

export const CLASS_META: Record<AvatarClass, { label: string; emoji: string }> = {
  wanderer: { label: 'Wanderer', emoji: '🧭' },
  builder: { label: 'Builder', emoji: '🔨' },
  healer: { label: 'Healer', emoji: '💚' },
  scout: { label: 'Scout', emoji: '🌲' },
  teacher: { label: 'Teacher', emoji: '📚' },
  keeper: { label: 'Keeper', emoji: '🍞' },
  bard: { label: 'Bard', emoji: '🎨' },
};

export const BIRMINGHAM = {
  center: { lat: 33.5186, lng: -86.8025 },
  bounds: { minLat: 33.38, maxLat: 33.68, minLng: -87.0, maxLng: -86.65 },
};

export interface District { name: string; center: { lat: number; lng: number }; radiusM: number }

export const DISTRICTS: District[] = [
  { name: 'Downtown', center: { lat: 33.5186, lng: -86.8104 }, radiusM: 900 },
  { name: 'Five Points South', center: { lat: 33.501, lng: -86.795 }, radiusM: 700 },
  { name: 'Avondale', center: { lat: 33.5222, lng: -86.7692 }, radiusM: 800 },
  { name: 'Woodlawn', center: { lat: 33.5504, lng: -86.7634 }, radiusM: 800 },
  { name: 'Southside', center: { lat: 33.505, lng: -86.8 }, radiusM: 600 },
  { name: 'Lakeview', center: { lat: 33.513, lng: -86.79 }, radiusM: 600 },
  { name: 'Highland Park', center: { lat: 33.5043, lng: -86.784 }, radiusM: 700 },
  { name: 'Ensley', center: { lat: 33.512, lng: -86.88 }, radiusM: 900 },
];

export const DAILY_CREDIT_CAP = 200;
export const CHECKIN_RADIUS_M = 250;
