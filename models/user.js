import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please Enter Name"],
  },

  email: {
    type: String,
    required: [true, "Please Enter Email"],
    unique: [true, "Email Already Exist"],
    validate: validator.isEmail,
  },
  password: {
    type: String,
    required: [true, "Please Enter Password"],
    minLength: [6, "Password must be at least 6 characters long"],
    select: false,
  },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  avatar: {
    public_id: String,
    url: String,
  },
  otp: Number,
  otp_expire: Date,

  isPauseSub: {
    type: Boolean,
    default: false,
  },
  isActiveSub: {
    type: Boolean,
    default: false,
  },
  pauseCount: {
    type: Number,
    default: 0,
  },
  subscribers: [
    {
      email: String,
    },
  ],
  subAt: { type: Date },
  activeSubType: {
    type: Number,
    default: 0,
  },
  userCode: String,
});

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

schema.methods.comparePassword = async function (enteredPassword) {
  console.log(this);
  console.log(enteredPassword);
  return await bcrypt.compare(enteredPassword, this.password);
};

schema.methods.generateToken = function () {
  const refresh_token = jwt.sign(
    { _id: this._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  const access_token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const toks = {
    refresh_token,
    access_token,
  };
  return toks;
};

export const User = mongoose.model("User", schema);
