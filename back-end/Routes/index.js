const express = require("express");
const router = express.Router();

const shareHolder_route = require("./router/shareHolder");
const auth_route = require("./router/auth");

router.use("/shareHolder", shareHolder_route);
router.use("/auth", auth_route);

module.exports = router;
