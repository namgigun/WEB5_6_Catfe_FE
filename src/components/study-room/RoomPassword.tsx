"use client";

import { useCallback, useState } from "react";
import clsx from "clsx";
import Toggle from "@/components/Toggle";
import Image from "next/image";

type Props = {
  enabled: boolean;
  password: string;
  onChange: (s: { enabled: boolean; password: string }) => void;
  className?: string;
};

function RoomPassword({ enabled, password, onChange, className }: Props) {
  const [show, setShow] = useState(false);

  const setEnabled = useCallback(
    (next: boolean) => {
      onChange({ enabled: next, password: next ? password : "" });
    },
    [onChange, password]
  );

  const setPassword = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ enabled, password: e.target.value });
    },
    [onChange, enabled]
  );

  return (
    <div className={clsx("w-full", className)}>
      <div className="flex w-full justify-between items-center">
        <div className="font-medium text-text-primary text-xs">비공개 여부</div>
        <Toggle checked={enabled} onChange={setEnabled} />
      </div>

      {enabled && (
        <p className="mt-1 text-[10px] text-text-secondary">
          비공개의 경우, 비밀번호를 입력한 사용자만 스터디룸에 입장할 수 있습니다.
        </p>
      )}

      <div
        aria-hidden={!enabled}
        className={clsx("mt-3", enabled ? "visible" : "invisible")}
      >
        <div className="relative w-full">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="비밀번호를 입력해 주세요"
            className="w-full text-[10px] rounded-xl border border-text-secondary/60 bg-background-white px-3.5 py-2.5 text-text-primary outline-none pr-9"
            tabIndex={enabled ? 0 : -1}
            disabled={!enabled}
          />
          {enabled && (
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
              tabIndex={-1}
            >
              <Image
                src={show ? "/icon/study-room/hide.svg" : "/icon/study-room/show.svg"}
                alt={show ? "숨기기" : "보이기"}
                width={14}
                height={14}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomPassword;
