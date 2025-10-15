'use client';

import { Editor, EditorContent, JSONContent, useEditor } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import showToast from '@/utils/showToast';
import Button from '../Button';
import Toolbar from './Toolbar';
import { isDocEmpty, useEditorDraft } from '@/hook/community/useEditorDraft';
import SubjectCombobox from './SubjectCombobox';
import DemographicSelect from './DemographicSelect';
import GroupSizeSelect from './GroupSizeSelect';
import { CategoryItem, CreatePostRequest, InitialPost, PostDetail } from '@/@types/community';
import { TIPTAP_EXTENSIONS } from '@/lib/tiptapExtensions';
import { safeSanitizeHtml } from '@/utils/safeSanitizeHtml';
import { ApiResponse } from '@/@types/type';
import { useCategoryRegisterMutation } from '@/hook/community/useCommunityPost';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/hook/useConfirm';
import { useMutation } from '@tanstack/react-query';
import { apiUploadFile } from '@/api/apiUploadFile';
import fileToDataUrl from '@/utils/fileToDataUrl';
import { useCategoryOptions } from '@/hook/community/useCategoryOptions';
import { processCategories, processImagesInContent } from '@/utils/editorHelpers';

type EditorProps = {
  initialData?: InitialPost;
  categoryData: CategoryItem[];
  onSubmitAction?: (data: CreatePostRequest) => Promise<ApiResponse<PostDetail>>;
};

function PostEditor({ initialData, categoryData, onSubmitAction }: EditorProps) {
  const isEditMode = !!initialData;
  const postId = initialData?.postId;
  const router = useRouter();
  const confirm = useConfirm();

  const DRAFT_KEY = isEditMode ? `draft:community:post:${postId}` : `draft:community:new`;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<Editor | null>(null);

  const { mutateAsync: registerCategory } = useCategoryRegisterMutation();

  const uploadMutation = useMutation({
    mutationFn: apiUploadFile,
    onError: (err: Error) => {
      console.error('이미지 업로드 실패:', err.message);
      showToast('error', '이미지 업로드에 실패했습니다.');
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const base64Url = await fileToDataUrl(file);
      editor.chain().focus().setImage({ src: base64Url, alt: file.name }).run();
    } catch (err) {
      showToast('error', '이미지 처리 중 오류가 발생했습니다.');
      console.error('Image Conversion Failed:', err);
    }
  }, []);

  const editorProps = useMemo(
    () => ({
      attributes: {
        class: 'prose max-w-none min-h-[240px] focus:outline-none prose-stone',
      },
      transformPastedHTML: (html: string) => {
        return safeSanitizeHtml(html, true);
      },
      handleDrop: (view: unknown, event: DragEvent) => {
        const hasFiles = event.dataTransfer?.files && event.dataTransfer.files.length > 0;
        if (hasFiles) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view: unknown, event: ClipboardEvent) => {
        const hasFiles = event.clipboardData?.files && event.clipboardData.files.length > 0;
        if (hasFiles) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
    }),
    [handleImageUpload]
  );

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: '',
    autofocus: isEditMode,
    editorProps,
    immediatelyRender: false,
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const categoryOptions = useCategoryOptions(categoryData);

  const {
    lastSavedAt,
    draft,
    clearDraft,
    runWithoutSaving,
    title,
    categories,
    setTitle,
    setCategories,
  } = useEditorDraft(editor, DRAFT_KEY, initialData, {
    debounceMs: 10000,
  });

  // 초기 데이터 로드
  useEffect(() => {
    if (!editor || editor.options.content) return;
    let contentToLoad: JSONContent | string | null | undefined = initialData?.content;

    // draft 있으면 덮어쓰기
    if (draft && draft.json && !isDocEmpty(draft.json)) {
      contentToLoad = draft.json;
    }

    if (contentToLoad) {
      editor.commands.setContent(contentToLoad);
    }
  }, [editor, initialData?.content, draft]);

  const handleCategoryRegistration = async (name: string) => {
    try {
      const newId = await registerCategory({ name, type: 'SUBJECT' });
      return newId;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editor || submitting) return;
    setSubmitting(true);

    try {
      const selectedNames = [categories[0], categories[1], categories[2]].filter(
        Boolean
      ) as string[];
      const { categoryIds, error: categoryError } = await processCategories(
        selectedNames,
        categoryOptions,
        handleCategoryRegistration
      );

      if (categoryError) {
        showToast('error', categoryError);
        return;
      }

      const htmlContent = editor.getHTML();
      const {
        content: finalHtml,
        thumbnailUrl,
        imageIds,
        error: imageError,
      } = await processImagesInContent(htmlContent, uploadMutation);

      if (imageError) {
        showToast('error', imageError);
        return;
      }
      // Request Body 생성
      const requestBody: CreatePostRequest = {
        title: title,
        content: finalHtml,
        categoryIds,
        thumbnailUrl,
        imageIds,
      };

      // 최종 /posts api 호출
      if (onSubmitAction) {
        const res = await onSubmitAction(requestBody);
        if (res?.success) {
          showToast(
            'success',
            isEditMode ? '게시글이 수정되었습니다.' : '게시글이 게시되었습니다.'
          );
          clearDraft();
          const targetId = res.data.postId || postId;
          if (targetId) router.push(`/community/${targetId}`);
          else router.push('/community');
        } else {
          showToast('error', '저장에 실패했습니다. 다시 시도해 주세요.');
          console.error(res?.message);
        }
      }
    } catch (error) {
      showToast('error', '게시글 처리 중 알 수 없는 오류가 발생했습니다.');
      console.error('Submit Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const confirmOk = await confirm({
      title: '작성을 취소하시겠습니까?',
      description: <>작성 중인 내용이 모두 사라집니다.</>,
      confirmText: '취소하기',
      cancelText: '돌아가기',
      tone: 'danger',
    });
    if (!confirmOk) return;

    runWithoutSaving(() => {
      setTitle('');
      setCategories([]);
      editor?.chain().focus().clearContent().run();
      clearDraft();
    });
    history.back();
  };

  const setFilter = (idx: 0 | 1 | 2, val: string) =>
    setCategories((prev) => {
      const next = [...(prev ?? [])];
      next[idx] = val;
      return next;
    });

  return (
    <div className="bg-background-white border-2 border-secondary-900 rounded-2xl flex flex-col items-center justify-start gap-6 p-6 w-full">
      <h3 className="font-bold text-xl sm:text-2xl w-full text-left">
        {isEditMode ? '그룹 모집글 수정' : '그룹 모집글 작성'}
      </h3>
      <form
        className="flex flex-col gap-4 w-full editor"
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      >
        <div className="flex w-full gap-4">
          {/* 제목 */}
          <div className="flex flex-col w-1/2 gap-2">
            <label htmlFor="community-title" className="text-xs">
              제목
            </label>
            <input
              type="text"
              name="Title"
              id="community-title"
              placeholder="제목을 입력하세요"
              autoFocus={!isEditMode}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-background-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary-400"
              required
            />
          </div>
          {/* 옵션 1 */}
          <div className="flex flex-col w-1/2 gap-2">
            <SubjectCombobox
              value={categories[0] ?? ''}
              onChange={(v) => {
                const normalized = Array.isArray(v) ? (v[0] ?? '') : v;
                setFilter(0, normalized);
              }}
              placeholder="공부 과목을 입력하세요"
              options={categoryOptions.subject}
              allowMultiSelect={false}
              // 원하는 과목이 없으면 직접 입력
              allowCustom={true}
              label="스터디 주제/과목"
            />
          </div>
        </div>
        <div className="flex w-full gap-4">
          {/* 옵션 2 */}
          <div className="flex flex-col w-1/2 gap-2">
            <DemographicSelect
              value={categories[1] ?? ''}
              onChange={(v) => {
                const normalized = Array.isArray(v) ? (v[1] ?? '') : v;
                setFilter(1, normalized);
              }}
              placeholder="연령대 선택..."
              options={categoryOptions.demographic}
              label="연령대"
            />
          </div>
          {/* 옵션 3 */}
          <div className="flex flex-col w-1/2 gap-2">
            <GroupSizeSelect
              value={categories[2] ?? ''}
              onChange={(v) => {
                const normalized = Array.isArray(v) ? (v[2] ?? '') : v;
                setFilter(2, normalized);
              }}
              placeholder="모집할 최대 인원 선택..."
              options={categoryOptions.groupSize}
              label="모집 인원"
            />
          </div>
        </div>
        {/* 본문 에디터 */}
        <div className="w-full flex flex-col gap-2">
          <label htmlFor="contents" className="text-xs">
            내용
          </label>
          <div className="rounded-md border border-gray-300 p-3 max-h-[80vh] overflow-auto">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
          <input type="hidden" name="content_html" />
          <input type="hidden" name="content_json" />

          {lastSavedAt && (
            <p className="text-gray-400 text-xs">
              {`작성 중인 내용을 임시 저장합니다. (마지막 저장 시간: ${new Date(lastSavedAt).toLocaleTimeString()})`}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2 sm:gap-4 md:gap-6 w-full sm:flex-row items-center justify-center sm:justify-end">
          <Button
            type="submit"
            size="md"
            name="intent"
            value="publish"
            disabled={submitting}
            className="!self-center sm:!self-auto w-full sm:w-48"
          >
            {isEditMode ? '수정하기' : '게시하기'}
          </Button>
          <Button
            type="button"
            size="md"
            borderType="outline"
            disabled={submitting}
            onClick={handleCancel}
            className="!self-center sm:!self-auto w-full sm:w-48"
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
export default PostEditor;
