import mongoose from "mongoose";
const schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },

});

export const Qr = mongoose.model("Qr", schema);
