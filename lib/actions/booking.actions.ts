'use server'
import connectDB from "@/lib/mongodb";
import {Booking} from "@/database";


export const createbooking=async ({
    eventId,  slug, email} : {
    eventId: string, slug: string, email: string
})=>{
    try {
         await connectDB();
         // Only persist fields defined in the Booking schema
         const created = await Booking.create({ eventId, email });
         // Return a minimal serializable response
        return  {success:true, booking: { id: String(created._id), eventId: String(created.eventId), email: created.email }}
    }catch (e) {
         console.log('create booking failed',e)
        return {success:false,e:e}
    }
}