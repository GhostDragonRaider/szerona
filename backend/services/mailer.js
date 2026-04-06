const { config } = require("../config");

function canSendEmail() {
  return Boolean(config.resendApiKey);
}

async function sendEmail({
  to,
  subject,
  html,
  text,
  from = config.emailFromAddress,
  replyTo = config.emailReplyTo,
  tags = [],
  attachments = [],
}) {
  if (!canSendEmail()) {
    const error = new Error(
      "Az e-mail kuldo szolgaltatas nincs beallitva a szerveren.",
    );
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetch(`${config.resendApiBaseUrl}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(attachments.length > 0 ? { attachments } : {}),
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
        payload?.error ||
        "Az e-mail kuldese sikertelen volt.",
    );
    error.code = "EMAIL_SEND_FAILED";
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

module.exports = {
  canSendEmail,
  sendEmail,
};
