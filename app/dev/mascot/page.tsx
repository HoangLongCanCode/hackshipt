'use client';

/** Playground for the avocado kit: /dev/mascot */
import { useState } from 'react';
import { AnimationToggle, Avocado, AvocadoCar, AvocadoLoader, AvocadoSplash, ShiptBag, useAnimationPref } from '@/components/mascot';

export default function MascotDev() {
  const [pct, setPct] = useState(45);
  const [splashKey, setSplashKey] = useState(0);
  const [on] = useAnimationPref();
  return (
    <div style={{ background: '#fff6e3', color: '#4a3328', minHeight: '100vh', padding: 24, display: 'grid', gap: 28, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>Avocado mascot kit</h1>

      <section>
        <h2>Pieces</h2>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Avocado size={140} />
          <Avocado size={140} walking />
          <Avocado size={100} bag={false} />
          <ShiptBag size={60} />
          <AvocadoCar size={200} />
        </div>
      </section>

      <section>
        <h2>{'<AvocadoLoader/>'} (auto loop)</h2>
        <AvocadoLoader label="Loading quests" />
      </section>

      <section>
        <h2>{'<AvocadoLoader progress/>'}</h2>
        <input type="range" min={0} max={100} value={pct} onChange={(e) => setPct(+e.target.value)} />
        <AvocadoLoader progress={pct} title={null} label="Packing your quests" />
      </section>

      <section style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <AnimationToggle />
        <span>ride animation: {on ? 'ON' : 'OFF'}</span>
        <button onClick={() => { sessionStorage.removeItem('rpgb:splash-seen'); setSplashKey((k) => k + 1); }} style={{ border: '2px solid #4a3328', borderRadius: 8, padding: '4px 10px', fontWeight: 700 }}>
          Replay splash
        </button>
      </section>
      {splashKey > 0 && <AvocadoSplash key={splashKey} />}
    </div>
  );
}
