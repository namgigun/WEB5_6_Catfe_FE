'use client';

import { HOURS } from '@/lib/datetime';
import { useEffect, useMemo, useState } from 'react';
import PlanDataContainer from './PlanDataContainer';
import { useSelectedDate } from '@/hook/useSelectedDate';
import dayjs from '@/lib/dayjs';

/* 스터디플래너 영역 레이아웃 ( Plan | 시간 | Record ) */
function PlannerLayout() {
  const [hourHeight, setHourHeight] = useState(48);
  const { date } = useSelectedDate();
  const dayStart = useMemo(() => dayjs(date).startOf('day'), [date]);
  const isToday = dayjs().isSame(dayStart, 'day');
  const nowTop = isToday ? (dayjs().diff(dayStart, 'minute') / 60) * hourHeight : -9999;

  useEffect(() => {
    const compute = () => {
      const vh = window.innerHeight;
      const target = Math.floor((vh * 0.8) / 24); // 화면 높이 80%를 24h로 분배
      const clamped = Math.max(40, Math.min(60, target)); // 최대 최소 높이 설정
      setHourHeight(clamped);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  });
  const gridHeight = hourHeight * 24;

  return (
    <div className="relative p-6 rounded-xl border border-secondary-900 overflow-auto bg-background-white pt-0 h-full min-h-0 shadow-md">
      <div className="sticky top-0 z-40 flex items-center justify-between p-2 pt-6 bg-background-base">
        <h3 className="text-lg font-bold">TimeLine</h3>
      </div>

      <div className="relative border border-secondary-900" style={{ height: gridHeight }}>
        <div className="absolute inset-0 -z-0">
          {Array.from({ length: 23 }).map((_, i) => (
            <div
              key={`plan-line-${i}`}
              className="absolute left-0 right-0 border-t border-secondary-900"
              style={{ top: (i + 1) * hourHeight }}
            />
          ))}
        </div>

        <div className="flex relative h-full">
          {/* Time Label */}
          <div className="w-12 flex-shrink-0 flex flex-col pointer-events-none select-none border-r border-secondary-900 sticky left-0 z-20 bg-background-white">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="text-xs text-text-secondary font-bold text-center"
                style={{ height: `${hourHeight}px`, lineHeight: `${hourHeight}px` }}
              >
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
          {/* Plan */}
          <div className="flex-1 relative">
            <div className="relative" style={{ height: gridHeight }}>
              <PlanDataContainer hourHeight={hourHeight} />
            </div>
          </div>
        </div>

        {/* 현재 시간 indicator */}
        {isToday && nowTop >= 0 && nowTop <= gridHeight && (
          <div
            className="pointer-events-none absolute left-14 right-0 z-30"
            style={{ top: nowTop }}
          >
            <div className="h-0 border-t-2 border-primary-700" />
            <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary-700" />
          </div>
        )}
      </div>
    </div>
  );
}
export default PlannerLayout;
