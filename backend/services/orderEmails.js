const { config } = require("../config");
const { getPaymentMethodById, getShippingMethodById } = require("../constants/commerce");
const {
  escapeHtml,
  formatCurrency,
  formatHuDate,
  renderEmailLayout,
} = require("./emailLayout");
const { generateTransferInvoicePdf } = require("./invoicePdf");
const { sendEmail } = require("./mailer");

const STATUS_EMAIL_META = {
  confirmed: {
    eyebrow: "Rendelés jóváhagyva",
    title: "A rendelést jóváhagytuk",
    intro:
      "Minden rendben, a rendelést rögzítettük, és készítjük az összekészítésre.",
    note: "A következő állomásról külön értesítést kapsz.",
  },
  processing: {
    eyebrow: "Rendelés feldolgozás alatt",
    title: "Összekészítjük a csomagot",
    intro: "A csomag jelenleg összekészítés alatt van a raktárban.",
    note: "Amint feladjuk a küldeményt, elküldjük a csomagszámot is.",
  },
  shipped: {
    eyebrow: "Csomag feladva",
    title: "A csomagot átadtuk a futárnak",
    intro:
      "A rendelést feladtuk. Az alábbi csomagszámmal tudod majd követni a küldeményt.",
    note: "A futárszolgálat rövid időn belül saját értesítést is küldhet.",
  },
  delivered: {
    eyebrow: "Rendelés teljesítve",
    title: "Sikeres kézbesítés",
    intro:
      "A rendelést a rendszer szerint kézbesítettük. Köszönjük a vásárlást!",
    note: "Ha bármi problémát észlelsz, írj nekünk válasz e-mailben.",
  },
  cancelled: {
    eyebrow: "Rendelés törölve",
    title: "A rendelést töröltük",
    intro:
      "A rendelést töröltük, ezért a további teljesítési folyamat leállt.",
    note: "Ha ez tévesen történt, vedd fel velünk a kapcsolatot.",
  },
};

function buildTransferDetailsHtml(order) {
  const lines = [
    {
      label: "Fizetendő végösszeg",
      value: `${formatCurrency(order.total)} Ft`,
    },
    {
      label: "Közlemény",
      value: order.id,
    },
    {
      label: "Fizetési határidő",
      value: formatHuDate(order.transferDueAt),
    },
    {
      label: "Kedvezményezett",
      value: config.transferBankAccountHolder,
    },
  ];

  if (config.transferBankName) {
    lines.push({
      label: "Bank",
      value: config.transferBankName,
    });
  }

  if (config.transferBankAccountNumber) {
    lines.push({
      label: "Bankszámlaszám",
      value: config.transferBankAccountNumber,
    });
  }

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${lines
      .map(
        (line) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;width:42%;">${escapeHtml(line.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#ffffff;font-weight:700;">${escapeHtml(line.value)}</td>
      </tr>`,
      )
      .join("")}
  </table>`;
}

function buildItemsHtml(order, shippingMethod) {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#ffffff;">${escapeHtml(item.name)} x ${escapeHtml(item.quantity)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#ffffff;text-align:right;">${escapeHtml(formatCurrency(item.lineTotal))} Ft</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${rows}
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;">Termékek összesen</td>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#ffffff;text-align:right;font-weight:700;">${escapeHtml(formatCurrency(order.subtotal))} Ft</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;">${escapeHtml(
        `Szállítás - ${shippingMethod?.label ?? order.shippingMethod}`,
      )}</td>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#ffffff;text-align:right;font-weight:700;">${escapeHtml(formatCurrency(order.shippingPrice))} Ft</td>
    </tr>
    ${
      order.discountAmount
        ? `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;">Kedvezmény${
            order.discountCode ? ` - ${escapeHtml(order.discountCode)}` : ""
          }</td>
      <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#86efac;text-align:right;font-weight:700;">-${escapeHtml(formatCurrency(order.discountAmount))} Ft</td>
    </tr>`
        : ""
    }
    <tr>
      <td style="padding:14px 0 0;color:#ffffff;font-weight:700;">Végösszeg</td>
      <td style="padding:14px 0 0;color:#ffffff;text-align:right;font-size:18px;font-weight:800;">${escapeHtml(formatCurrency(order.total))} Ft</td>
    </tr>
  </table>`;
}

async function sendTransferInstructionsEmail({ to, username, order }) {
  const shippingMethod = getShippingMethodById(order.shippingMethod);
  const paymentMethod = getPaymentMethodById(order.paymentMethod);
  const accountNumberConfigured = Boolean(config.transferBankAccountNumber);
  const pdfBuffer = await generateTransferInvoicePdf(order);

  const html = renderEmailLayout({
    preheader: `Díjbekérő a ${order.id} rendeléshez.`,
    eyebrow: "Serona díjbekérő",
    title: "Előre utalási adatok",
    intro:
      "Rögzítettük a rendelést. Az utalást a díjbekérő alapján tudod teljesíteni.",
    ctaLabel: "Rendelés megtekintése",
    ctaUrl: `${config.frontendBaseUrl.replace(/\/+$/, "")}/account`,
    bodyHtml: `
      <p style="margin:0 0 16px;">
        Szia <strong style="color:#ffffff;">${escapeHtml(username)}</strong>!
      </p>
      <p style="margin:0 0 16px;">
        Megérkezett a <strong style="color:#ffffff;">${escapeHtml(order.id)}</strong> azonosítójú rendelésed.
        A fizetési mód: <strong style="color:#ffffff;">${escapeHtml(paymentMethod?.label ?? order.paymentMethod)}</strong>.
      </p>
      ${buildItemsHtml(order, shippingMethod)}
      ${buildTransferDetailsHtml(order)}
      ${
        accountNumberConfigured
          ? `<p style="margin:16px 0 0;">
        Kérjük, hogy az utalás közleményében mindenképp a rendelésszám szerepeljen: <strong style="color:#ffffff;">${escapeHtml(order.id)}</strong>.
      </p>`
          : `<p style="margin:16px 0 0;">
        A bankszámlaszám még nincs kitöltve a rendszerben, ezért kérjük, vedd fel velünk a kapcsolatot a további utalási adatokért.
      </p>`
      }
    `,
    note:
      "Az utalás beérkezése után a rendelést jóváhagyjuk, és külön e-mailben értesítünk a további lépésekről.",
  });

  const textLines = [
    `Szia ${username}!`,
    "",
    `A(z) ${order.id} azonosítójú rendelésedet rögzítettük.`,
    `Fizetési mód: ${paymentMethod?.label ?? order.paymentMethod}`,
    "",
    "Tételes összesítő:",
    ...order.items.map(
      (item) => `- ${item.name} x ${item.quantity}: ${formatCurrency(item.lineTotal)} Ft`,
    ),
    `- Szállítás (${shippingMethod?.label ?? order.shippingMethod}): ${formatCurrency(order.shippingPrice)} Ft`,
    ...(order.discountAmount
      ? [
          `- Kedvezmény${order.discountCode ? ` (${order.discountCode})` : ""}: -${formatCurrency(order.discountAmount)} Ft`,
        ]
      : []),
    `- Végösszeg: ${formatCurrency(order.total)} Ft`,
    "",
    `Kedvezményezett: ${config.transferBankAccountHolder}`,
    ...(config.transferBankName ? [`Bank: ${config.transferBankName}`] : []),
    ...(config.transferBankAccountNumber
      ? [`Bankszámlaszám: ${config.transferBankAccountNumber}`]
      : ["A bankszámlaszám nincs még beállítva a rendszerben."]),
    `Közlemény: ${order.id}`,
    `Fizetési határidő: ${formatHuDate(order.transferDueAt)}`,
    "",
    "A rendelesedet itt is megnezheted:",
    `${config.frontendBaseUrl.replace(/\/+$/, "")}/account`,
  ];

  return sendEmail({
    to,
    subject: `Serona díjbekérő - ${order.id}`,
    html,
    text: textLines.join("\n"),
    attachments: [
      {
        filename: `serona-dijbekero-${order.id}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
    tags: [
      { name: "type", value: "transfer_invoice" },
      { name: "app", value: "serona" },
    ],
  });
}

async function sendOrderStatusEmail({ to, username, order, event }) {
  const meta = STATUS_EMAIL_META[event];
  if (!meta) {
    return null;
  }

  const shippingMethod = getShippingMethodById(order.shippingMethod);
  const paymentMethod = getPaymentMethodById(order.paymentMethod);

  const extraBlock =
    event === "shipped" && order.trackingNumber
      ? `<p style="margin:0 0 16px;">
        Csomagszam: <strong style="color:#ffffff;">${escapeHtml(order.trackingNumber)}</strong>
      </p>`
      : "";

  const html = renderEmailLayout({
    preheader: `${order.id} rendelés - ${meta.title}`,
    eyebrow: meta.eyebrow,
    title: meta.title,
    intro: meta.intro,
    ctaLabel: "Rendelés megtekintése",
    ctaUrl: `${config.frontendBaseUrl.replace(/\/+$/, "")}/account?tab=orders`,
    bodyHtml: `
      <p style="margin:0 0 16px;">
        Szia <strong style="color:#ffffff;">${escapeHtml(username)}</strong>!
      </p>
      <p style="margin:0 0 16px;">
        A <strong style="color:#ffffff;">${escapeHtml(order.id)}</strong> rendelésed státusza most:
        <strong style="color:#ffffff;">${escapeHtml(meta.title)}</strong>.
      </p>
      ${extraBlock}
      <p style="margin:0 0 16px;">
        Fizetési mód: <strong style="color:#ffffff;">${escapeHtml(paymentMethod?.label ?? order.paymentMethod)}</strong><br />
        Szállítási mód: <strong style="color:#ffffff;">${escapeHtml(shippingMethod?.label ?? order.shippingMethod)}</strong>
      </p>
      ${buildItemsHtml(order, shippingMethod)}
    `,
    note: meta.note,
  });

  const textLines = [
    `Szia ${username}!`,
    "",
    `A ${order.id} rendelésed státusza frissült.`,
    meta.title,
    ...(event === "shipped" && order.trackingNumber
      ? [`Csomagszam: ${order.trackingNumber}`]
      : []),
    `Fizetési mód: ${paymentMethod?.label ?? order.paymentMethod}`,
    `Szállítási mód: ${shippingMethod?.label ?? order.shippingMethod}`,
    "",
    ...order.items.map(
      (item) => `- ${item.name} x ${item.quantity}: ${formatCurrency(item.lineTotal)} Ft`,
    ),
    `- Szállítás: ${formatCurrency(order.shippingPrice)} Ft`,
    ...(order.discountAmount
      ? [`- Kedvezmény: -${formatCurrency(order.discountAmount)} Ft`]
      : []),
    `- Végösszeg: ${formatCurrency(order.total)} Ft`,
    "",
    `${config.frontendBaseUrl.replace(/\/+$/, "")}/account?tab=orders`,
  ];

  return sendEmail({
    to,
    subject: `Serona rendelésfrissítés - ${order.id}`,
    html,
    text: textLines.join("\n"),
    tags: [
      { name: "type", value: "order_status" },
      { name: "status", value: event },
      { name: "app", value: "serona" },
    ],
  });
}

module.exports = {
  sendOrderStatusEmail,
  sendTransferInstructionsEmail,
};
