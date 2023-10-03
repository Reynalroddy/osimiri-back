import express from "express";
import {
  createOrder,
  getAdminOrders,
  getMyOrders,
  getOrderDetails,
  proccessOrder,
  processPayment,
  
  check,
  very,
  deleteOrder
} from "../controllers/order.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/new", isAuthenticated, createOrder);
router.post("/payment", isAuthenticated, processPayment);



// router.post("/transaction/initialize", pays);
router.post("/transaction/verify", very);
router.post("/transaction/check", check);


router.get("/my", isAuthenticated, getMyOrders);
router.get("/admin", isAuthenticated, isAdmin, getAdminOrders);

router
  .route("/single/:id")
  .get(isAuthenticated, getOrderDetails)
  .put(isAuthenticated, isAdmin, proccessOrder)
  .delete(isAuthenticated, isAdmin, deleteOrder);
export default router;
