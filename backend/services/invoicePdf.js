const PDFDocument = require("pdfkit");
const { config } = require("../config");

function formatCurrency(amount) {
  return `${new Intl.NumberFormat("hu-HU").format(Number(amount) || 0)} Ft`;
}

function formatDate(dateLike) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest",
  }).format(new Date(dateLike));
}

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

async function generateTransferInvoicePdf(order) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: `Serona díjbekérő - ${order.id}`,
      Author: "Serona",
      Subject: "Díjbekérő",
    },
  });
  const bufferPromise = collectPdfBuffer(doc);

  doc.fillColor("#111111").font("Helvetica-Bold").fontSize(24).text("SERONA");
  doc.moveDown(0.4);
  doc.fontSize(18).text("Díjbekérő");
  doc.moveDown(0.7);

  doc.font("Helvetica").fontSize(11).fillColor("#444444");
  doc.text(`Rendelésszám: ${order.id}`);
  doc.text(`Kiállítás dátuma: ${formatDate(order.createdAt)}`);
  if (order.transferDueAt) {
    doc.text(`Fizetési határidő: ${formatDate(order.transferDueAt)}`);
  }
  doc.moveDown();

  doc.font("Helvetica-Bold").fillColor("#111111").text("Vevo adatai");
  doc.font("Helvetica");
  doc.text(order.billing.fullName || order.shipping.fullName);
  doc.text(order.billing.line1);
  if (order.billing.line2) {
    doc.text(order.billing.line2);
  }
  doc.text(`${order.billing.zip} ${order.billing.city}`);
  doc.text(order.billing.country);
  doc.moveDown();

  doc.font("Helvetica-Bold").text("Utalasi adatok");
  doc.font("Helvetica");
  doc.text(`Kedvezményezett: ${config.transferBankAccountHolder}`);
  if (config.transferBankName) {
    doc.text(`Bank: ${config.transferBankName}`);
  }
  doc.text(
    `Bankszámla: ${config.transferBankAccountNumber || "Nincs megadva a rendszerben"}`,
  );
  doc.text(`Közlemény: ${order.id}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").text("Tételes összesítő");
  doc.moveDown(0.5);

  order.items.forEach((item) => {
    doc.font("Helvetica").text(
      `${item.name} x ${item.quantity} - ${formatCurrency(item.lineTotal)}`,
    );
  });
  doc.moveDown(0.4);
  doc.text(`Termékek összesen: ${formatCurrency(order.subtotal)}`);
  doc.text(`Szállítási díj: ${formatCurrency(order.shippingPrice)}`);
  if (order.discountAmount) {
    doc.text(`Kedvezmény: -${formatCurrency(order.discountAmount)}`);
  }
  doc.font("Helvetica-Bold").text(`Végösszeg: ${formatCurrency(order.total)}`);
  doc.moveDown();

  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  doc.text(
    "Ez egy automatikusan generált díjbekérő. Számla csak a fizetés beérkezése után kerül kiállításra.",
  );

  doc.end();
  return bufferPromise;
}

module.exports = {
  generateTransferInvoicePdf,
};
