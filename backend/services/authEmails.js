const { sendEmail } = require("./mailer");
const {
  escapeHtml,
  formatHuDate,
  renderEmailLayout,
} = require("./emailLayout");

async function sendVerificationEmail({
  to,
  username,
  verificationUrl,
  expiresAt,
}) {
  const subject = "Erősítsd meg a Serona fiókodat";
  const intro =
    "Már csak egy lépés választ el attól, hogy véglegesítsd a Serona-fiókodat.";
  const expiryText = formatHuDate(expiresAt);

  const html = renderEmailLayout({
    preheader: "Erősítsd meg a Serona fiókodat a regisztráció befejezéséhez.",
    eyebrow: "Serona fiókmegerősítés",
    title: "Megerősítő link készen áll",
    intro,
    ctaLabel: "E-mail cím megerősítése",
    ctaUrl: verificationUrl,
    bodyHtml: `
      <p style="margin:0 0 16px;">
        Szia <strong style="color:#ffffff;">${escapeHtml(username)}</strong>!
      </p>
      <p style="margin:0 0 16px;">
        Az alábbi gombra kattintva megerősítheted az e-mail címedet, és aktiválhatod a fiókodat.
      </p>
      <p style="margin:0 0 16px;">
        A link érvényessége: <strong style="color:#ffffff;">${escapeHtml(expiryText)}</strong>.
      </p>
      <p style="margin:0;">
        Ha a gomb nem működik, másold be ezt a címet a böngésződbe:<br />
        <a href="${escapeHtml(verificationUrl)}" style="color:#c4b5fd;word-break:break-all;">${escapeHtml(verificationUrl)}</a>
      </p>
    `,
    note:
      "Ha nem te kezdeményezted ezt a regisztrációt, nincs további teendőd.",
  });

  const text = [
    `Szia ${username}!`,
    "",
    "A Serona-fiókod aktiválásához erősítsd meg az e-mail címedet az alábbi linken:",
    verificationUrl,
    "",
    `A link eddig érvényes: ${expiryText}.`,
    "",
    "Ha nem te kezdeményezted a regisztrációt, hagyd figyelmen kívül ezt az üzenetet.",
  ].join("\n");

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: "type", value: "email_verification" },
      { name: "app", value: "serona" },
    ],
  });
}

async function sendPasswordResetEmail({
  to,
  username,
  resetUrl,
  expiresAt,
}) {
  const subject = "Serona jelszó-visszaállítás";
  const intro =
    "Kaptunk egy kérést a Serona-fiókod jelszavának visszaállítására.";
  const expiryText = formatHuDate(expiresAt);

  const html = renderEmailLayout({
    preheader: "Jelszó-visszaállítási link a Serona-fiókodhoz.",
    eyebrow: "Serona biztonság",
    title: "Új jelszó beállítása",
    intro,
    ctaLabel: "Új jelszó létrehozása",
    ctaUrl: resetUrl,
    bodyHtml: `
      <p style="margin:0 0 16px;">
        Szia <strong style="color:#ffffff;">${escapeHtml(username)}</strong>!
      </p>
      <p style="margin:0 0 16px;">
        Az alábbi gombbal új jelszót állíthatsz be a fiókodhoz. Biztonsági okból a link csak egyszer használható.
      </p>
      <p style="margin:0 0 16px;">
        A link érvényessége: <strong style="color:#ffffff;">${escapeHtml(expiryText)}</strong>.
      </p>
      <p style="margin:0;">
        Ha a gomb nem működik, másold be ezt a címet a böngésződbe:<br />
        <a href="${escapeHtml(resetUrl)}" style="color:#c4b5fd;word-break:break-all;">${escapeHtml(resetUrl)}</a>
      </p>
    `,
    note:
      "Ha nem te kérted a jelszó-visszaállítást, hagyd figyelmen kívül ezt az üzenetet, és a jelenlegi jelszavad változatlan marad.",
  });

  const text = [
    `Szia ${username}!`,
    "",
    "A Serona-fiókod jelszavának visszaállításához nyisd meg az alábbi linket:",
    resetUrl,
    "",
    `A link eddig érvényes: ${expiryText}.`,
    "",
    "Ha nem te kérted a jelszó-visszaállítást, hagyd figyelmen kívül ezt az üzenetet.",
  ].join("\n");

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: "type", value: "password_reset" },
      { name: "app", value: "serona" },
    ],
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
};
