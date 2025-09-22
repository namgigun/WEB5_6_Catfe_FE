"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import clsx from "clsx";
import CustomSelect from "../CustomSelect";
import Button from "../Button";

export type RoomInfoValue = {
  title: string;
  description: string;
  maxMember: number;
  isPrivate: boolean;
  coverPreviewUrl: string | null;
  coverUploadFile?: File | null;
};

type RoomInfoProps = {
  defaultValue?: Partial<RoomInfoValue>;
  onChange?: (value: RoomInfoValue) => void;
  className?: string;
  mediaEnabled?: boolean;
};

function RoomInfo({ defaultValue, onChange, className, mediaEnabled = false }: RoomInfoProps) {
  const [title, setTitle] = useState(defaultValue?.title ?? "");
  const [desc, setDesc] = useState(defaultValue?.description ?? "");
  const [maxMember, setMaxMember] = useState(defaultValue?.maxMember ?? 2);
  const [isPrivate] = useState(defaultValue?.isPrivate ?? false);

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
    defaultValue?.coverPreviewUrl ?? null
  );
  const [coverUploadFile, setCoverUploadFile] = useState<File | null>(
    defaultValue?.coverUploadFile ?? null
  );

  const TITLE_MAX = 15;
  const DESC_MAX = 30;

  const onChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(e.target.value.slice(0, TITLE_MAX));
  const onChangeDesc = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setDesc(e.target.value.slice(0, DESC_MAX));

  const fileRef = useRef<HTMLInputElement>(null);
  const onPickImage = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setCoverPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return prev;
    });

    const url = URL.createObjectURL(f);
    setCoverPreviewUrl(url);
    setCoverUploadFile(f);
  };

  useEffect(() => {
    return () => {
      if (coverPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const MAX_WITH_MEDIA = 4;
  const MAX_DEFAULT = 20;
  const maxCap = mediaEnabled ? MAX_WITH_MEDIA : MAX_DEFAULT;

  useEffect(() => {
    setMaxMember((prev) => (prev > maxCap ? maxCap : prev));
  }, [maxCap]);

  const members = useMemo(
    () => Array.from({ length: maxCap - 1 }, (_, i) => i + 2),
    [maxCap]
  );

  useEffect(() => {
    onChange?.({
      title,
      description: desc,
      maxMember,
      isPrivate,
      coverPreviewUrl,
      coverUploadFile,
    });
  }, [title, desc, maxMember, isPrivate, coverPreviewUrl, coverUploadFile, onChange]);

  return (
    <div className={clsx("w-full", className)}>
      <section className="flex flex-col gap-5">
        {/* 스터디룸 이름 */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-medium text-text-primary">
            <span>스터디룸 이름</span>
            <span className="text-text-secondary">{title.length} / {TITLE_MAX}</span>
          </label>
          <input
            value={title}
            onChange={onChangeTitle}
            placeholder="스터디룸 이름을 입력해주세요"
            className="w-full rounded-xl border text-[10px] border-text-secondary/60 bg-background-white px-3.5 py-2.5 outline-none focus:border-text-primary"
          />
        </div>

        {/* 스터디룸 소개 */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-medium text-text-primary">
            <span>스터디룸 소개</span>
            <span className="text-text-secondary">{desc.length} / {DESC_MAX}</span>
          </label>
          <textarea
            value={desc}
            onChange={onChangeDesc}
            placeholder="간단한 소개를 입력해주세요"
            rows={3}
            className="w-full resize-none rounded-xl border border-text-secondary/60 bg-background-white px-3.5 py-2.5 outline-none focus:border-text-primary text-[10px]"
          />
        </div>

        {/* 썸네일 변경 */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs text-text-primary">스터디룸 썸네일</span>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            <Button
              type="button"
              size="sm"
              borderType="solid"
              color="secondary"
              onClick={onPickImage}
              className="px-4 self-center hover:brightness-95 text-xs"
            >
              이미지 변경
            </Button>
          </div>
        </div>

        {/* 최대 인원 */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-text-primary text-xs">최대 인원</span>
          <CustomSelect
            value={maxMember}
            onChange={(v) => setMaxMember(v as number)}
            options={members.map((n) => ({ label: String(n), value: n }))}
            size="sm"
            placement="bottom"
            menuMaxHeight={220}
            menuWidth={88}
          />
        </div>
      </section>
    </div>
  );
}

export default RoomInfo;
