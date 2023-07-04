import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: {
    type: String,
    enum:['Daily','bidays','tridays','biweek','monthly','quarterly','6months','yearly'],
    required: [true, "Please Enter title"],
  },
  pricing : [{"single":Number, "couple":Number, "group4":Number, "group10":Number}],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});   



       

export const Plan = mongoose.model("Plan", schema);
