import Link from "next/link";
import { notFound } from "next/navigation";
import { API_BASE } from "@/lib/api";

type NewsPost = {
  id: number;
  title: string;
  slug: string | null;
  body: string;
  coverUrl: string | null;
  publishedAt: string | null;
};

async function fetchAll(): Promise<NewsPost[]> {
  try {
    const res = await fetch(`${API_BASE}content/news`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json() as Promise<NewsPost[]>;
  } catch {
    return [];
  }
}

export default async function NewsArticlePage(props: any) {
  const { params } = props ?? {};
  const all = await fetchAll();
  const slug = params?.slug;
  const post = all.find((p) => p.slug === slug) ?? all.find((p) => String(p.id) === slug);
  if (!post) return notFound();

  return (
    <div>
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-24">
        <Link href="/" className="text-sm text-ink-2 hover:underline">← Terug</Link>

        <article className="mt-6">
          <h1 className="text-3xl font-bold text-ink">{post.title}</h1>
          {post.publishedAt && (
            <p className="mt-2 text-sm text-ink-2">{new Date(post.publishedAt).toLocaleDateString("nl-BE")}</p>
          )}

          {post.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt={post.title} className="w-full mt-6 rounded-lg object-cover" />
          )}

          <div className="mt-6 text-ink-2" dangerouslySetInnerHTML={{ __html: post.body }} />
        </article>
      </section>
    </div>
  );
}
