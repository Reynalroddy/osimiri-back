import express from "express";
import {
  changePassword,
  forgetpassword,
  getAdminUsers,
  getMyProfile,
  getNewTokens,
  handleSubscription,
  login,
  logOut,
  resetpassword,
  signup,
  updatePic,
  updateProfile,
} from "../controllers/user.js";
import {
  isAdmin,
  isAuthenticated,
  isRefreshTokenAuthenticated,
} from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/login", login);

router.post("/new", singleUpload, signup);

router.get("/me", isAuthenticated, getMyProfile);
router.get("/tokens", isRefreshTokenAuthenticated, getNewTokens);
router.get("/logout", isAuthenticated, logOut);
router.get("/get-users", isAuthenticated, isAdmin, getAdminUsers);
// Updating Routes
router.put("/updateprofile", isAuthenticated, updateProfile);
router.patch("/changepassword", isAuthenticated, changePassword);
router.put("/updatepic", isAuthenticated, singleUpload, updatePic);
router.put("/handle-subscription", handleSubscription);

// Forget Password & Reset Password
router.route("/forgetpassword").post(forgetpassword).put(resetpassword);
export default router;
