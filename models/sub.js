import mongoose from "mongoose";

const schema = new mongoose.Schema({


  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  orderRef: { type: String, required: true },

benefit:
  {
    type:String,
    required: false,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  subType:{
    type: Number,
    enum:[1,7,14,30,90,180,365],
  },
});

export const Subs = mongoose.model("Subs", schema);
