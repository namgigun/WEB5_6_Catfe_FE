'use client';

import { useRouter } from 'next/navigation';
import Button from '../Button';
import HoverInfoBox from './HoverInfoBox';
import MarqueeRow from './MarqueeRow';
import HeroFlashlight from './HeroFlashlight';
import RecentRooms from './RecentRooms';

export default function GuestHome() {
  const router = useRouter();

  return (
    <main className="w-full min-h-screen bg-background-base text-text-primary flex flex-col gap-16 items-center justify-center mb-5">
      <HeroFlashlight />

      <section className="w-full flex flex-col justify-center items-center gap-16 pb-10">
        <div className="w-full flex flex-col gap-6">
          <MarqueeRow direction="ltr" />
          <h1 className="text-5xl font-bold tracking-wide text-center py-2">Catfé</h1>
          <MarqueeRow direction="rtl" />
        </div>
      </section>

      <HoverInfoBox />

      <section className="w-full max-w-6xl flex flex-col justify-center gap-10 md:pt-30 pt-20 pb-10 px-[100px]">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">
          Catfé 에 방문하신 여러분 환영합니다!
        </h2>
        <span className="text-center text-xl md:text-2xl font-semibold">
          👀 가장 최근에 개설된 캣페를 구경하세요 👀
        </span>
      </section>

      <section className="w-full max-w-6xl gap-6 pb-5 md:pb-6 justify-items-center px-[100px]">
        <RecentRooms />
      </section>

      <Button
        size="lg"
        borderType="solid"
        color="primary"
        className="self-center mb-20"
        onClick={() => router.push('/study-rooms')}
      >
        👉🏻더 많은 스터디룸 구경하러 가기👈🏻
      </Button>
    </main>
  );
}
