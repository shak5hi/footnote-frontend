const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

exports.createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || "http://localhost:5173";

    // ── Mock Stripe Mode ──
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (stripeKey.startsWith("sk_test_placeholder") || !stripeKey) {
      console.log(`ℹ️ [MOCK STRIPE] Activating Premium for user: ${user.email}`);
      user.isPremium = true;
      await user.save();
      return res.status(200).json({ url: `${clientUrl}/pages/profile.html?session_id=mock_session_${Date.now()}` });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${clientUrl}/pages/profile.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/pages/profile.html`,
      metadata: {
        userId: user._id.toString()
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session", error: error.message });
  }
};

exports.createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || "http://localhost:5173";

    // ── Mock Stripe Mode ──
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (stripeKey.startsWith("sk_test_placeholder") || !stripeKey) {
      console.log(`ℹ️ [MOCK STRIPE] Canceling Premium for user: ${user.email}`);
      user.isPremium = false;
      await user.save();
      return res.status(200).json({ url: `${clientUrl}/pages/profile.html?portal=canceled` });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: "Stripe customer ID is missing. Subscribe first." });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${clientUrl}/pages/profile.html`
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    res.status(500).json({ message: "Error creating portal session", error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  let event;
  const signature = req.headers["stripe-signature"];

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        let user;
        if (userId) {
          user = await User.findById(userId);
        } else if (stripeCustomerId) {
          user = await User.findOne({ stripeCustomerId });
        }

        if (user) {
          user.isPremium = true;
          user.stripeCustomerId = stripeCustomerId;
          user.stripeSubscriptionId = stripeSubscriptionId;
          await user.save();
          console.log(`✅ [WEBHOOK] Premium activated for user: ${user.email}`);
        } else {
          console.error(`❌ [WEBHOOK] User not found for checkout.session.completed`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;
        const stripeSubscriptionId = subscription.id;
        const status = subscription.status;

        const isPremium = status === "active" || status === "trialing";
        const user = await User.findOne({ stripeCustomerId });

        if (user) {
          user.isPremium = isPremium;
          user.stripeSubscriptionId = stripeSubscriptionId;
          await user.save();
          console.log(`✅ [WEBHOOK] Subscription updated for ${user.email}. isPremium = ${isPremium}`);
        } else {
          console.error(`❌ [WEBHOOK] User not found for customer.subscription.updated`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;

        const user = await User.findOne({ stripeCustomerId });
        if (user) {
          user.isPremium = false;
          user.stripeSubscriptionId = null;
          await user.save();
          console.log(`✅ [WEBHOOK] Subscription deleted/canceled for ${user.email}`);
        } else {
          console.error(`❌ [WEBHOOK] User not found for customer.subscription.deleted`);
        }
        break;
      }

      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    res.status(500).json({ message: "Webhook handler failed", error: error.message });
  }
};
