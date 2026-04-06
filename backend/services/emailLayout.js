const { config } = require("../config");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatHuDate(dateLike) {
  try {
    return new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Budapest",
    }).format(new Date(dateLike));
  } catch {
    return String(dateLike ?? "");
  }
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat("hu-HU").format(Number(amount) || 0);
  } catch {
    return String(amount ?? 0);
  }
}

function renderEmailLayout({
  preheader,
  eyebrow,
  title,
  intro,
  ctaLabel,
  ctaUrl,
  bodyHtml,
  note,
}) {
  return `<!DOCTYPE html>
<html lang="hu">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#111111;border:1px solid #27272a;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(135deg,#111111 0%,#1e1b4b 45%,#7c3aed 100%);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#c4b5fd;font-weight:700;margin-bottom:18px;">
                  ${escapeHtml(eyebrow)}
                </div>
                <div style="font-size:34px;line-height:1.1;font-weight:800;color:#ffffff;margin:0 0 14px;">
                  ${escapeHtml(title)}
                </div>
                <div style="font-size:16px;line-height:1.7;color:#e5e7eb;">
                  ${escapeHtml(intro)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <div style="font-size:15px;line-height:1.75;color:#d4d4d8;">
                  ${bodyHtml}
                </div>
                ${
                  ctaLabel && ctaUrl
                    ? `
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 18px;">
                  <tr>
                    <td align="center" bgcolor="#7c3aed" style="border-radius:999px;">
                      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:15px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                        ${escapeHtml(ctaLabel)}
                      </a>
                    </td>
                  </tr>
                </table>`
                    : ""
                }
                <div style="font-size:13px;line-height:1.7;color:#a1a1aa;">
                  ${escapeHtml(note)}
                </div>
                <div style="margin-top:28px;padding-top:20px;border-top:1px solid #27272a;font-size:12px;line-height:1.7;color:#71717a;">
                  Serona<br />
                  ${escapeHtml(config.frontendBaseUrl.replace(/\/+$/, ""))}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = {
  escapeHtml,
  formatCurrency,
  formatHuDate,
  renderEmailLayout,
};
