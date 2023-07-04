import { asyncError } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/error.js";
import { stripe } from "../server.js";

import  axios from "axios";
import  crypto from "crypto";

export const processPayment = asyncError(async (req, res, next) => {
  const { totalAmount } = req.body;

  const { client_secret } = await stripe.paymentIntents.create({
    amount: Number(totalAmount * 100),
    currency: "inr",
  });

  res.status(200).json({
    success: true,
    client_secret,
  });
});



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
    console.log(event.data)
    console.log(reference)
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

export const createOrder = asyncError(async (req, res, next) => {
 
  const {
  
    orderItems,
  
    itemsPrice,
    taxPrice,
    shippingCharges,
    totalAmount,
    orderRef
  } = req.body;

  await Order.create({
    user: req.user._id,
    orderItems,
    itemsPrice,
    taxPrice,
    shippingCharges,
    totalAmount,
    orderRef
  });

  console.log(`ref:${orderRef}`)
  // reducing each product upon ordering...
  // for (let i = 0; i < orderItems.length; i++) {
  //   const product = await Product.findById(orderItems[i].product);
  //   product.stock -= orderItems[i].quantity;
  //   await product.save();
  // }

  res.status(201).json({
    success: true,
    message: "Order Placed Successfully",
   
  });
});                            

export const getAdminOrders = asyncError(async (req, res, next) => {
  const orders = await Order.find({});

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getMyOrders = asyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
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
