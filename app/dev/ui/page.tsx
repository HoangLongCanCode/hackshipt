'use client';

/**
 * Dev gallery for the cozy design kit. Open /dev/ui (best at 390px wide).
 * Uses only local fixtures: no lib/client, lib/mock or lib/contracts imports.
 */

import { useState, type ReactNode } from 'react';
import {
  Avatar,
  AvatarStack,
  Button,
  Card,
  CountUp,
  EmptyState,
  Modal,
  Pill,
  ProgressBar,
  Sheet,
  Skeleton,
  SkeletonCard,
  ToastProvider,
  useToast,
} from '@/components/ui';
import { BottomNav, CreditPill, Hud, LevelRing, Wordmark } from '@/components/shell';
import { CategoryChip, DifficultyStars, RewardBadge } from '@/components/quest';

const CATS = [
  { key: 'cleanup', label: 'Cleanup', emoji: '🧹', color: '#f59e0b' },
  { key: 'food', label: 'Food', emoji: '🍞', color: '#f97316' },
  { key: 'education', label: 'Learn', emoji: '📚', color: '#60a5fa' },
  { key: 'seniors', label: 'Seniors', emoji: '💚', color: '#34d399' },
  { key: 'animals', label: 'Animals', emoji: '🐶', color: '#f472b6' },
  { key: 'arts', label: 'Arts', emoji: '🎨', color: '#c084fc' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="cz-eyebrow">{title}</h2>
      {children}
    </section>
  );
}

function Gallery() {
  const toast = useToast();
  const [cat, setCat] = useState<string | null>('animals');
  const [modal, setModal] = useState<null | 'confirm' | 'reward'>(null);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(40);

  return (
    <main className="cz-plank-bg min-h-dvh px-4 pt-6 pb-32">
      <div className="mx-auto max-w-[440px] space-y-8">
        <header className="flex items-center justify-between">
          <Wordmark className="text-2xl" />
          <Pill tone="sky">/dev/ui</Pill>
        </header>

        <Section title="HUD (floats over the map)">
          <div className="flex flex-wrap items-center gap-3">
            <Hud data={{ level: 3, xpIntoLevel: 62, xpForNext: 160, credits, avatarEmoji: '🍞' }} />
            <Button size="sm" variant="gold" onClick={() => setCredits((c) => c + 25)}>
              +25 credits
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <LevelRing level={1} xpIntoLevel={0} xpForNext={40} emoji="🧭" />
            <LevelRing level={5} xpIntoLevel={120} xpForNext={150} emoji="🔨" size={64} />
            <CreditPill credits={1280} />
          </div>
        </Section>

        <Section title="Buttons">
          <Card hero stitch grain className="space-y-3 p-5">
            <Button block size="lg">Begin your adventure</Button>
            <div className="flex flex-wrap gap-3">
              <Button>Accept</Button>
              <Button variant="leaf">Check in</Button>
              <Button variant="sky">Details</Button>
              <Button variant="gold">Redeem</Button>
              <Button variant="secondary">Abandon</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="ghost">Skip</Button>
              <Button disabled>Disabled</Button>
              <Button
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1500);
                }}
              >
                {loading ? 'Saving' : 'Pending demo'}
              </Button>
            </div>
          </Card>
        </Section>

        <Section title="Chips, pills, rewards">
          <div className="cz-hide-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {CATS.map((c) => (
              <CategoryChip
                key={c.key}
                label={c.label}
                emoji={c.emoji}
                color={c.color}
                selected={cat === c.key}
                onClick={() => setCat(cat === c.key ? null : c.key)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Neutral</Pill>
            <Pill tone="gold">Gold</Pill>
            <Pill tone="leaf">Leaf</Pill>
            <Pill tone="sky">Sky</Pill>
            <Pill tone="coral">Coral</Pill>
            <Pill tone="outline">Outline</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RewardBadge credits={45} xp={90} />
            <RewardBadge credits={20} xp={40} chainBonus={60} />
            <DifficultyStars value={3} />
          </div>
        </Section>

        <Section title="Quest card (composition example)">
          <Card interactive className="space-y-3" onClick={() => toast.info('Card tapped')}>
            <div className="flex items-start gap-3">
              <Avatar emoji="🐶" size={48} />
              <div className="min-w-0 flex-1">
                <h3 className="cz-display text-lg leading-tight">Dog Day at the Shelter</h3>
                <p className="cz-muted text-sm">Greater Birmingham Humane Society</p>
              </div>
              <CategoryChip staticChip label="Animals" emoji="🐶" color="#f472b6" />
            </div>
            <div className="flex items-center justify-between">
              <RewardBadge credits={45} xp={90} />
              <AvatarStack
                size={28}
                items={[
                  { id: '1', emoji: '🧭' },
                  { id: '2', emoji: '🍞' },
                  { id: '3', emoji: '🎨' },
                  { id: '4', emoji: '🔨' },
                  { id: '5', emoji: '📚' },
                ]}
              />
            </div>
            <ProgressBar value={50} tone="sky" size="sm" label="Party filled" />
            <p className="cz-muted text-xs">3 of 6 spots filled</p>
          </Card>
        </Section>

        <Section title="Progress">
          <Card className="space-y-4">
            <ProgressBar value={38} label="XP" />
            <ProgressBar value={72} tone="gold" size="lg" label="Cause goal" />
            <ProgressBar value={90} tone="coral" size="sm" label="Almost" />
            <div className="cz-display text-2xl">
              <CountUp value={credits} /> <span className="cz-muted text-sm">credits</span>
            </div>
          </Card>
        </Section>

        <Section title="Toasts, modals, sheet">
          <div className="flex flex-wrap gap-3">
            <Button size="sm" variant="leaf" onClick={() => toast.success('Quest accepted!')}>Success</Button>
            <Button size="sm" variant="danger" onClick={() => toast.error('Not enough credits')}>Error</Button>
            <Button size="sm" variant="sky" onClick={() => toast.info('Check-in is in demo mode')}>Info</Button>
            <Button size="sm" variant="gold" onClick={() => toast.reward('+45 credits, +90 XP')}>Reward</Button>
            <Button size="sm" variant="secondary" onClick={() => setModal('confirm')}>Confirm modal</Button>
            <Button size="sm" variant="secondary" onClick={() => setModal('reward')}>Reward modal</Button>
            <Button size="sm" variant="secondary" onClick={() => setSheet((s) => !s)}>
              {sheet ? 'Hide sheet' : 'Show sheet'}
            </Button>
          </div>
        </Section>

        <Section title="Loading and empty">
          <SkeletonCard />
          <div className="flex gap-3">
            <Skeleton width={96} height={96} />
            <div className="flex-1 space-y-2">
              <Skeleton height={16} />
              <Skeleton width="70%" height={16} />
              <Skeleton width="40%" height={16} />
            </div>
          </div>
          <Card hero stitch>
            <EmptyState
              emoji="🐶"
              title="No quests here yet"
              message="Try another category, or check back soon."
              action={<Button size="sm" variant="secondary">Clear filters</Button>}
            />
          </Card>
          <Card>
            <EmptyState
              emoji="🌧️"
              title="Couldn't load quests"
              message="Something went wrong on our end."
              action={<Button size="sm">Try again</Button>}
            />
          </Card>
        </Section>
      </div>

      <Modal open={modal === 'confirm'} onClose={() => setModal(null)} title="Redeem this?">
        <div className="space-y-4 text-center">
          <p className="cz-muted text-sm">Free coffee at Octane will cost 30 credits.</p>
          <div className="flex gap-3">
            <Button block variant="secondary" onClick={() => setModal(null)}>Not now</Button>
            <Button
              block
              onClick={() => {
                setModal(null);
                toast.success('Redeemed!');
              }}
            >
              Redeem
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'reward'} onClose={() => setModal(null)} title="Quest complete!" tone="leaf" confetti>
        <div className="space-y-4 text-center">
          <div className="cz-float text-5xl">🎉</div>
          <RewardBadge credits={45} xp={90} className="justify-center" />
          <Button block variant="leaf" onClick={() => setModal(null)}>Nice!</Button>
        </div>
      </Modal>

      {sheet && (
        <Sheet bottomOffset={88}>
          <div className="px-4 pb-6">
            <h3 className="cz-display text-xl">Sheet content</h3>
            <p className="cz-muted text-sm">Drag the handle: peek, half, full. Scrolls at full.</p>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Card key={i} flat tint>Quest row {i + 1}</Card>
              ))}
            </div>
          </div>
        </Sheet>
      )}

      <BottomNav activePath="/" />
    </main>
  );
}

export default function UiGalleryPage() {
  return (
    <ToastProvider>
      <Gallery />
    </ToastProvider>
  );
}
