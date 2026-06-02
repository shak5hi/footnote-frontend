const express = require("express");
const router = express.Router();
const { createCheckoutSession, createPortalSession } = require("../controllers/billingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/create-portal-session", protect, createPortalSession);

module.exports = router;
