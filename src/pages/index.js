import LifeWater from '../components/LifeWater';
import Head from 'next/head';

export default function Index() {
  return (
    <>
      <Head>
        <title>SanatJS - LifeWater Interactive Art</title>
        <meta name="description" content="Interactive underwater life simulation with p5.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gray-900">
        <main>
          <LifeWater />
        </main>
      </div>
    </>
  );
}
