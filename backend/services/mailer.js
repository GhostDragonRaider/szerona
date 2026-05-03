const { config } = require("../config");

function canSendEmail() {
  if (config.emailProvider === "mailersend") {
    return Boolean(config.mailerSendApiKey);
  }

  return Boolean(config.resendApiKey);
}

function parseAddress(value) {
  const normalized = String(value ?? "").trim();
  const match = normalized.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^"|"$/g, "").trim() || undefined,
      email: match[2].trim(),
    };
  }

  return {
    email: normalized,
  };
}

function normalizeRecipients(value) {
  return (Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .map((entry) => parseAddress(entry));
}

async function sendWithResend({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  tags,
  attachments,
}) {
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

async function sendWithMailerSend({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  tags,
  attachments,
}) {
  const response = await fetch(`${config.mailerSendApiBaseUrl}/email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.mailerSendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: parseAddress(from),
      to: normalizeRecipients(to),
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: parseAddress(replyTo) } : {}),
      ...(tags.length > 0 ? { tags: tags.map((tag) => `${tag.name}:${tag.value}`) } : {}),
      ...(attachments.length > 0
        ? {
            attachments: attachments.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content,
              disposition: attachment.disposition ?? "attachment",
            })),
          }
        : {}),
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

  if (config.emailProvider === "mailersend") {
    return sendWithMailerSend({
      to,
      subject,
      html,
      text,
      from,
      replyTo,
      tags,
      attachments,
    });
  }

  return sendWithResend({
    to,
    subject,
    html,
    text,
    from,
    replyTo,
    tags,
    attachments,
  });
}

module.exports = {
  canSendEmail,
  sendEmail,
};
