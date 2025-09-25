'use client';

import CommentList from '@/components/community/CommentList';
import CommunityContents from '@/components/community/CommunityContents';
import Spinner from '@/components/Spinner';
import { useComments, usePost } from '@/hook/useCommunityPost';

function ContentsDetail({ postId }: { postId: string }) {
  const { data: post, isLoading: loadingPost } = usePost(postId);
  const { data: comments, isLoading: loadingComments } = useComments(postId);

  // const loadingPost = true;
  // const loadingComments = true;

  if (loadingPost || loadingComments)
    return (
      <div className="h-full w-full">
        <Spinner />
      </div>
    );

  // 나중에 에러fallback으로 수정할 것
  if (!post)
    return (
      <div className="h-full w-full">
        <p className="text-error-500">게시글을 찾을 수 없습니다.</p>
      </div>
    );

  return (
    <div className="mx-auto flex flex-col gap-3">
      <CommunityContents post={post} />
      {comments && <CommentList comments={comments} />}
    </div>
  );
}
export default ContentsDetail;
