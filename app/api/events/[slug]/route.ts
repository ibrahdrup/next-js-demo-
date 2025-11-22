import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Event, { type IEvent } from "@/database/event.model";

// Shape of the dynamic route params expected by Next.js App Router
interface EventSlugParams {
  params: {
    slug?: string;
  };
}

/**
 * GET /api/events/[slug]
 *
 * Returns the events matching the given slug.
 */
export async function GET(
  _req: NextRequest,
  { params }: EventSlugParams,
): Promise<NextResponse> {
  try {
    const { slug } = params ?? {};

    // Validate slug presence
    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { message: "Missing or invalid 'slug' parameter." },
        { status: 400 },
      );
    }

    await connectDB();

    const normalizedSlug = slug.trim().toLowerCase();

    // Use lean() to return a plain object instead of a full Mongoose document
    const event = (await Event.findOne({ slug: normalizedSlug }).lean()) as
      | (Omit<IEvent, "_id"> & { _id: mongoose.Types.ObjectId })
      | null;

    if (!event) {
      return NextResponse.json(
        { message: "Event not found.", slug: normalizedSlug },
        { status: 404 },
      );
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("GET /api/events/[slug] failed", error);

    if (error instanceof mongoose.Error.CastError) {
      // Handle potential casting issues, though slug is a string field.
      return NextResponse.json(
        {
          message: "Invalid slug format.",
          error: error.message,
        },
        { status: 400 },
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          message: "Event validation error.",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to fetch events.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
