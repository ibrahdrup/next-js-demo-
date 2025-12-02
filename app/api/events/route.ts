import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import {v2 as cloudinary} from 'cloudinary'


// POST /api/events
// Accepts a JSON body with all required Event fields and creates a new Event document.
export async function POST(req: NextRequest)  {
  try {
    await connectDB();
      console.log("Content-Type:", req.headers.get("content-type"));
      try {
          // Clone the request to read text without consuming the stream for formData()
          const text = await req.clone().text();
          console.log("Raw Body Preview:", text.substring(0, 500));
      } catch (e) {
          console.log("Could not read raw body:", e);
      }
    // Expect multipart/form-data with both text fields and an image file.
    const formData = await req.formData ();

      console.log("Hello test")
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const overview = formData.get("overview") as string | null;
    const venue = formData.get("venue") as string | null;
    const location = formData.get("location") as string | null;
    const date = formData.get("date") as string | null;
    const time = formData.get("time") as string | null;
    const mode = formData.get("mode") as string | null;
    const audience = formData.get("audience") as string | null;
    const organizer = formData.get("organizer") as string | null;
    // Raw values (may be JSON string, comma-separated string, or multiple fields)
    const agendaRaw = formData.get("agenda") as string | null;
    const tagsRaw = formData.get("tags") as string | null;
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );
    }
    // Normalize agenda and tags from form-data
    // Support formats:
    // - Multiple fields: agenda=Item1&agenda=Item2
    // - JSON array string: agenda=["Item1","Item2"]
    // - Comma-separated string: agenda="Item1, Item2"
    const parseList = (values: FormDataEntryValue[], singleFallback: string | null, fieldName: string): string[] => {
      // If multiple entries, treat them as a list
      if (values.length > 1) {
        return values
          .map(v => (typeof v === 'string' ? v : ''))
          .map(s => s.trim())
          .filter(Boolean);
      }
      // Single entry (or none)
      const single = (values[0] ?? singleFallback) as string | null;
      if (!single) return [];
      const trimmed = single.trim();
      if (!trimmed) return [];
      // Try JSON array first if it looks like JSON
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const arr = JSON.parse(trimmed);
          if (Array.isArray(arr)) {
            return arr
              .map((x) => (typeof x === 'string' ? x : String(x)))
              .map((s) => s.trim())
              .filter(Boolean);
          }
        } catch (e) {
          // fall through to comma-separated parsing below
        }
      }
      // Fallback: comma-separated
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const agendaValues = formData.getAll('agenda');
    const tagsValues = formData.getAll('tags');

    const agenda = parseList(agendaValues, agendaRaw, 'agenda');
    const tags = parseList(tagsValues, tagsRaw, 'tags');

    // Convert comma-separated strings into arrays; adjust if you send JSON instead.
    // const agenda = agendaRaw
    //   ? agendaRaw.split(",").map((s) => s.trim()).filter(Boolean)
    //   : [];
    // const tags = tagsRaw
    //   ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    //   : [];

    // Basic presence check to fail fast with a 400 instead of a generic 500.
    if (
        !title ||
        !description ||
        !overview ||
        !venue ||
        !location ||
        !date ||
        !time ||
        !mode ||
        !audience ||
        !organizer ||
        agenda.length === 0 ||
        tags.length === 0
    ) {

        return NextResponse.json(
            {
                message: "Missing or invalid required fields for Event.",
                received: {
                    title,
                    description,
                    overview,
                    venue,
                    location,
                    date,
                    time,
                    mode,
                    audience,
                    organizer,
                    agendaCount: agenda.length,
                    tagsCount: tags.length,
                },
            },
            { status: 400 },
        );
    }


      // const imageBuffer = await file.arrayBuffer();


    const imageBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Upload the image buffer to Cloudinary and type the result to avoid TS18046 (unknown type)
    const uploadResult = await new Promise<import("cloudinary").UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "DevEvent" },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Cloudinary upload returned no result"));
          resolve(result);
        },
      );
      stream.end(buffer);
    });

    const event = {
      title,
      description,
      overview,
      image: uploadResult.secure_url,
      venue,
      location,
      date,
      time,
      mode,
      audience,
      agenda,
      organizer,
      tags,
    };

    // Create the event document with the assembled payload
    const createdEvent = await Event.create(event);




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

export async  function GET(req: NextRequest) {
      try{
          await connectDB();

          const events = await Event.find().sort({ createdAt: -1 });


          return NextResponse.json({message: "Events fetched successfully", events},{status:200});
      }
      catch (e) {
          return  NextResponse.json({message:'Event fetching failed', error:e})
      }
}
