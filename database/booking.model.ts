import { Schema, model, models, Document, Types } from "mongoose";
import Event from "./event.model";

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string): boolean => EMAIL_REGEX.test(value),
        message: "Invalid email address",
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  },
);

// Index eventId for faster lookups by events
BookingSchema.index({ eventId: 1 });

// Pre-save hook to ensure the referenced events exists
BookingSchema.pre<IBooking>("save", async function () {
  const booking = this;

  const eventExists = await Event.exists({ _id: booking.eventId });
  if (!eventExists) {
    throw new Error("Cannot create booking: referenced events does not exist.");
  }
});

const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);

export default Booking;
