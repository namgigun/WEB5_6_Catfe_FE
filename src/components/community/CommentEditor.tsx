import { CommentTarget, useCommentEditor } from '@/hook/community/useCommentEditor';
import Button from '../Button';

interface CommentEditorProps {
  target: CommentTarget;
  onSubmit: (data: {
    postId: number;
    parentCommentId?: number;
    commentId?: number;
    content: string;
  }) => Promise<void>;
  className?: string;
  initialContent?: string;
  isEditMode?: boolean;
  onCancel?: () => void;
}

function CommentEditor({
  target,
  onSubmit,
  className,
  initialContent,
  isEditMode,
  onCancel,
}: CommentEditorProps) {
  const {
    isReply,
    editorId,
    value,
    setValue,
    submitting: isSubmitting,
    disabled,
    textareaRef,
    resize,
    handleKeyDown,
    submitComment,
    cancel,
    contentLength,
    limit,
  } = useCommentEditor({ target, onSubmit, initialContent, isEditMode, onCancel });

  const showCancelButton = isEditMode || (value.length > 0 && !isSubmitting);
  const submitButtonLabel = isEditMode ? '수정' : '등록';

  return (
    <div
      className={[
        'rounded-lg border border-secondary-800/40 bg-background-white p-3 flex flex-col gap-2',
        className ?? '',
      ].join(' ')}
    >
      <label htmlFor={editorId} className="sr-only">
        {isReply
          ? isEditMode
            ? '대댓글 수정'
            : '대댓글 입력'
          : isEditMode
            ? '댓글 수정'
            : '댓글 입력'}
      </label>
      <textarea
        id={editorId}
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onInput={resize}
        onKeyDown={handleKeyDown}
        placeholder={
          isEditMode
            ? '댓글 내용을 수정하세요'
            : isReply
              ? '답글을 입력하세요'
              : '댓글을 남겨보세요'
        }
        className="w-full resize-none outline-none text-sm leading-6 placeholder:text-text-secondary disabled:opacity-70 bg-background-white p-3 rounded-lg border border-secondary-800/40 focus:ring-2 focus:ring-secondary-400"
        rows={1}
        maxLength={limit + 1}
        disabled={isSubmitting}
      />
      {/* helper footer */}
      <div className="flex items-center justify-between text-xs text-text-secondary/50">
        <span className="whitespace-nowrap text-xs">
          <strong className={contentLength > limit ? 'text-error-500' : 'text-text-secondary'}>
            {contentLength}
          </strong>{' '}
          / {limit}
        </span>
        {/* button group */}
        <div className="w-full flex justify-end items-center gap-3">
          {showCancelButton && (
            <Button
              size="sm"
              color="secondary"
              borderType="outline"
              disabled={isSubmitting}
              onClick={cancel}
            >
              취소
            </Button>
          )}
          <Button
            size="sm"
            color="primary"
            borderType="solid"
            disabled={disabled}
            onClick={submitComment}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? `${submitButtonLabel} 중...` : submitButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default CommentEditor;
