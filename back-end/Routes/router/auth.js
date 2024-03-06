var express = require("express");
var router = express.Router();
const controller = require("../../Controllers/index");

router.post("/login", controller.authController.login);
router.post("/verifyOTP", controller.authController.verifyOtp);
router.post("/forgotPasswor", controller.authController.forgotpassword);
router.post("/verifyToken", controller.authController.verifypasswordresettoken);
router.post("/resetPassword", controller.authController.resetPassword);
router.post("/updatePassword", controller.authController.updatePassword);

module.exports = router;
