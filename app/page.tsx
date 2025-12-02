import React from 'react'
import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache";


const BASE_URL= process.env.NEXT_PUBLIC_BASE_URL

const Page = async () => {
    'use cache'
    cacheLife('hours')

  let events: IEvent[] = [];

  try {
    const response = await fetch(`${BASE_URL}/api/events`, {
      cache: "no-store", // optional, but helpful while developing
    });

    if (!response.ok) {
      console.error("Failed to fetch events", response.status, response.statusText);
    } else {
      const data = await response.json();
      events = data?.events ?? [];
    }
  } catch (error) {
    console.error("Error fetching events", error);
  }

  return (
    <section>
      <h1>The Hub for every Dev <br /> Event you Cant Miss</h1>
      <p className="text-center mt-5">
        Hackathons , Meetups, and Conferences All AT One Place
      </p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events &&
            events.length > 0 &&
            events.map((event: IEvent) => (
              <li key={event._id}>
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};
  
export default Page