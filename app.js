import express from "express";
import { config } from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";
config({
  path: "./data/config.env",
});

export const app = express();

// Using Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin:"*",
    // origin: [process.env.FRONTEND_URI_1, process.env.FRONTEND_URI_2],
  })
);

app.get("/", (req, res, next) => {
  res.send("Working");
});

// Importing Routers here
import user from "./routes/user.js";
import product from "./routes/product.js";
import order from "./routes/order.js";
import sub from "./routes/sub.js";
app.use("/api/v1/user", user);
app.use("/api/v1/product", product);
app.use("/api/v1/order", order);
app.use("/api/v1/sub", sub);

// Using Error Middleware
app.use(errorMiddleware);

// */5 * * * * *..5secs, 0 0 * * *..every 12am

cron.schedule("*/5 * * * *", async() => {
  // const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // await NotificationModel.deleteMany({status:"read",createdAt: {$lt: thirtyDaysAgo}});
  // console.log('Deleted read notifications');
  try {
    // Find all users in the database
    const users = await User.find();
    // Loop through each user and perform an action (replace this with your action)
     // Subtract 1 from the user's active days
    for (const user of users) {
      if(user.activeSubType > 0 ){
user.activeSubType -= 1
      }

         // If active days are 0, set subscription to false
         if (user.activeSubType === 0) {
          user.isActiveSub = false;
        }
      // Save the updated user to the database
      await user.save();

    }

    console.log('Cron job completed.');
  } catch (error) {
    console.error('Error:', error);
  }
});   
