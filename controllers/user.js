import { asyncError } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/error.js";
import {
  cookieOptions,
  generateCode,
  getDataUri,
  sendEmail,
  sendToken,
} from "../utils/features.js";
import cloudinary from "cloudinary";

export const login = asyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Incorrect Email or Password", 400));
  }

  if (!password) return next(new ErrorHandler("Please Enter Password", 400));
  console.log("before");
  // Handle error
  const isMatched = await user.comparePassword(password);

  if (!isMatched) {
    return next(new ErrorHandler("Incorrect Email or Password", 400));
  }
  console.log(isMatched);
  sendToken(user, res, `Welcome Back, ${user.username}`, 200);
});

export const signup = asyncError(async (req, res, next) => {
  const { username, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("User Already Exist", 400));

  let avatar = undefined;

  if (req.file) {
    const file = getDataUri(req.file);
    const myCloud = await cloudinary.v2.uploader.upload(file.content);
    avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  user = await User.create({
    avatar,
    username,
    email,
    password,
  });

  generateCode(user._id, res);
});

export const logOut = asyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      ...cookieOptions,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

export const getMyProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  sendToken(user, res, `profile updated, ${user.username}`, 200);
  // res.status(200).json({
  //   success: true,
  //   user,
  // });
});

export const getNewTokens = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  sendToken(user, res, `refreshed tokens, ${user.username}`, 200);
  // res.status(200).json({
  //   success: true,
  //   user,
  // });
});

export const updateProfile = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const {
    username,
    email,
    address,
    city,
    country,
    pinCode,
    oldPassword,
    newPassword,
  } = req.body;

  console.log("body", req.body);
  if (username) user.username = username;
  if (email) user.email = email;
  if (address) user.address = address;
  if (city) user.city = city;
  if (country) user.country = country;
  if (pinCode) user.pinCode = pinCode;
  if (oldPassword && newPassword) {
    console.log("old", oldPassword);
    const isMatched = await user.comparePassword(oldPassword);
    console.log(isMatched);
    if (!isMatched)
      return next(new ErrorHandler("Incorrect Old Password", 400));
    user.password = newPassword;
  }
  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    user,
  });
});

export const changePassword = asyncError(async (req, res, next) => {
  // console.log(req.user)
  const user = await User.findById(req.user._id).select("+password");
  // console.log(user)
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(
      new ErrorHandler("Please Enter Old Password & New Password", 400)
    );

  const isMatched = await user.comparePassword(oldPassword);
  console.log(isMatched);
  if (!isMatched) return next(new ErrorHandler("Incorrect Old Password", 400));
  // res.status(200).json({
  //       success: true,
  //       message: "Password Changed Successully",
  //     });
  user.password = newPassword;
  await user.save();
  // console.log('guyy')
  res.status(200).json({
    success: true,
    message: "Password Changed Successully",
  });
});

export const updatePic = asyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const file = getDataUri(req.file);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  const myCloud = await cloudinary.v2.uploader.upload(file.content);
  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Avatar Updated Successfully",
  });
});

export const forgetpassword = asyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("Incorrect Email", 404));
  // max,min 2000,10000
  // math.random()*(max-min)+min

  const randomNumber = Math.random() * (999999 - 100000) + 100000;
  const otp = Math.floor(randomNumber);
  // 15minutes
  const otp_expire = 15 * 60 * 1000;

  user.otp = otp;
  user.otp_expire = new Date(Date.now() + otp_expire);
  await user.save();

  const message = `Your OTP for Reseting Password is ${otp}.\n Please ignore if you haven't requested this.`;
  try {
    await sendEmail("OTP For Reseting Password", user.email, message);
  } catch (error) {
    user.otp = null;
    user.otp_expire = null;
    await user.save();
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: `Email Sent To ${user.email}`,
  });
});

export const resetpassword = asyncError(async (req, res, next) => {
  const { otp, password } = req.body;

  const user = await User.findOne({
    otp,
    otp_expire: {
      $gt: Date.now(),
    },
  });

  if (!user)
    return next(new ErrorHandler("Incorrect OTP or has been expired", 400));

  if (!password)
    return next(new ErrorHandler("Please Enter New Password", 400));

  user.password = password;
  user.otp = undefined;
  user.otp_expire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully, You can login now",
  });
});

export const getAdminUsers = asyncError(async (req, res, next) => {
  const users = await User.find({});
  const newUsers = users.map((item, i) => {
    const { isActiveSub, username, email } = item;
    return {
      isActiveSub,
      username,
      email,
    };
  });
  // const outOfStock = products.filter((i) => i.stock === 0);

  res.status(200).json({
    success: true,
    newUsers,
  });
});

export const handleSubscription = asyncError(async (req, res, next) => {
  // const users = await User.find({});
  const users = await User.find();
  // Loop through each user and perform an action (replace this with your action)
  // Subtract 1 from the user's active days
  for (const user of users) {
    if (user.activeSubType > 0) {
      user.activeSubType -= 1;
    }

    // If active days are 0, set subscription to false
    if (user.activeSubType === 0) {
      user.isActiveSub = false;
    }
    // Save the updated user to the database
    await user.save();
  }
  // const outOfStock = products.filter((i) => i.stock === 0);

  res.status(200).json({
    success: true,
    message: "cron-job succeess",
  });
});
