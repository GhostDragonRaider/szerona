const {
  findOrderByPaymentReference,
  getOrderById,
  recordOrderFulfillmentEvent,
  updateOrderInvoiceData,
  updateOrderPaymentSession,
  updateOrderPaymentStatus,
} = require("../db");
const {
  getBarionPaymentState,
  isBarionConfigured,
  isBarionPaymentCancelled,
  isBarionPaymentSuccessful,
  startBarionPayment,
} = require("./barion");
const { sendPaidOrderConfirmationEmail } = require("./orderEmails");
const { createInvoiceForOrder, isSzamlazzConfigured } = require("./szamlazz");

async function ensureInvoiceForOrder(order, { force = false } = {}) {
  if (!order) {
    return { ok: false, skipped: true, reason: "missing_order" };
  }

  if (!isSzamlazzConfigured()) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  if (!force && order.invoice?.number) {
    return { ok: true, skipped: true, reason: "already_generated" };
  }

  await updateOrderInvoiceData(order.id, {
    provider: "szamlazzhu",
    status: "pending",
    number: null,
    createdAt: null,
  });

  try {
    const invoice = await createInvoiceForOrder(order);
    const updatedOrder = await updateOrderInvoiceData(order.id, {
      provider: "szamlazzhu",
      status: "success",
      number: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
    });

    return {
      ok: true,
      skipped: false,
      invoice,
      order: updatedOrder,
    };
  } catch (error) {
    await updateOrderInvoiceData(order.id, {
      provider: "szamlazzhu",
      status: "failed",
      number: null,
      createdAt: null,
    });
    throw error;
  }
}

async function startHostedPaymentForOrder(order) {
  if (!order || order.paymentMethod !== "card") {
    return null;
  }

  if (!isBarionConfigured()) {
    return null;
  }

  const paymentSession = await startBarionPayment(order);
  const updatedOrder = await updateOrderPaymentSession(order.id, {
    provider: "barion",
    paymentId: paymentSession.paymentId,
    requestId: paymentSession.paymentRequestId,
    status: paymentSession.status,
    startedAt: new Date().toISOString(),
  });

  return {
    order: updatedOrder,
    paymentSession,
  };
}

async function syncBarionOrderPayment({ orderId = null, paymentId }) {
  const paymentState = await getBarionPaymentState(paymentId);
  let order =
    (orderId ? await getOrderById(orderId) : null) ||
    (await findOrderByPaymentReference("barion", paymentState.paymentId));

  if (!order && paymentState.paymentRequestId) {
    order = await getOrderById(paymentState.paymentRequestId);
  }

  if (!order) {
    const error = new Error("A fizetéshez tartozó rendelés nem található.");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  order = await updateOrderPaymentStatus(order.id, {
    provider: "barion",
    paymentId: paymentState.paymentId,
    requestId: paymentState.paymentRequestId || order.id,
    status: paymentState.status,
    completedAt: isBarionPaymentSuccessful(paymentState.status)
      ? new Date().toISOString()
      : null,
  });

  if (isBarionPaymentSuccessful(paymentState.status) && order.status === "pending") {
    order = await recordOrderFulfillmentEvent(order.id, {
      event: "confirmed",
      occurredAt: new Date().toISOString(),
    });
    await ensureInvoiceForOrder(order);
    order = await getOrderById(order.id);
    try {
      await sendPaidOrderConfirmationEmail({
        to: order.contactEmail,
        username: order.shipping?.fullName || order.contactEmail,
        order,
      });
    } catch (error) {
      console.error("A sikeres fizetési e-mail küldése sikertelen volt.", error);
    }
  } else if (
    isBarionPaymentCancelled(paymentState.status) &&
    order.status === "pending"
  ) {
    order = await recordOrderFulfillmentEvent(order.id, {
      event: "cancelled",
      occurredAt: new Date().toISOString(),
    });
    order = await getOrderById(order.id);
  }

  return {
    order,
    paymentState,
  };
}

module.exports = {
  ensureInvoiceForOrder,
  startHostedPaymentForOrder,
  syncBarionOrderPayment,
};
