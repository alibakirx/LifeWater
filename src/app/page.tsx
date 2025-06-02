'use client';

import dynamic from 'next/dynamic';

const LifeWater = dynamic(() => import('../components/LifeWater'), {
  ssr: false,
});

export default function Home() {
  return <LifeWater />;
} 