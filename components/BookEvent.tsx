"use client";
import React, { useState } from "react";
import { createbooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";

interface BookEventProps {
  eventId: string;
  slug: string;
}

const BookEvent = ({ eventId, slug }: BookEventProps) => {
  const [email, setEmail] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const result = await createbooking({ eventId, slug, email });
      if (result?.success) {
        setSubmitted(true);
        posthog.capture('event_booked',{eventId,slug,email})
      } else {
        setError("Subscription failed. Please try again.");
        posthog.captureException(error)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            placeholder="Enter your email address"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" className="button-submit">
            Submit
          </button>
        </form>
      )}
    </div>
  );
};
export default BookEvent;
