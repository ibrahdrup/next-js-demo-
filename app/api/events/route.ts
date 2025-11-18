import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

// POST /api/events
// Accepts a JSON body with all required Event fields and creates a new Event document.
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      title,
      description,
      overview,
      image,
      venue,
      location,
      date,
      time,
      mode,
      audience,
      agenda,
      organizer,
      tags,
    } = body;

    // Basic presence check to fail fast with a 400 instead of a generic 500.
    if (
      !title ||
      !description ||
      !overview ||
      !image ||
      !venue ||
      !location ||
      !date ||
      !time ||
      !mode ||
      !audience ||
      !organizer ||
      !Array.isArray(agenda) ||
      agenda.length === 0 ||
      !Array.isArray(tags) ||
      tags.length === 0
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields for Event." },
        { status: 400 },
      );
    }

    const createdEvent = await Event.create({
      title,
      description,
      overview,
      image,
      venue,
      location,
      date,
      time,
      mode,
      audience,
      agenda,
      organizer,
      tags,
    });

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          message: "Event validation failed",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
