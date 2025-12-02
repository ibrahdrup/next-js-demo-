import React from 'react'
import {notFound} from "next/navigation";
const BASE_URL= process.env.NEXT_PUBLIC_BASE_URL
import Image from "next/image";
import { IEvent } from "@/database/event.model";
import BookEvent from "@/components/BookEvent";
import {getSimilarEventsBySlug} from "@/lib/actions/event.actions";
import EventCard from "@/components/EventCard";
import {cacheLife} from "next/cache";


const EventDetailsItem  = ({
    icon, alt, label } :{icon:string; alt:string ; label:string})=>(
    <div className="flex flex-row gap-2 items-center">
      <Image src={icon} alt={alt} width={17} height={17}/>
        <p>{label}</p>
    </div>
)

const EventAgenda = ({
    agendaItems
                     }:{
    agendaItems:string[]
})=>(
    <div className={"agenda"}>
        <h2>Agenda</h2>
        <ul>
            {agendaItems.map((item)=>(
                <li key={item}>{item}</li>
            ))}
        </ul>

    </div>
)

const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex gap-1.5 flex-wrap">
        {tags.map((tag) => (
            <div className="pill" key={tag}>
                {tag}
            </div>
        ))}
    </div>
);


const EventDetailsPage =

    async ({ params }: { params: { slug: string } }) => {

    'use cache'
        cacheLife('hours')

    const { slug } =await params;


    // Use the top-level BASE_URL
    let eventData: IEvent | null = null;

    try {
        const request = await fetch(`${BASE_URL}/api/events/${slug}`);

        if (!request.ok) {
            console.error("Failed to fetch event details", request.status, request.statusText);
            return notFound();
        }

        eventData = await request.json();
    } catch (error) {
        console.error("Error fetching event details", error);
        return notFound();
    }

    const {
        description,
        image,
        title,
        location,
        date,
        time,
        overview,
        tags,
        agenda,
        mode,
        audience,
        organizer,
    } = eventData || {};

    const bookings= 10;

    if (!description) return notFound();

    let parsedAgenda: string[] = [];
    let parsedTags: string[] = [];

    try {
        parsedAgenda = Array.isArray(agenda) ? agenda : JSON.parse(agenda || "[]");
    } catch (e) {
        console.error("Failed to parse agenda", e);
        parsedAgenda = [];
    }

    try {
        parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags || "[]");
    } catch (e) {
        console.error("Failed to parse tags", e);
        parsedTags = [];
    }

    const  similarEvents: IEvent[]= await getSimilarEventsBySlug(slug)

    // Safely extract eventId from the fetched data (API returns Mongo _id)
    const eventId: string = ((eventData as unknown as { _id?: { toString?: () => string } })?._id?.toString?.()) || "";

    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p>{description}</p>


            </div>

            <div className={"content"}>
                <Image
                    src={image ?? "/images/placeholder.png"}
                    alt="Event Banner"
                    width={800}
                    height={800}
                    className="banner"
                />


                <section className="flex flex-col gap-2">
                    <h2>Overview</h2>
                    <p>{overview}</p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2>Event Details</h2>
                    <EventDetailsItem icon="/icons/calendar.svg" alt="calendar" label={date ?? ""} />
                    <EventDetailsItem icon="/icons/clock.svg" alt="time" label={time ?? ""} />
                    <EventDetailsItem icon="/icons/pin.svg" alt="pin" label={location ?? ""} />
                    <EventDetailsItem icon="/icons/mode.svg" alt="mode" label={mode ?? ""} />
                    <EventDetailsItem icon="/icons/audience.svg" alt="audience" label={audience ?? ""} />

                </section>

                <EventAgenda agendaItems={parsedAgenda} />

                <section className="flex flex-col gap-2">
                    <h2>About Organizer</h2>
                    <p>{organizer}</p>
                </section>

                <EventTags tags={parsedTags} />
            </div>


            <div className={"details"}>
                <aside className="booking">
                   <div className="signup-card"></div>
                        <h2>Book Your Spot</h2>
                    {
                        bookings>0?
                            (
                               <p className="text-sm">
                                            Join the {bookings} spots left!
                               </p>
                            ):
                            (<p className="text-sm">
                                Be the first to know when the event starts!
                            </p>)
                    }
                    {eventId ? (
                        <BookEvent eventId={eventId} slug={slug} />
                    ) : null}

                </aside>
            </div>
            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.length > 0 && similarEvents.map((similarEvent) => (
                        <EventCard key={similarEvent.slug} {...similarEvent} />
                    ))}
                </div>
            </div>
        </section>
    )
}
export default EventDetailsPage
