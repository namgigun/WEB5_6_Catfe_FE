'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import RoomStage from '@/components/study-room/RoomStage';
import { makeRtcConfig } from '@/lib/webrtcApi';
import { useWebRTC } from '@/hook/useWebRTC';
import { useMediaStream } from '@/hook/useMediaStream';
import { useRoomMembersQuery } from '@/hook/useRoomMembers';
import type { RoomSnapshotUI, StreamsByUser, UsersListItem } from '@/@types/room';

const DEBUG = true;

/** 'u-12' → 12 */
function idNumLike(id: string) {
  const p = id.split('-')[1] ?? id;
  const n = Number(p);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}
/** offer 선공 규칙: 작은 쪽이 선공 */
function shouldInitiate(meId: string, peerId: string) {
  return idNumLike(meId) < idNumLike(peerId);
}

/** STUN fallback */
const DEFAULT_RTC: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

/** localStorage에 저장된 유저 → 'u-<num>'로 정규화 */
function getMyUidFromLocal(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    const id = u?.userId ?? u?.userid ?? u?.UserId ?? u?.id ?? u?.user_id ?? u?.ID ?? null;
    const n = typeof id === 'string' ? Number(id) : id;
    return Number.isFinite(n) ? `u-${Number(n)}` : null;
  } catch {
    return null;
  }
}

export default function MediaRoomClient({ room }: { room: RoomSnapshotUI }) {
  /** 0) 나의 uid 확정(로컬 → 스냅샷) */
  const myUid = useMemo(
    () =>
      (typeof window !== 'undefined' ? getMyUidFromLocal() : null) ??
      room.members.find((m) => m.isMe)?.id ??
      null,
    [room.members]
  );

  /** room-2 → 2 */
  const roomId = room.info.id;
  const roomNum = useMemo(() => Number(roomId.split('-')[1] ?? roomId) || 0, [roomId]);
  if (DEBUG) console.log('[room] id=%s(%d) myUid=%s', roomId, roomNum, myUid);

  /** 1) 실시간 멤버 폴링 */
  const { data: membersDto = [] } = useRoomMembersQuery(roomNum, {
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  /** DTO → UI 모델 + me 보정 */
  const liveMembers: UsersListItem[] = useMemo(() => {
    const arr: UsersListItem[] = membersDto.map((m) => ({
      id: `u-${m.userId}`,
      name: m.nickname,
      role: m.role === 'HOST' ? 'owner' : 'member',
      email: '',
      avatarUrl: m.profileImageUrl ?? null,
      isMe: myUid ? m.userId === Number(myUid.split('-')[1]) : false,
      media: { camOn: true, screenOn: false },
    }));

    if (myUid && !arr.some((x) => x.id === myUid)) {
      const fallback =
        room.members.find((x) => x.id === myUid) ??
        ({
          id: myUid,
          name: 'me',
          role: 'member',
          email: '',
          avatarUrl: null,
          isMe: true,
          media: { camOn: true, screenOn: false },
        } as UsersListItem);
      arr.push({ ...fallback, isMe: true });
    }
    if (DEBUG) console.log('[ui] liveMembers:', arr.map((m) => `${m.id}${m.isMe ? '(me)' : ''}`));
    return arr;
  }, [membersDto, myUid, room.members]);

  /** 스냅샷 + 라이브 합집합 */
  const unionMembers: UsersListItem[] = useMemo(() => {
    const map = new Map<string, UsersListItem>();
    for (const m of room.members) map.set(m.id, m);
    for (const m of liveMembers) map.set(m.id, m);
    const merged = Array.from(map.values());
    if (DEBUG) console.log('[ui] unionMembers:', merged.map((m) => `${m.id}${m.isMe ? '(me)' : ''}`));
    return merged;
  }, [room.members, liveMembers]);

  /** me 식별자 */
  const me = useMemo(
    () => room.members.find((m) => m.isMe) ?? liveMembers.find((m) => m.isMe) ?? null,
    [room.members, liveMembers]
  );
  const meId = me?.id ?? myUid ?? null;

  /** 2) 로컬 미디어 */
  const { localStream, initMedia } = useMediaStream();
  useEffect(() => { initMedia(); }, [initMedia]);

  /** 3) ICE 서버 가져오기 (실패 시 STUN) */
  const [rtcConfig, setRtcConfig] = useState<RTCConfiguration>(DEFAULT_RTC);
  useEffect(() => {
    (async () => {
      if (!meId) return;
      try {
        const meNum = Number((meId || '').split('-')[1] ?? meId) || 0;
        const cfg = await makeRtcConfig({ userId: meNum, roomId: roomNum });
        setRtcConfig(cfg?.iceServers?.length ? cfg : DEFAULT_RTC);
        if (DEBUG) console.log('[rtc] config:', (cfg?.iceServers ?? DEFAULT_RTC.iceServers));
      } catch (e) {
        setRtcConfig(DEFAULT_RTC);
        console.warn('[rtc] config fetch failed → fallback STUN only', e);
      }
    })();
  }, [meId, roomNum]);

  /** 4) WebRTC 훅 */
  const { remoteStreams, callUser } = useWebRTC({
    roomId,
    meId: meId ?? '__unknown__',
    localStream,
    rtcConfig,
  });

  /**
   * 5) OFFER 트리거
   *  - 신규 피어에 대해서만
   *  - 내가 더 작은 id일 때만
   *  - 트랙 붙을 시간 확보를 위해 약간의 지연
   */
  const startedRef = useRef<Set<string>>(new Set());
  const lastPeerIdsRef = useRef<string>('');
  useEffect(() => {
    if (!localStream || !meId) {
      if (DEBUG) console.log('[offer] skip: stream/meId not ready', !!localStream, meId);
      return;
    }

    const candidates = unionMembers
      .filter((m) => !m.isMe && m.id !== meId)
      .map((m) => m.id)
      .sort();

    const peerIds = candidates.join(',');
    if (peerIds === lastPeerIdsRef.current) return;
    lastPeerIdsRef.current = peerIds;

    const started = startedRef.current;
    const currentSet = new Set(candidates);
    // 빠진 피어 정리
    for (const pid of Array.from(started)) {
      if (!currentSet.has(pid)) started.delete(pid);
    }

    // 신규 피어 선공
    for (const pid of candidates) {
      if (started.has(pid)) continue;
      if (!shouldInitiate(meId, pid)) continue;

      started.add(pid);
      if (DEBUG) console.log('[offer] try ->', pid, 'from', meId);

      // 트랙 부착 완료 후 전송(조금 여유)
      const tryCall = (delay = 400) => {
        setTimeout(() => {
          try {
            void callUser(pid);
          } catch (e) {
            console.warn(`[rtc] callUser(${pid}) failed, retrying...`, e);
            setTimeout(() => void callUser(pid), 500);
          }
        }, delay);
      };
      tryCall();
    }
  }, [unionMembers, meId, localStream, callUser]);

  /** 6) 렌더용 스트림 매핑(내 로컬 포함) */
  const streamsByUser: StreamsByUser = useMemo(() => {
    const m: StreamsByUser = { ...remoteStreams };
    if (meId) m[meId.startsWith('u-') ? meId : `u-${meId}`] = localStream ?? null;
    if (DEBUG) console.log('[render] members=', Object.keys(m).sort());
    return m;
  }, [remoteStreams, localStream, meId]);

  return (
    <RoomStage
      room={{
        ...room,
        members: liveMembers,
        info: { ...room.info, mediaEnabled: true },
      }}
      streamsByUser={streamsByUser}
    />
  );
}
