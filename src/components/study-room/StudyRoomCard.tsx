import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';

type Props = {
  title: string;
  description?: string;
  coverSrc?: string | null;
  isPrivate?: boolean;
  status?: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'TERMINATED' | string;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function StudyRoomCard({
  title,
  description,
  coverSrc,
  isPrivate = false,
  status = 'ACTIVE',
  clickable = false,
  onClick,
  className,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const hasThumb = !!coverSrc && !imgError;
  const isTerminated = status === 'TERMINATED';

  return (
    <article
      className={clsx(
        'w-full overflow-hidden rounded-2xl border-2 border-text-secondary bg-background-white shadow-sm',
        clickable && 'cursor-pointer hover:shadow-md active:translate-y-[1px]',
        className
      )}
      onClick={clickable ? onClick : undefined}
      aria-label={title}
    >
      <div className="relative">
        <div className="relative min-h-40 w-full flex justify-center items-center bg-secondary-500">
          {hasThumb ? (
            <Image
              src={coverSrc as string}
              alt={`${title} 썸네일`}
              fill
              className="object-cover"
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              onError={() => setImgError(true)}
              priority={false}
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Image
                src="/icon/study-room/image-placeholder.svg"
                alt="이미지 없음 아이콘"
                width={40}
                height={40}
                draggable={false}
              />
            </div>
          )}
          {isTerminated && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="rounded-full bg-background-white/50 size-16 flex items-center justify-center">
                <div className="relative size-12">
                  <Image
                    src="/icon/study-room/trash-alert.svg"
                    alt="종료된 스터디룸"
                    fill
                    className="opacity-90"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="h-[2px] w-full bg-text-secondary" />
      </div>

      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary leading-tight line-clamp-1 text-xs">
            {title || '[roomName]'}
            {isTerminated && ' (종료)'}
          </h3>
          {isPrivate && (
            <Image
              src="/icon/study-room/lock.svg"
              alt="비공개 스터디룸 아이콘"
              width={16}
              height={16}
              className="opacity-80"
            />
          )}
        </div>

        <p className="mt-2 text-[10px] text-text-secondary leading-snug line-clamp-1 min-h-[20px]">
          {description?.trim() || ' '}
        </p>
      </div>
    </article>
  );
}
