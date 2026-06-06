import { API_BASE } from "@/lib/api";
import { Event } from "@/types";

const EventService = {
    async getEvents(): Promise<Event[]> {
        try {
            const res = await fetch(
                `${API_BASE}content/events`,
                { next: { revalidate: 60 } }
            );
            if (!res.ok) return [];
            return res.json() as Promise<Event[]>;
        } catch {
            return [];
        }
    }, 
    
};

export default EventService;
