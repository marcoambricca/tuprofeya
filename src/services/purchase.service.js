import {
  updateUserPlanAndPaymentById,
  resetLastPayment,
  setUserFreePlanById,
  getSubscriptionIdByUserId,
  cancelPlan
} from "../repositories/purchase.repository.js";

export async function cancelSubscriptionForUser(userId) {
  const subscriptionId = await getSubscriptionIdByUserId(userId);

  if (!subscriptionId) {
    throw new Error("USER_HAS_NO_SUBSCRIPTION");
  }

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LEMON_CANCEL_FAILED: ${text}`);
  }

  return true;
}

export async function handleWebhook(payload) {
  const event = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.userId;
  const planId = payload.meta?.custom_data?.planId; // ahora es ID numérico
  const subscriptionId = payload.data?.id;

  if (!userId) {
    console.log("No userId found in webhook");
    return;
  }

  // SUSCRIPCIÓN CREADA
  if (event === "subscription_created") {
    if (!planId) {
      console.log("No planId found in custom_data");
      return;
    }

    await updateUserPlanAndPaymentById(userId, planId, subscriptionId);
    console.log("Plan actualizado correctamente");
  }

  // PAGO EXITOSO (renovación)
  if (event === "subscription_payment_success") {
    await resetLastPayment(userId);
    console.log("Periodo y contacts_used reseteados por nuevo pago");
  }

  // CANCELACIÓN
  if (event === "subscription_cancelled") {
    await cancelPlan(userId);
    console.log("Subscription cancelled but still active until period end");
  }

  // EXPIRACIÓN
  if (event === "subscription_expired") {
    await setUserFreePlanById(userId);
    console.log("Usuario pasado a Basico");
  }
}

// VARIANT ID PARA CHECKOUT
export async function getVariantIdByPlan(planId) {
  switch (planId) {
    case 1:
      return process.env.LEMON_VARIANT_BASICO;
    case 2:
      return process.env.LEMON_VARIANT_PRO;
    case 3:
      return process.env.LEMON_VARIANT_MAX;
    default:
      throw new Error("Plan inválido");
  }
}