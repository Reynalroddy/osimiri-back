import { asyncError } from "../middlewares/error.js";
import { Subs } from "../models/sub.js";
// import { Product } from "../models/product.js";
import ErrorHandler from "../utils/error.js";
import { stripe } from "../server.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import { User } from "../models/user.js";
import cron from "node-cron";
// export const processPayment = asyncError(async (req, res, next) => {
//   const { totalAmount } = req.body;

//   const { client_secret } = await stripe.paymentIntents.create({
//     amount: Number(totalAmount * 100),
//     currency: "inr",
//   });

//   res.status(200).json({
//     success: true,
//     client_secret,
//   });
// });

// export const pays = async (req, res) => {
//   const secret = process.env.PAY_SECRET;
//   // console.log(req.body);
//   //add reference and callback_url
//   var data = req.body.config;
//   var config = {
//     method: "post",
//     url: "https://api.paystack.co/transaction/initialize",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${secret}`,
//     },
//     data: data,
//   };

//   const ress = await axios(config);
//   // console.log(config);
//   res.status(200).json({ success: true, data: ress.data });
// };

export const check = async (req, res) => {
  const secret = process.env.PAY_SECRET;
  var hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash == req.headers["x-paystack-signature"]) {
    // Retrieve the request's body
    var event = req.body;
    // Do something with event
    const { reference } = event.data;
    console.log(event.data);
    console.log(reference);
    const ordz = await Order.findOne({ orderRef: reference });
    // console.log(ordz);
    if (ordz) {
      ordz.isPaid = true;
      ordz.paidAt = Date.now();
      const newords = await ordz.save();
    }
    // console.log(event);
  }
  res.sendStatus(200);
};

export const very = async (req, res) => {
  const secret = process.env.PAY_SECRET;

  const { ref } = req.body;
  console.log(ref);
  var config = {
    method: "get",
    url: "https://api.paystack.co/transaction/verify/" + ref,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
  };

  const ress = await axios(config);

  res.json({ success: true, data: ress.data });
};

export const pays = async (req, res) => {
  const secret = process.env.PAY_SECRET;
  // console.log(req.body);
  //add reference and callback_url
  var data = req.body;
  var config = {
    method: "post",
    url: "https://api.paystack.co/transaction/initialize",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    data: data,
  };

  const ress = await axios(config);
  // console.log(config);
  res.status(200).json({ success: true, data: ress.data });
};

export const createSub = asyncError(async (req, res, next) => {
  const { email, amount, reference, callback_url, subType } = req.body;

  const sub = await Subs.create({
    orderRef: reference,
    totalAmount: amount / 100,
    user: req.user._id,
    subType,
  });

  if (!sub) return next(new ErrorHandler("Unable to create subscription", 400));

  const secret = process.env.PAY_SECRET;
  // console.log(req.body);
  //add reference and callback_url
  var data = {
    email,
    amount,
    callback_url,
    reference,
  };
  var config = {
    method: "post",
    url: "https://api.paystack.co/transaction/initialize",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    data: data,
  };

  const ress = await axios(config);
  // console.log(config);
  res.status(200).json({ success: true, data: ress.data });
  // res.status(201).json({
  //   success: true,
  //   message: "make payment",
  // });
});

export const getAdminOrders = asyncError(async (req, res, next) => {
  const orders = await Order.find({});
  // console.log('guy')
  // console.log(orders)
  res.status(200).json({
    success: true,
    orders,
  });
});

export const getMyOrders = asyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  console.log(orders);
  res.status(200).json({
    success: true,
    orders,
  });
});

export const checkSub = asyncError(async (req, res, next) => {
  // const user = await User.find({ _id: req.user._id });
  const { toks } = req.body;
  console.log(req.body);
  const decodedData = jwt.verify(toks, process.env.JWT_SECRET);
  // console.log(decodedData)
  const user = await User.findById(decodedData.userId);
  console.log(`user:${user}`);
  let respy = "";
  if (user?.isActiveSub === true) {
    respy = "user subscription is active.";
  } else {
    respy = "user subscription is not active.";
  }

  res.status(200).json({
    success: true,
    message: respy,
  });
});

export const getOrderDetails = asyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  res.status(200).json({
    success: true,
    order,
  });
});

export const deleteOrder = asyncError(async (req, res, next) => {
  console.log(req);
  const ords = await Order.findById(req.params.id);
  if (!ords) return next(new ErrorHandler("order not found", 404));

  // console.log(ords)
  await ords.remove();
  res.status(200).json({
    success: true,
    message: "order Deleted Successfully",
  });
});

export const proccessOrder = asyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  if (order.orderStatus === "Preparing") order.orderStatus = "Shipped";
  else if (order.orderStatus === "Shipped") {
    order.orderStatus = "Delivered";
    order.deliveredAt = new Date(Date.now());
  } else return next(new ErrorHandler("Order Already Delivered", 400));

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

// */5 * * * * *..5secs, 0 0 * * *..every 12am
// */3 * * * *
// cron.schedule("0 0 * * *", async() => {
//   try {
//     const users = await User.find();
//     for (const user of users) {
//       if(user.activeSubType > 0 ){
// user.activeSubType -= 1
//       }

//          if (user.activeSubType === 0) {
//           user.isActiveSub = false;
//         }

//       await user.save();

//     }

//     console.log('Cron job completed.');
//   } catch (error) {
//     console.error('Error:', error);
//   }
// });
