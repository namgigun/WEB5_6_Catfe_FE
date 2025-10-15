"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "../Button";
import AvatarModal from "@/components/study-room/avatars/AvatarModal";
import type { AvatarId } from "@/components/study-room/avatars/AvatarSelect";

type Props = {
  roomId: number;
  initialAvatarId?: number | AvatarId | null;
  userName?: string;
  onAvatarChange?: (id: number) => void;
};

function toAvatarId(v: number | AvatarId | null | undefined): AvatarId {
  const n = Number(v ?? 1);
  const ok = Number.isInteger(n) && n >= 1 && n <= 16;
  return (ok ? n : 1) as AvatarId;
}

export default function UserProfileModal({
  roomId,
  initialAvatarId = null,
  userName = "[userName]",
  onAvatarChange,
}: Props) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarId, setAvatarId] = useState<AvatarId>(toAvatarId(initialAvatarId));

  const handleOpenAvatar = () => setAvatarOpen(true);

  const handleSaveAvatar = (id: AvatarId) => {
    setAvatarId(id);
    onAvatarChange?.(Number(id));
    setAvatarOpen(false);
  };

  return (
    <>
      <div className="w-60 p-5 rounded-xl border border-text-secondary bg-background-white flex flex-col justify-center gap-3 shadow-md">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden grid place-items-center">
          <Image src={`/image/cat-${avatarId}.svg`} alt="User Avatar" width={40} height={40} />
        </div>
        <span className="font-semibold text-sm text-text-primary">{userName}</span>
        <Button
          size="sm"
          borderType="solid"
          color="secondary"
          hasIcon
          fullWidth
          onClick={handleOpenAvatar}
        >
          <Image src="/image/cat.png" alt="cat" width={16} height={16} />
          아바타 꾸미기
        </Button>
      </div>
      <AvatarModal
        roomId={roomId}
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        initialAvatar={avatarId}
        onSave={handleSaveAvatar}
      />
    </>
  );
}
