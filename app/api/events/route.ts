import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import {v2 as cloudinary} from 'cloudinary'


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

    // Refactor: build an explicit event object before creation
    const event = {
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
    };

    const file  = formData.get('image') as File;

    if(!file){
        return NextResponse.json({
            message: 'Image file is required'
        },{status:400})
    }

    const imageBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(imageBuffer);

    const uploadResult =  await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream((error, result) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image', folder :'DevEvent'},(error,results)=>{
                        if(error) return reject(error);

                    }

                ).end(buffer);
            })
    })

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
