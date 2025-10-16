'use client';

import Image from 'next/image';
import { useRef, useCallback, useEffect, useState } from 'react';
import VideoPlayer from '@/components/webrtc/VideoPlayer';
import type { UsersListItem } from '@/@types/rooms';
import MicOffBadge from '@/components/webrtc/MicOffBadge';
import UserNameBadge from '@/components/webrtc/UserNameBadge';
import AvatarImage from '../AvatarImage';
import { useMyRoomMemberFromCache } from '@/hook/useMyData';

declare global {
  interface Document {
    webkitFullscreenElement?: Element | null;
  }
}

const CONTROL_BAR_RESERVE = 80;

type TileProps = {
  member: UsersListItem;
  stream: MediaStream | null;
  audioOn: boolean;
  videoOn: boolean;
  allowFullscreen?: boolean;
  roomId?: number;
};

// me에 avatarId가 있는지 확인하는 타입 가드
function hasAvatarId(x: unknown): x is { avatarId?: number | null } {
  return !!x && typeof x === 'object' && 'avatarId' in (x as Record<string, unknown>);
}

export default function Tile({
  member,
  stream,
  audioOn,
  videoOn,
  allowFullscreen = true,
  roomId,
}: TileProps) {
  const name = String(member.name ?? member.id);

  // 캐시의 me에서 avatarId만 사용 (URL은 기존 member.avatarUrl 유지)
  const { me } = useMyRoomMemberFromCache(roomId ?? 0);
  const myAvatarId: number | null = hasAvatarId(me) ? me.avatarId ?? null : null;

  const effectiveAvatarId: number | null = member.isMe
    ? (myAvatarId ?? member.avatarId ?? null)
    : (member.avatarId ?? null);

  const avatarUrl = member.avatarUrl ?? null; // URL은 건드리지 않음
  const hasCustomAvatar = effectiveAvatarId !== null && effectiveAvatarId !== undefined;
  const imgSrc = avatarUrl ?? '/image/cat.png';

  const fsRef = useRef<HTMLDivElement>(null);
  const [isFS, setIsFS] = useState(false);

  useEffect(() => {
    if (!allowFullscreen) return;
    const sync = () =>
      setIsFS(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    sync();
    window.addEventListener('resize', sync);
    document.addEventListener('fullscreenchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      document.removeEventListener('fullscreenchange', sync);
    };
  }, [allowFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (!allowFullscreen || !fsRef.current) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await fsRef.current.requestFullscreen().catch(() => {});
    }
  }, [allowFullscreen]);

  const showVideo = videoOn && !!stream;
  const Wrapper: 'button' | 'div' = allowFullscreen ? 'button' : 'div';

  return (
    <div
      ref={fsRef}
      className={[
        'group relative mx-auto w-full max-w-[1000px]',
        'overflow-hidden rounded-xl border border-neutral-200 bg-text-primary',
      ].join(' ')}
    >
      <Wrapper
        {...(allowFullscreen
          ? { type: 'button', onDoubleClick: toggleFullscreen, title: '더블클릭: 전체화면' }
          : {})}
        className="block w-full"
        style={!isFS ? { maxHeight: `calc(100vh - ${CONTROL_BAR_RESERVE}px)` } : undefined}
      >
        <div
          className={[
            'relative flex w-full items-center justify-center bg-text-primary',
            isFS ? 'h-full' : 'aspect-video',
            'min-h-[180px] sm:min-h-[200px]',
          ].join(' ')}
        >
          {showVideo ? (
            <VideoPlayer
              stream={stream}
              muted={member.isMe}
              className={[
                'z-0 h-full w-full',
                isFS ? 'object-cover object-center' : 'object-contain',
              ].join(' ')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white">
              <div className="flex flex-col items-center">
                <div className="relative mb-2 h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/20 sm:h-16 sm:w-16">
                  {hasCustomAvatar ? (
                    <AvatarImage
                      id={effectiveAvatarId!}
                      alt={name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <Image key={imgSrc} src={imgSrc} alt={name} fill sizes="64px" />
                  )}
                </div>
                <span className="text-sm">{name}</span>
              </div>
            </div>
          )}
          {!member.isMe && !audioOn && <MicOffBadge />}
          {showVideo && <UserNameBadge name={name} />}
          {allowFullscreen && !isFS && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-max rounded-md border border-white/30 bg-black/40 px-2 py-1 text-[11px] leading-none text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              더블클릭으로 전체화면
            </div>
          )}
        </div>
      </Wrapper>
    </div>
  );
}
