'use server'

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export const getSimilarEventsBySlug = async (slug:string)=>{
    try {
        await connectDB();
        const event = await Event.findOne({ slug }).lean();
        if (!event || !Array.isArray(event.tags) || event.tags.length === 0) {
            return [];
        }

        // Find other events that share at least one tag, excluding the current event
        const similar = await Event.find(
            {
                _id: { $ne: event._id },
                tags: { $in: event.tags },
            },
            // Project only fields needed by the card
            {
                title: 1,
                image: 1,
                slug: 1,
                location: 1,
                date: 1,
                time: 1,
            }
        )
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        return Array.isArray(similar) ? similar : [];
    }
    catch (e) {
        return []
    }
}