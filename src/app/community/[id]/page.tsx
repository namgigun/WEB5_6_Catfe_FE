import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import ContentsDetail from './ContentsDetail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Catfé | Community Post #${id}`,
  };
}

/* 
  저장할 때 -> tiptap editor 에서 html을 json으로 저장
  불러올 때 -> Tiptap JSON을 html로 뿌려야 함
 */

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const qc = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <div className="min-h-dvh px-auto max-w-[1200px] flex justify-center items-start py-8">
        <div className="w-7/8 rounded-2xl border-2 border-secondary-900 p-8 mx-auto">
          <ContentsDetail postId={postId} />
        </div>
      </div>
    </HydrationBoundary>
  );
}
export default Page;
