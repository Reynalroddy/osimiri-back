import { User } from "../models/user.js";
import ErrorHandler from "../utils/error.js";
import jwt from "jsonwebtoken";
import { asyncError } from "./error.js";

export const isAuthenticated = asyncError(async (req, res, next) => {
  // const token = req.cookies.token;
  const authHeader = req.headers.authorization;
  console.log(req.headers);
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new ErrorHandler("Authentication invalid", 401));
  }
  
  const token = authHeader.split(" ")[1];

  if (!token) return next(new ErrorHandler("Not Logged In", 401));

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData._id);

  next();
});


// const authHeader = req.headers.authorization;
// if (!authHeader || !authHeader.startsWith("Bearer")) {
//   throw new UnauthenticatedError("Authentication invalid");
// }

// const token = authHeader.split(" ")[1];
// try {
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);

//   //attach user to the job route

//   req.user = { userId: decoded.userId, name: decoded.name };
//   next();
// } catch (error) {
//   throw new UnauthenticatedError("not authorized");
// }

export const isAdmin = asyncError(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new ErrorHandler("Only Admin allowed", 401));
  next();
});
