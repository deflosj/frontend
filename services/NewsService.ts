import { API_BASE } from "@/lib/api";
import { NewsPost } from "@/types";

const NewsService = {
    async getNews(): Promise<NewsPost[]> {
        try {
            const res = await fetch(
                `${API_BASE}content/news`,
                { next: { revalidate: 3600 } }
            );
            if (!res.ok) return [];
            return await res.json() as Promise<NewsPost[]>;
        } catch {
            return [];
        }
    }, 
    
};

export default NewsService;
