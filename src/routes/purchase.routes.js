const { Router } = require('express');
const { handleWebhook, getVariantIdByPlan, cancelSubscriptionForUser } = require('../services/purchase.service.js');
const { authenticate } = require('../middleware/auth.middleware.js');

const router = Router();



router.post("/", async (req, res) => {
  try {
    const event = req.body;
    await handleWebhook(event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
});

router.delete("/cancel-subscription", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    await cancelSubscriptionForUser(userId);
    console.log("cancelacion de plan exitosa")
    res.status(200).json({
      message: "Subscription cancellation requested",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    res.status(500).json({
      error: "FAILED_TO_CANCEL_SUBSCRIPTION",
    });
  }
});

router.post("/create-checkout", authenticate, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ error: "PLAN_REQUIRED" });
    }

    const userId = req.user.userId;
    const email = req.user.email;

    const user = await getUserById(userId);
    
    const variantId = await getVariantIdByPlan(plan);

    if (!variantId) {
      return res.status(400).json({ error: "INVALID_PLAN" });
    }

    const STORE_ID = process.env.LEMON_STORE_ID;

    if (!STORE_ID) {
      return res.status(500).json({ error: "STORE_ID_NOT_CONFIGURED" });
    }

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email,
              custom: {
                userId: String(userId),
                plan: String(plan),
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: String(STORE_ID),
              },
            },
            variant: {
              data: {
                type: "variants",
                id: String(variantId),
              },
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "LEMON_ERROR",
        details: data,
      });
    }

    const checkoutUrl = data?.data?.attributes?.url;

    if (!checkoutUrl) {
      return res.status(500).json({
        error: "INVALID_LEMON_RESPONSE",
        details: data,
      });
    }

    return res.json({ checkoutUrl });

  } catch (err) {
    return res.status(500).json({ error: "CHECKOUT_ERROR" });
  }
});

module.exports = router;