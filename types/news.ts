export type NewsPost = {
  id: number;
  title: string;
  slug: string | null;
  body: string;
  coverUrl: string | null;
  publishedAt: string | null;
};