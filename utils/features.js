import DataUriParser from "datauri/parser.js";
import path from "path";
import { createTransport } from "nodemailer";
// import { User } from "../models/user";
import { User } from "../models/user.js";
import { Qr } from "../models/qr.js";
import  QR from "qrcode";
import jwt from "jsonwebtoken";



export const getDataUri = (file) => {
  const parser = new DataUriParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

export const sendToken = (user, res, message, statusCode) => {
  const token = user.generateToken();

  res
    .status(statusCode)
    // .cookie("token", token, {
    //   ...cookieOptions,
    //   15.15 days..1..1day expire
    //   expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    // })
    .json({
      success: true,
      message: message,
      token,
      user
    });     
};

export const generateCode=async (userId,res)=>{
try {

  // Validate user input
  if (!userId) {
    res.status(400).send("User Id is required");
  }
      

  const user = await User.findById(userId);

  // Validate is user exist
  if (!user) { 
    res.status(400).send("User not found");
  }

  const qrExist = await Qr.findOne({ userId });

  // If qr exist, update disable to true and then create a new qr record
  if (!qrExist) {
    await Qr.create({ userId });
  } else {
    await Qr.findOneAndUpdate({ userId }, { $set: { disabled: true } });
    await Qr.create({ userId });
  }

  // Generate encrypted data
  const encryptedData = jwt.sign(
    { userId: user._id, email:user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "700d",
    }
  );

  // Generate qr code
  const dataImage = await QR.toDataURL(encryptedData);
  user.userCode = dataImage;
  await user.save();
  return res.status(201).json({  success: true,
    message: 'Registered Successfully' });
  }
 catch (err) {
  console.log(err);
}

}

     

export const cookieOptions = {
  secure: process.env.NODE_ENV === "Development" ? false : true,
  httpOnly: process.env.NODE_ENV === "Development" ? false : true,
  sameSite: process.env.NODE_ENV === "Development" ? false : "none",
};

export const sendEmail = async (subject, to, text) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });



  await transporter.sendMail({
    to,
    subject,
    text,
  });
};
