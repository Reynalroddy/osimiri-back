import express from "express";
import {
  checkSub,
  createSub,
//   getAdminOrders,
//   getMyOrders,
//   getOrderDetails,
//   proccessOrder,
//   processPayment,
  
//   check,
//   very,
//   deleteOrder
} from "../controllers/sub.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();
router.post("/new", isAuthenticated, createSub);
// router.post("/payment", isAuthenticated, processPayment);



// // router.post("/transaction/initialize", pays);
// router.post("/transaction/verify", very);
// router.post("/transaction/check", check);


router.post("/checkSub", isAuthenticated, isAdmin, checkSub);
// router.get("/admin", isAuthenticated, isAdmin, getAdminOrders);

// router
//   .route("/single/:id")
//   .get(isAuthenticated, getOrderDetails)
//   .put(isAuthenticated, isAdmin, proccessOrder)
//   .delete(isAuthenticated, isAdmin, deleteOrder);
export default router;