const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { config } = require("./config");
const {
  DEFAULT_COUPONS,
  buildOrderPricing,
  getShippingMethodById,
  normalizeCouponCode,
} = require("./constants/commerce");
const { seedProducts } = require("./data/seedProducts");
const { generateOpaqueToken } = require("./utils/security");

let adapter = null;
let BetterSqlite3 = null;

function getSqliteConstructor() {
  if (!BetterSqlite3) {
    BetterSqlite3 = require("better-sqlite3");
  }

  return BetterSqlite3;
}

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(dateIso, minutes) {
  return new Date(Date.parse(dateIso) + minutes * 60 * 1000).toISOString();
}

function addDays(dateIso, days) {
  return new Date(Date.parse(dateIso) + days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizeBool(value) {
  return value === true || value === 1 || value === "1";
}

function normalizeUserRow(row) {
  if (!row) return null;

  return {
    ...row,
    id: String(row.id),
    email_verified: normalizeBool(row.email_verified),
  };
}

function normalizeAdminRow(row) {
  if (!row) return null;

  return {
    ...row,
    id: "admin",
    username: "admin",
    phone: row.phone ?? "",
  };
}

function normalizeProfileRow(row, fallbackUsername = "") {
  if (!row) {
    return {
      display_name: fallbackUsername,
      billing_full_name: "",
      billing_line1: "",
      billing_line2: "",
      billing_city: "",
      billing_zip: "",
      billing_country: "Magyarorszag",
    };
  }

  return {
    display_name: row.display_name ?? fallbackUsername,
    billing_full_name: row.billing_full_name ?? "",
    billing_line1: row.billing_line1 ?? "",
    billing_line2: row.billing_line2 ?? "",
    billing_city: row.billing_city ?? "",
    billing_zip: row.billing_zip ?? "",
    billing_country: row.billing_country ?? "Magyarorszag",
  };
}

function normalizePaymentMethodRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: String(row.user_id),
    provider: row.provider,
    type: row.type ?? "card",
    providerCustomerId: row.provider_customer_id ?? null,
    providerMethodId: row.provider_method_id,
    holderName: row.holder_name ?? "",
    brand: row.brand ?? "",
    last4: row.last4 ?? "",
    expiryMonth: String(row.expiry_month ?? "").padStart(2, "0"),
    expiryYear: String(row.expiry_year ?? ""),
    funding: row.funding ?? "",
    fingerprint: row.fingerprint ?? "",
    isDefault: normalizeBool(row.is_default),
    status: row.status ?? "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeSessionRow(row) {
  if (!row) return null;

  return {
    ...row,
    revoked: Boolean(row.revoked_at),
  };
}

function normalizeProductRow(row, reservedQuantity = 0) {
  if (!row) return null;

  const reserved = Number(row.reserved_quantity ?? reservedQuantity ?? 0);
  const stock = Number(row.stock_quantity ?? 0);

  return {
    id: String(row.id),
    name: row.name,
    price: Number(row.price),
    category: row.category,
    image: row.image,
    description: row.description,
    isNew: normalizeBool(row.is_new),
    stockQuantity: stock,
    reservedQuantity: reserved,
    availableQuantity: Math.max(stock - reserved, 0),
    active: row.active === undefined ? true : normalizeBool(row.active),
  };
}

function normalizeCartLine(row, availableQuantity) {
  return {
    product: normalizeProductRow(row, row.other_reserved_quantity),
    quantity: Number(row.quantity),
    reservationExpiresAt: row.reserved_until ?? null,
    availableQuantity: Number(availableQuantity),
  };
}

function normalizeOrderRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    userType: row.user_type,
    userId: row.user_id,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    paymentMethod: row.payment_method,
    shippingMethod: row.shipping_method ?? "gls_home",
    status: row.status,
    trackingNumber: row.tracking_number ?? null,
    discountCode: row.discount_code ?? null,
    discountAmount: Number(row.discount_amount ?? 0),
    confirmedAt: row.confirmed_at ?? null,
    processingStartedAt: row.processing_started_at ?? null,
    shippedAt: row.shipped_at ?? null,
    deliveredAt: row.delivered_at ?? null,
    subtotal: Number(row.subtotal),
    shippingPrice: Number(row.shipping_price ?? 0),
    total: Number(row.total ?? row.subtotal ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shipping: {
      fullName: row.shipping_full_name,
      line1: row.shipping_line1,
      line2: row.shipping_line2 ?? "",
      city: row.shipping_city,
      zip: row.shipping_zip,
      country: row.shipping_country,
    },
    billing: {
      fullName: row.billing_full_name,
      line1: row.billing_line1,
      line2: row.billing_line2 ?? "",
      city: row.billing_city,
      zip: row.billing_zip,
      country: row.billing_country,
    },
    items: [],
  };
}

function normalizeOrderItemRow(row) {
  return {
    id: String(row.id),
    productId: row.product_id,
    name: row.product_name,
    image: row.product_image,
    category: row.product_category,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    lineTotal: Number(row.unit_price) * Number(row.quantity),
  };
}

function normalizeCouponShippingMethods(value) {
  if (!value) return [];

  let raw = [];

  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === "string") {
    try {
      raw = JSON.parse(value || "[]");
    } catch {
      raw = [];
    }
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry && getShippingMethodById(entry));
}

function normalizeCouponRow(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    code: normalizeCouponCode(row.code),
    label: row.label,
    description: row.description,
    type: row.type,
    percent:
      row.percent === null || row.percent === undefined ? null : Number(row.percent),
    amount:
      row.amount === null || row.amount === undefined ? null : Number(row.amount),
    minSubtotal: Number(row.min_subtotal ?? 0),
    maxDiscount:
      row.max_discount === null || row.max_discount === undefined
        ? null
        : Number(row.max_discount),
    appliesToShippingMethods: normalizeCouponShippingMethods(
      row.applies_to_shipping_methods,
    ),
    active: row.active === undefined ? true : normalizeBool(row.active),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

const ORDER_STATUS_RANK = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 5,
};

const FULFILLMENT_EVENTS = new Set([
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

function createDbError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deriveOrderStatusFromEvents(order) {
  if (!order) {
    return "pending";
  }

  if (order.status === "cancelled") {
    return "cancelled";
  }

  if (order.deliveredAt) {
    return "delivered";
  }

  if (order.shippedAt || order.trackingNumber) {
    return "shipped";
  }

  if (order.processingStartedAt) {
    return "processing";
  }

  if (order.confirmedAt) {
    return "confirmed";
  }

  return order.status ?? "pending";
}

function resolveLifecycleState(order) {
  const status = deriveOrderStatusFromEvents(order);

  return {
    status,
    trackingNumber:
      status === "shipped" || status === "delivered" || status === "cancelled"
        ? order?.trackingNumber ?? null
        : null,
  };
}

function normalizeLifecycleTimestamp(value) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    throw createDbError("INVALID_EVENT_TIMESTAMP", "Ervenytelen esemeny datum.");
  }

  return parsed.toISOString();
}

function normalizeTrackingNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

function applyFulfillmentEvent(order, event, occurredAt, trackingNumber) {
  const currentStatus = deriveOrderStatusFromEvents(order);

  if (currentStatus === "cancelled" && event !== "cancelled") {
    throw createDbError(
      "INVALID_STATUS_TRANSITION",
      "A torolt rendelest mar nem lehet ujranyitni.",
    );
  }

  if (currentStatus === "delivered" && event === "cancelled") {
    throw createDbError(
      "INVALID_STATUS_TRANSITION",
      "A kezbesitett rendelest mar nem lehet torolni.",
    );
  }

  if (event !== "cancelled") {
    const currentRank = ORDER_STATUS_RANK[currentStatus] ?? 0;
    const nextRank = ORDER_STATUS_RANK[event] ?? 0;

    if (nextRank < currentRank) {
      throw createDbError(
        "INVALID_STATUS_TRANSITION",
        "A rendeles statusza nem lephet vissza korabbi allapotba.",
      );
    }
  }

  const next = {
    status: currentStatus,
    trackingNumber: order.trackingNumber ?? null,
    confirmedAt: order.confirmedAt ?? null,
    processingStartedAt: order.processingStartedAt ?? null,
    shippedAt: order.shippedAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    inventoryReleased: Boolean(order.inventoryReleased),
  };

  if (event === "cancelled") {
    next.status = "cancelled";
    return next;
  }

  if (event === "confirmed") {
    next.confirmedAt = occurredAt;
  }

  if (event === "processing") {
    next.confirmedAt = next.confirmedAt ?? occurredAt;
    next.processingStartedAt = occurredAt;
  }

  if (event === "shipped") {
    next.confirmedAt = next.confirmedAt ?? occurredAt;
    next.processingStartedAt = next.processingStartedAt ?? occurredAt;
    next.shippedAt = occurredAt;
    next.trackingNumber = trackingNumber ?? next.trackingNumber;
  }

  if (event === "delivered") {
    next.confirmedAt = next.confirmedAt ?? occurredAt;
    next.processingStartedAt = next.processingStartedAt ?? occurredAt;
    next.shippedAt = next.shippedAt ?? occurredAt;
    next.deliveredAt = occurredAt;
    next.trackingNumber = trackingNumber ?? next.trackingNumber;
  }

  const lifecycle = resolveLifecycleState(next);
  if (
    (lifecycle.status === "shipped" || lifecycle.status === "delivered") &&
    !lifecycle.trackingNumber
  ) {
    throw createDbError(
      "TRACKING_NUMBER_REQUIRED",
      "Feladott vagy kezbesitett rendeléshez kotelezo a csomagszam.",
    );
  }

  next.status = lifecycle.status;
  next.trackingNumber = lifecycle.trackingNumber;
  return next;
}

function getShippingPricing(methodId) {
  const pricing = buildOrderPricing({
    subtotal: 0,
    shippingMethodId: methodId,
    couponCode: null,
  });

  return {
    shippingMethod: pricing.shippingMethod,
    shippingPrice: pricing.shippingPrice,
  };
}

function ensureSqliteOrderColumns(db) {
  const columns = db.prepare("PRAGMA table_info(orders)").all();
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("shipping_method")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN shipping_method TEXT NOT NULL DEFAULT 'gls_home'",
    ).run();
  }

  if (!names.has("shipping_price")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN shipping_price INTEGER NOT NULL DEFAULT 0",
    ).run();
  }

  if (!names.has("total")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN total INTEGER NOT NULL DEFAULT 0",
    ).run();
  }

  if (!names.has("tracking_number")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN tracking_number TEXT",
    ).run();
  }

  if (!names.has("discount_code")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN discount_code TEXT",
    ).run();
  }

  if (!names.has("discount_amount")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0",
    ).run();
  }

  if (!names.has("confirmed_at")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN confirmed_at TEXT",
    ).run();
  }

  if (!names.has("processing_started_at")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN processing_started_at TEXT",
    ).run();
  }

  if (!names.has("shipped_at")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN shipped_at TEXT",
    ).run();
  }

  if (!names.has("delivered_at")) {
    db.prepare(
      "ALTER TABLE orders ADD COLUMN delivered_at TEXT",
    ).run();
  }

  db.prepare(
    `
      UPDATE orders
      SET total = subtotal + shipping_price
      WHERE total = 0
    `,
  ).run();
}

async function ensurePostgresOrderColumns(pool) {
  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_method TEXT NOT NULL DEFAULT 'gls_home'
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_price INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS total INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS tracking_number TEXT
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS discount_code TEXT
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ
  `);

  await pool.query(`
    UPDATE orders
    SET total = subtotal + shipping_price
    WHERE total = 0
  `);
}

async function ensureDefaultAdmin(seedAdmin) {
  const passwordHash = await bcrypt.hash("admin", config.bcryptRounds);
  await seedAdmin({
    email: "admin@serona.local",
    phone: "",
    passwordHash,
  });
}

function createProductId() {
  return `prd_${generateOpaqueToken(10)}`;
}

function createOrderId() {
  return `ord_${generateOpaqueToken(10)}`;
}

function createCouponId() {
  return `cpn_${generateOpaqueToken(10)}`;
}

function createPaymentMethodId() {
  return `pm_${generateOpaqueToken(10)}`;
}

function buildCartResponse(lines) {
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );

  return {
    lines,
    totalItems,
    totalPrice,
  };
}

function createSqliteAdapter() {
  fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });

  const Database = getSqliteConstructor();
  const db = new Database(config.sqlitePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  function getUserProfileSync(userId, fallbackUsername = "") {
    const row = db
      .prepare(
        `
          SELECT
            user_id,
            display_name,
            billing_full_name,
            billing_line1,
            billing_line2,
            billing_city,
            billing_zip,
            billing_country
          FROM user_profiles
          WHERE user_id = ?
          LIMIT 1
        `,
      )
      .get(userId);

    return normalizeProfileRow(row, fallbackUsername);
  }

  function ensureUserProfileSync(userId, fallbackUsername = "") {
    const existing = db
      .prepare("SELECT user_id FROM user_profiles WHERE user_id = ? LIMIT 1")
      .get(userId);

    if (!existing) {
      db.prepare(
        `
          INSERT INTO user_profiles (
            user_id,
            display_name,
            billing_full_name,
            billing_line1,
            billing_line2,
            billing_city,
            billing_zip,
            billing_country
          )
          VALUES (?, ?, '', '', '', '', '', 'Magyarorszag')
        `,
      ).run(userId, fallbackUsername || "");
    }

    return getUserProfileSync(userId, fallbackUsername);
  }

  function getOrCreateActiveCartSync(userType, userId) {
    const existing = db
      .prepare(
        `
          SELECT id, user_type, user_id, status
          FROM carts
          WHERE user_type = ? AND user_id = ? AND status = 'active'
          ORDER BY id DESC
          LIMIT 1
        `,
      )
      .get(userType, userId);

    if (existing) {
      return existing;
    }

    const result = db
      .prepare(
        `
          INSERT INTO carts (user_type, user_id, status, created_at, updated_at)
          VALUES (?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
      )
      .run(userType, userId);

    return {
      id: Number(result.lastInsertRowid),
      user_type: userType,
      user_id: userId,
      status: "active",
    };
  }

  function getReservedQuantityForProductSync(productId, now, excludeCartId = null) {
    const row = db
      .prepare(
        `
          SELECT COALESCE(SUM(ci.quantity), 0) AS reserved_quantity
          FROM cart_items ci
          JOIN carts c ON c.id = ci.cart_id
          WHERE ci.product_id = ?
            AND c.status = 'active'
            AND ci.reserved_until IS NOT NULL
            AND ci.reserved_until > ?
            AND (? IS NULL OR ci.cart_id <> ?)
        `,
      )
      .get(productId, now, excludeCartId, excludeCartId);

    return Number(row?.reserved_quantity ?? 0);
  }

  function getProductRowSync(productId, includeInactive = false) {
    return db
      .prepare(
        `
          SELECT
            id,
            name,
            price,
            category,
            image,
            description,
            is_new,
            stock_quantity,
            active
          FROM products
          WHERE id = ?
            ${includeInactive ? "" : "AND active = 1"}
          LIMIT 1
        `,
      )
      .get(productId);
  }

  function listCouponRowsSync({ activeOnly = false } = {}) {
    return db
      .prepare(
        `
          SELECT
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active,
            created_at,
            updated_at
          FROM coupons
          ${activeOnly ? "WHERE active = 1" : ""}
          ORDER BY active DESC, created_at DESC, id DESC
        `,
      )
      .all();
  }

  function getCouponRowByIdSync(couponId) {
    return db
      .prepare(
        `
          SELECT
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active,
            created_at,
            updated_at
          FROM coupons
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(couponId);
  }

  function getCouponRowByCodeSync(code, activeOnly = false) {
    return db
      .prepare(
        `
          SELECT
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active,
            created_at,
            updated_at
          FROM coupons
          WHERE LOWER(code) = LOWER(?)
            ${activeOnly ? "AND active = 1" : ""}
          LIMIT 1
        `,
      )
      .get(code);
  }

  function getOrderByIdSync(orderId) {
    const orderRow = db
      .prepare(
        `
          SELECT
            id,
            user_type,
            user_id,
            contact_email,
            contact_phone,
            payment_method,
            shipping_method,
            status,
            tracking_number,
            discount_code,
            discount_amount,
            confirmed_at,
            processing_started_at,
            shipped_at,
            delivered_at,
            subtotal,
            shipping_price,
            total,
            shipping_full_name,
            shipping_line1,
            shipping_line2,
            shipping_city,
            shipping_zip,
            shipping_country,
            billing_full_name,
            billing_line1,
            billing_line2,
            billing_city,
            billing_zip,
            billing_country,
            inventory_released,
            created_at,
            updated_at
          FROM orders
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(orderId);

    if (!orderRow) return null;

    const order = normalizeOrderRow(orderRow);
    order.inventoryReleased = normalizeBool(orderRow.inventory_released);
    order.items = db
      .prepare(
        `
          SELECT
            id,
            product_id,
            product_name,
            product_image,
            product_category,
            unit_price,
            quantity
          FROM order_items
          WHERE order_id = ?
          ORDER BY id ASC
        `,
      )
      .all(orderId)
      .map(normalizeOrderItemRow);

    return order;
  }

  function synchronizeOrderLifecycleSync(orderId) {
    const current = getOrderByIdSync(orderId);
    if (!current) {
      return current;
    }

    const next = resolveLifecycleState(current);
    const shouldUpdate =
      next.status !== current.status ||
      (next.trackingNumber ?? null) !== (current.trackingNumber ?? null);

    if (!shouldUpdate) {
      return current;
    }

    db.prepare(
      `
        UPDATE orders
        SET
          status = ?,
          tracking_number = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    ).run(next.status, next.trackingNumber, orderId);

    return getOrderByIdSync(orderId);
  }

  function synchronizeAllOrdersLifecycleSync() {
    const rows = db
      .prepare(
        `
          SELECT id
          FROM orders
          WHERE status <> 'cancelled'
          ORDER BY created_at ASC, id ASC
        `,
      )
      .all();

    for (const row of rows) {
      synchronizeOrderLifecycleSync(row.id);
    }
  }

  function getCartSync(userType, userId) {
    const cart = getOrCreateActiveCartSync(userType, userId);
    const now = nowIso();
    const rows = db
      .prepare(
        `
          SELECT
            ci.product_id,
            ci.quantity,
            ci.reserved_until,
            p.id,
            p.name,
            p.price,
            p.category,
            p.image,
            p.description,
            p.is_new,
            p.stock_quantity,
            p.active
          FROM cart_items ci
          JOIN products p ON p.id = ci.product_id
          WHERE ci.cart_id = ?
            AND p.active = 1
          ORDER BY ci.id ASC
        `,
      )
      .all(cart.id);

    const lines = rows.map((row) => {
      const otherReserved = getReservedQuantityForProductSync(
        row.product_id,
        now,
        cart.id,
      );
      const availableQuantity = Math.max(
        Number(row.stock_quantity) - otherReserved,
        0,
      );

      return normalizeCartLine(
        {
          ...row,
          other_reserved_quantity: otherReserved,
        },
        availableQuantity,
      );
    });

    return buildCartResponse(lines);
  }

  function listOrdersSync(query, params) {
    synchronizeAllOrdersLifecycleSync();
    const rows = db.prepare(query).all(...params);
    return rows.map((row) => getOrderByIdSync(row.id));
  }

  return {
    name: "sqlite",
    async init() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL CHECK (length(username) BETWEEN 3 AND 32),
          email TEXT NOT NULL CHECK (length(email) BETWEEN 6 AND 320),
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          email_verified INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
        ON users (LOWER(username));

        CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
        ON users (LOWER(email));

        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id INTEGER PRIMARY KEY,
          display_name TEXT NOT NULL DEFAULT '',
          billing_full_name TEXT NOT NULL DEFAULT '',
          billing_line1 TEXT NOT NULL DEFAULT '',
          billing_line2 TEXT NOT NULL DEFAULT '',
          billing_city TEXT NOT NULL DEFAULT '',
          billing_zip TEXT NOT NULL DEFAULT '',
          billing_country TEXT NOT NULL DEFAULT 'Magyarorszag',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'card' CHECK (type IN ('card')),
          provider_customer_id TEXT,
          provider_method_id TEXT NOT NULL,
          holder_name TEXT NOT NULL DEFAULT '',
          brand TEXT NOT NULL DEFAULT '',
          last4 TEXT NOT NULL CHECK (length(last4) = 4),
          expiry_month TEXT NOT NULL,
          expiry_year TEXT NOT NULL,
          funding TEXT NOT NULL DEFAULT '',
          fingerprint TEXT NOT NULL DEFAULT '',
          is_default INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active'
            CHECK (status IN ('active', 'pending_setup', 'revoked')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_provider_ref_idx
        ON payment_methods (LOWER(provider), provider_method_id);

        CREATE INDEX IF NOT EXISTS payment_methods_user_idx
        ON payment_methods (user_id, status, is_default, created_at);

        CREATE TABLE IF NOT EXISTS admin_account (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          username TEXT NOT NULL DEFAULT 'admin',
          email TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          refresh_token_hash TEXT NOT NULL,
          user_agent TEXT NOT NULL DEFAULT '',
          ip_address TEXT NOT NULL DEFAULT '',
          expires_at TEXT NOT NULL,
          revoked_at TEXT,
          last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS auth_sessions_user_idx
        ON auth_sessions (user_type, user_id);

        CREATE TABLE IF NOT EXISTS auth_throttles (
          scope TEXT NOT NULL,
          throttle_key TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          first_attempt_at TEXT NOT NULL,
          last_attempt_at TEXT NOT NULL,
          locked_until TEXT,
          PRIMARY KEY (scope, throttle_key)
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_type TEXT NOT NULL CHECK (user_type IN ('user')),
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          purpose TEXT NOT NULL DEFAULT 'registration'
            CHECK (purpose IN ('registration', 'email_change')),
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx
        ON email_verification_tokens (user_type, user_id, purpose);

        CREATE TABLE IF NOT EXISTS legal_acceptances (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_type TEXT NOT NULL CHECK (user_type IN ('user')),
          user_id TEXT NOT NULL,
          document_key TEXT NOT NULL CHECK (document_key IN ('terms', 'privacy')),
          document_version TEXT NOT NULL,
          ip_address TEXT NOT NULL DEFAULT '',
          user_agent TEXT NOT NULL DEFAULT '',
          accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS legal_acceptances_user_idx
        ON legal_acceptances (user_type, user_id, document_key, accepted_at);

        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price INTEGER NOT NULL CHECK (price >= 0),
          category TEXT NOT NULL CHECK (category IN ('polo', 'pulover', 'nadrag', 'cipo')),
          image TEXT NOT NULL,
          description TEXT NOT NULL,
          is_new INTEGER NOT NULL DEFAULT 0,
          stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS coupons (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          label TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('percent', 'fixed', 'shipping')),
          percent INTEGER,
          amount INTEGER,
          min_subtotal INTEGER NOT NULL DEFAULT 0,
          max_discount INTEGER,
          applies_to_shipping_methods TEXT NOT NULL DEFAULT '[]',
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_lower_idx
        ON coupons (LOWER(code));

        CREATE TABLE IF NOT EXISTS carts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS carts_owner_idx
        ON carts (user_type, user_id, status);

        CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cart_id INTEGER NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          reserved_until TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (cart_id, product_id),
          FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE INDEX IF NOT EXISTS cart_items_product_idx
        ON cart_items (product_id, reserved_until);

        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          contact_email TEXT NOT NULL,
          contact_phone TEXT NOT NULL,
            payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'card', 'transfer')),
            shipping_method TEXT NOT NULL DEFAULT 'gls_home',
            status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
            tracking_number TEXT,
            discount_code TEXT,
            discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
            confirmed_at TEXT,
            processing_started_at TEXT,
            shipped_at TEXT,
            delivered_at TEXT,
            subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
            shipping_price INTEGER NOT NULL DEFAULT 0 CHECK (shipping_price >= 0),
            total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
          shipping_full_name TEXT NOT NULL,
          shipping_line1 TEXT NOT NULL,
          shipping_line2 TEXT NOT NULL DEFAULT '',
          shipping_city TEXT NOT NULL,
          shipping_zip TEXT NOT NULL,
          shipping_country TEXT NOT NULL,
          billing_full_name TEXT NOT NULL,
          billing_line1 TEXT NOT NULL,
          billing_line2 TEXT NOT NULL DEFAULT '',
          billing_city TEXT NOT NULL,
          billing_zip TEXT NOT NULL,
          billing_country TEXT NOT NULL,
          inventory_released INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS orders_owner_idx
        ON orders (user_type, user_id, created_at);

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          product_id TEXT,
          product_name TEXT NOT NULL,
          product_image TEXT NOT NULL,
          product_category TEXT NOT NULL,
          unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );
      `);

      ensureSqliteOrderColumns(db);

      await ensureDefaultAdmin(({ email, phone, passwordHash }) => {
        const existing = db
          .prepare("SELECT id FROM admin_account WHERE id = 1 LIMIT 1")
          .get();

        if (!existing) {
          db.prepare(
            `
              INSERT INTO admin_account (id, username, email, phone, password_hash)
              VALUES (1, 'admin', ?, ?, ?)
            `,
          ).run(email, phone, passwordHash);
        }
      });

      const productsCount = db
        .prepare("SELECT COUNT(*) AS count FROM products")
        .get().count;

      if (Number(productsCount) === 0) {
        const insert = db.prepare(
          `
            INSERT INTO products (
              id,
              name,
              price,
              category,
              image,
              description,
              is_new,
              stock_quantity,
              active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
          `,
        );

        const insertMany = db.transaction((products) => {
          for (const product of products) {
            insert.run(
              product.id,
              product.name,
              product.price,
              product.category,
              product.image,
              product.description,
              product.isNew ? 1 : 0,
              product.stockQuantity,
            );
          }
        });

        insertMany(seedProducts);
      }

      const couponsCount = db
        .prepare("SELECT COUNT(*) AS count FROM coupons")
        .get().count;

      if (Number(couponsCount) === 0) {
        const insertCoupon = db.prepare(
          `
            INSERT INTO coupons (
              id,
              code,
              label,
              description,
              type,
              percent,
              amount,
              min_subtotal,
              max_discount,
              applies_to_shipping_methods,
              active,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
        );

        const insertManyCoupons = db.transaction((coupons) => {
          for (const coupon of coupons) {
            insertCoupon.run(
              createCouponId(),
              normalizeCouponCode(coupon.code),
              coupon.label,
              coupon.description,
              coupon.type,
              coupon.percent ?? null,
              coupon.amount ?? null,
              coupon.minSubtotal ?? 0,
              coupon.maxDiscount ?? null,
              JSON.stringify(coupon.appliesToShippingMethods ?? []),
            );
          }
        });

        insertManyCoupons(DEFAULT_COUPONS);
      }
    },
    async findUserByIdentifier(identifier) {
      return normalizeUserRow(
        db
          .prepare(
            `
              SELECT id, username, email, password_hash, role, email_verified
              FROM users
              WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
              LIMIT 1
            `,
          )
          .get(identifier, identifier),
      );
    },
    async findUserById(userId) {
      return normalizeUserRow(
        db
          .prepare(
            `
              SELECT id, username, email, role, email_verified
              FROM users
              WHERE id = ?
              LIMIT 1
            `,
          )
          .get(userId),
      );
    },
    async findUserWithPasswordById(userId) {
      return normalizeUserRow(
        db
          .prepare(
            `
              SELECT id, username, email, password_hash, role, email_verified
              FROM users
              WHERE id = ?
              LIMIT 1
            `,
          )
          .get(userId),
      );
    },
    async findUserByUsernameOrEmail(username, email) {
      return normalizeUserRow(
        db
          .prepare(
            `
              SELECT id, username, email
              FROM users
              WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
              LIMIT 1
            `,
          )
          .get(username, email),
      );
    },
    async findUserByEmail(email) {
      return normalizeUserRow(
        db
          .prepare(
            `
              SELECT id, username, email, role, email_verified
              FROM users
              WHERE LOWER(email) = LOWER(?)
              LIMIT 1
            `,
          )
          .get(email),
      );
    },
    async emailExistsForOtherUser(email, userId) {
      return Boolean(
        db
          .prepare(
            `
              SELECT id
              FROM users
              WHERE LOWER(email) = LOWER(?) AND id <> ?
              LIMIT 1
            `,
          )
          .get(email, userId),
      );
    },
    async createUser({ username, email, passwordHash, role = "user" }) {
      const result = db
        .prepare(
          `
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
          `,
        )
        .run(username, email, passwordHash, role);

      ensureUserProfileSync(result.lastInsertRowid, username);
      return this.findUserById(result.lastInsertRowid);
    },
    async getUserProfile(userId, fallbackUsername = "") {
      return ensureUserProfileSync(userId, fallbackUsername);
    },
    async updateUserProfile(userId, patch = {}) {
      const current = ensureUserProfileSync(userId);
      const next = {
        display_name:
          patch.displayName !== undefined ? patch.displayName : current.display_name,
        billing_full_name:
          patch.billing?.fullName !== undefined
            ? patch.billing.fullName
            : current.billing_full_name,
        billing_line1:
          patch.billing?.line1 !== undefined
            ? patch.billing.line1
            : current.billing_line1,
        billing_line2:
          patch.billing?.line2 !== undefined
            ? patch.billing.line2
            : current.billing_line2,
        billing_city:
          patch.billing?.city !== undefined
            ? patch.billing.city
            : current.billing_city,
        billing_zip:
          patch.billing?.zip !== undefined
            ? patch.billing.zip
            : current.billing_zip,
        billing_country:
          patch.billing?.country !== undefined
            ? patch.billing.country
            : current.billing_country,
      };

      db.prepare(
        `
          UPDATE user_profiles
          SET
            display_name = ?,
            billing_full_name = ?,
            billing_line1 = ?,
            billing_line2 = ?,
            billing_city = ?,
            billing_zip = ?,
            billing_country = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `,
      ).run(
        next.display_name,
        next.billing_full_name,
        next.billing_line1,
        next.billing_line2,
        next.billing_city,
        next.billing_zip,
        next.billing_country,
        userId,
      );

      return getUserProfileSync(userId);
    },
    async listPaymentMethodsForUser(userId, { includeRevoked = false } = {}) {
      const rows = db
        .prepare(
          `
            SELECT
              id,
              user_id,
              provider,
              type,
              provider_customer_id,
              provider_method_id,
              holder_name,
              brand,
              last4,
              expiry_month,
              expiry_year,
              funding,
              fingerprint,
              is_default,
              status,
              created_at,
              updated_at
            FROM payment_methods
            WHERE user_id = ?
              AND (? = 1 OR status <> 'revoked')
            ORDER BY is_default DESC, created_at DESC
          `,
        )
        .all(String(userId), includeRevoked ? 1 : 0);

      return rows.map(normalizePaymentMethodRow);
    },
    async findPaymentMethodByIdForUser(userId, paymentMethodId) {
      return normalizePaymentMethodRow(
        db
          .prepare(
            `
              SELECT
                id,
                user_id,
                provider,
                type,
                provider_customer_id,
                provider_method_id,
                holder_name,
                brand,
                last4,
                expiry_month,
                expiry_year,
                funding,
                fingerprint,
                is_default,
                status,
                created_at,
                updated_at
              FROM payment_methods
              WHERE user_id = ?
                AND id = ?
              LIMIT 1
            `,
          )
          .get(String(userId), paymentMethodId),
      );
    },
    async createPaymentMethodForUser(userId, input) {
      const execute = db.transaction((ownerId, payload) => {
        const existing = db
          .prepare(
            `
              SELECT id, user_id
              FROM payment_methods
              WHERE LOWER(provider) = LOWER(?)
                AND provider_method_id = ?
              LIMIT 1
            `,
          )
          .get(payload.provider, payload.providerMethodId);

        if (existing && String(existing.user_id) !== String(ownerId)) {
          const error = new Error(
            "Ez a szolgáltatói fizetési mód már egy másik fiókhoz van kapcsolva.",
          );
          error.code = "PAYMENT_METHOD_ALREADY_LINKED";
          throw error;
        }

        const hasActiveMethods = Boolean(
          db
            .prepare(
              `
                SELECT id
                FROM payment_methods
                WHERE user_id = ?
                  AND status = 'active'
                LIMIT 1
              `,
            )
            .get(String(ownerId)),
        );
        const shouldBeDefault = payload.isDefault || !hasActiveMethods;

        if (shouldBeDefault) {
          db.prepare(
            `
              UPDATE payment_methods
              SET is_default = 0, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `,
          ).run(String(ownerId));
        }

        if (existing) {
          db.prepare(
            `
              UPDATE payment_methods
              SET
                provider_customer_id = ?,
                holder_name = ?,
                brand = ?,
                last4 = ?,
                expiry_month = ?,
                expiry_year = ?,
                funding = ?,
                fingerprint = ?,
                is_default = ?,
                status = 'active',
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `,
          ).run(
            payload.providerCustomerId,
            payload.holderName,
            payload.brand,
            payload.last4,
            payload.expiryMonth,
            payload.expiryYear,
            payload.funding,
            payload.fingerprint,
            shouldBeDefault ? 1 : 0,
            existing.id,
          );

          return existing.id;
        }

        const paymentMethodId = createPaymentMethodId();
        db.prepare(
          `
            INSERT INTO payment_methods (
              id,
              user_id,
              provider,
              type,
              provider_customer_id,
              provider_method_id,
              holder_name,
              brand,
              last4,
              expiry_month,
              expiry_year,
              funding,
              fingerprint,
              is_default,
              status,
              created_at,
              updated_at
            )
            VALUES (
              ?, ?, ?, 'card', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active',
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `,
        ).run(
          paymentMethodId,
          String(ownerId),
          payload.provider,
          payload.providerCustomerId,
          payload.providerMethodId,
          payload.holderName,
          payload.brand,
          payload.last4,
          payload.expiryMonth,
          payload.expiryYear,
          payload.funding,
          payload.fingerprint,
          shouldBeDefault ? 1 : 0,
        );

        return paymentMethodId;
      });

      const paymentMethodId = execute(userId, input);
      return this.findPaymentMethodByIdForUser(userId, paymentMethodId);
    },
    async setDefaultPaymentMethodForUser(userId, paymentMethodId) {
      const execute = db.transaction((ownerId, methodId) => {
        const target = db
          .prepare(
            `
              SELECT id
              FROM payment_methods
              WHERE user_id = ?
                AND id = ?
                AND status = 'active'
              LIMIT 1
            `,
          )
          .get(String(ownerId), methodId);

        if (!target) return null;

        db.prepare(
          `
            UPDATE payment_methods
            SET is_default = 0, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `,
        ).run(String(ownerId));

        db.prepare(
          `
            UPDATE payment_methods
            SET is_default = 1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
              AND id = ?
          `,
        ).run(String(ownerId), methodId);

        return methodId;
      });

      const resolvedId = execute(userId, paymentMethodId);
      return resolvedId
        ? this.findPaymentMethodByIdForUser(userId, resolvedId)
        : null;
    },
    async removePaymentMethodForUser(userId, paymentMethodId) {
      const execute = db.transaction((ownerId, methodId) => {
        const target = db
          .prepare(
            `
              SELECT id, is_default
              FROM payment_methods
              WHERE user_id = ?
                AND id = ?
                AND status <> 'revoked'
              LIMIT 1
            `,
          )
          .get(String(ownerId), methodId);

        if (!target) return null;

        db.prepare(
          `
            UPDATE payment_methods
            SET status = 'revoked', is_default = 0, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
              AND id = ?
          `,
        ).run(String(ownerId), methodId);

        if (normalizeBool(target.is_default)) {
          const fallback = db
            .prepare(
              `
                SELECT id
                FROM payment_methods
                WHERE user_id = ?
                  AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
              `,
            )
            .get(String(ownerId));

          if (fallback?.id) {
            db.prepare(
              `
                UPDATE payment_methods
                SET is_default = 1, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                  AND id = ?
              `,
            ).run(String(ownerId), fallback.id);
          }
        }

        return true;
      });

      return Boolean(execute(userId, paymentMethodId));
    },
    async updateUserEmail(userId, email) {
      db.prepare(
        `
          UPDATE users
          SET email = ?, email_verified = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(email, userId);

      return this.findUserById(userId);
    },
    async updateUserPassword(userId, passwordHash) {
      db.prepare(
        `
          UPDATE users
          SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(passwordHash, userId);
    },
    async getAdminAccount() {
      return normalizeAdminRow(
        db
          .prepare(
            `
              SELECT id, username, email, phone, password_hash
              FROM admin_account
              WHERE id = 1
              LIMIT 1
            `,
          )
          .get(),
      );
    },
    async findAdminByIdentifier(identifier) {
      return normalizeAdminRow(
        db
          .prepare(
            `
              SELECT id, username, email, phone, password_hash
              FROM admin_account
              WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
              LIMIT 1
            `,
          )
          .get(identifier, identifier),
      );
    },
    async findAdminByEmail(email) {
      return normalizeAdminRow(
        db
          .prepare(
            `
              SELECT id, username, email, phone, password_hash
              FROM admin_account
              WHERE LOWER(email) = LOWER(?)
              LIMIT 1
            `,
          )
          .get(email),
      );
    },
    async isAdminEmail(email) {
      return Boolean(
        db
          .prepare(
            `
              SELECT id
              FROM admin_account
              WHERE LOWER(email) = LOWER(?)
              LIMIT 1
            `,
          )
          .get(email),
      );
    },
    async updateAdminContact(email, phone) {
      db.prepare(
        `
          UPDATE admin_account
          SET email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `,
      ).run(email, phone);

      return this.getAdminAccount();
    },
    async updateAdminPassword(passwordHash) {
      db.prepare(
        `
          UPDATE admin_account
          SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `,
      ).run(passwordHash);
    },
    async createSession({
      id,
      userType,
      userId,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    }) {
      db.prepare(
        `
          INSERT INTO auth_sessions (
            id,
            user_type,
            user_id,
            refresh_token_hash,
            user_agent,
            ip_address,
            expires_at,
            revoked_at,
            last_used_at,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `,
      ).run(
        id,
        userType,
        userId,
        refreshTokenHash,
        userAgent ?? "",
        ipAddress ?? "",
        expiresAt,
        nowIso(),
        nowIso(),
      );

      return this.getSessionById(id);
    },
    async getSessionById(sessionId) {
      return normalizeSessionRow(
        db
          .prepare(
            `
              SELECT
                id,
                user_type,
                user_id,
                refresh_token_hash,
                user_agent,
                ip_address,
                expires_at,
                revoked_at,
                last_used_at,
                created_at
              FROM auth_sessions
              WHERE id = ?
              LIMIT 1
            `,
          )
          .get(sessionId),
      );
    },
    async rotateSessionRefreshToken(sessionId, refreshTokenHash, expiresAt) {
      db.prepare(
        `
          UPDATE auth_sessions
          SET
            refresh_token_hash = ?,
            expires_at = ?,
            last_used_at = ?,
            revoked_at = NULL
          WHERE id = ?
        `,
      ).run(refreshTokenHash, expiresAt, nowIso(), sessionId);

      return this.getSessionById(sessionId);
    },
    async touchSession(sessionId) {
      db.prepare(
        `
          UPDATE auth_sessions
          SET last_used_at = ?
          WHERE id = ?
        `,
      ).run(nowIso(), sessionId);
    },
    async revokeSession(sessionId) {
      db.prepare(
        `
          UPDATE auth_sessions
          SET revoked_at = COALESCE(revoked_at, ?)
          WHERE id = ?
        `,
      ).run(nowIso(), sessionId);
    },
    async revokeUserSessions(userType, userId, excludeSessionId = null) {
      db.prepare(
        `
          UPDATE auth_sessions
          SET revoked_at = COALESCE(revoked_at, ?)
          WHERE user_type = ?
            AND user_id = ?
            AND (? IS NULL OR id <> ?)
        `,
      ).run(nowIso(), userType, userId, excludeSessionId, excludeSessionId);
    },
    async getThrottle(scope, throttleKey) {
      return (
        db
          .prepare(
            `
              SELECT
                scope,
                throttle_key,
                attempt_count,
                first_attempt_at,
                last_attempt_at,
                locked_until
              FROM auth_throttles
              WHERE scope = ? AND throttle_key = ?
              LIMIT 1
            `,
          )
          .get(scope, throttleKey) ?? null
      );
    },
    async upsertThrottle(record) {
      db.prepare(
        `
          INSERT INTO auth_throttles (
            scope,
            throttle_key,
            attempt_count,
            first_attempt_at,
            last_attempt_at,
            locked_until
          )
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(scope, throttle_key) DO UPDATE SET
            attempt_count = excluded.attempt_count,
            first_attempt_at = excluded.first_attempt_at,
            last_attempt_at = excluded.last_attempt_at,
            locked_until = excluded.locked_until
        `,
      ).run(
        record.scope,
        record.throttleKey,
        record.attemptCount,
        record.firstAttemptAt,
        record.lastAttemptAt,
        record.lockedUntil,
      );
    },
    async clearThrottle(scope, throttleKey) {
      db.prepare(
        `
          DELETE FROM auth_throttles
          WHERE scope = ? AND throttle_key = ?
        `,
      ).run(scope, throttleKey);
    },
    async createPasswordResetToken({
      userType,
      userId,
      tokenHash,
      expiresAt,
    }) {
      db.prepare(
        `
          INSERT INTO password_reset_tokens (
            user_type,
            user_id,
            token_hash,
            expires_at,
            used_at,
            created_at
          )
          VALUES (?, ?, ?, ?, NULL, ?)
        `,
      ).run(userType, userId, tokenHash, expiresAt, nowIso());
    },
    async findPasswordResetToken(tokenHash) {
      return (
        db
          .prepare(
            `
              SELECT id, user_type, user_id, token_hash, expires_at, used_at, created_at
              FROM password_reset_tokens
              WHERE token_hash = ?
              LIMIT 1
            `,
          )
          .get(tokenHash) ?? null
      );
    },
    async markPasswordResetUsed(id) {
      db.prepare(
        `
          UPDATE password_reset_tokens
          SET used_at = ?
          WHERE id = ?
        `,
      ).run(nowIso(), id);
    },
    async clearPasswordResetTokensForUser(userType, userId) {
      db.prepare(
        `
          DELETE FROM password_reset_tokens
          WHERE user_type = ? AND user_id = ?
        `,
      ).run(userType, userId);
    },
    async createEmailVerificationToken({
      userType,
      userId,
      email,
      purpose = "registration",
      tokenHash,
      expiresAt,
    }) {
      db.prepare(
        `
          INSERT INTO email_verification_tokens (
            user_type,
            user_id,
            email,
            purpose,
            token_hash,
            expires_at,
            used_at,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
        `,
      ).run(userType, userId, email, purpose, tokenHash, expiresAt, nowIso());
    },
    async findEmailVerificationToken(tokenHash) {
      return (
        db
          .prepare(
            `
              SELECT
                id,
                user_type,
                user_id,
                email,
                purpose,
                token_hash,
                expires_at,
                used_at,
                created_at
              FROM email_verification_tokens
              WHERE token_hash = ?
              LIMIT 1
            `,
          )
          .get(tokenHash) ?? null
      );
    },
    async markEmailVerificationUsed(id) {
      db.prepare(
        `
          UPDATE email_verification_tokens
          SET used_at = ?
          WHERE id = ?
        `,
      ).run(nowIso(), id);
    },
    async clearEmailVerificationTokensForUser(
      userType,
      userId,
      purpose = null,
    ) {
      db.prepare(
        `
          DELETE FROM email_verification_tokens
          WHERE user_type = ?
            AND user_id = ?
            AND (? IS NULL OR purpose = ?)
        `,
      ).run(userType, userId, purpose, purpose);
    },
    async markUserEmailVerified(userId) {
      db.prepare(
        `
          UPDATE users
          SET email_verified = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(userId);

      return this.findUserById(userId);
    },
    async createLegalAcceptance({
      userType,
      userId,
      documentKey,
      documentVersion,
      ipAddress,
      userAgent,
      acceptedAt = null,
    }) {
      db.prepare(
        `
          INSERT INTO legal_acceptances (
            user_type,
            user_id,
            document_key,
            document_version,
            ip_address,
            user_agent,
            accepted_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        userType,
        userId,
        documentKey,
        documentVersion,
        ipAddress ?? "",
        userAgent ?? "",
        acceptedAt ?? nowIso(),
      );
    },
    async listCoupons({ activeOnly = false } = {}) {
      return listCouponRowsSync({ activeOnly }).map(normalizeCouponRow);
    },
    async findCouponById(couponId) {
      return normalizeCouponRow(getCouponRowByIdSync(couponId));
    },
    async findCouponByCode(code, { activeOnly = false } = {}) {
      return normalizeCouponRow(getCouponRowByCodeSync(code, activeOnly));
    },
    async createCoupon(couponInput) {
      const id = couponInput.id || createCouponId();
      db.prepare(
        `
          INSERT INTO coupons (
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
      ).run(
        id,
        normalizeCouponCode(couponInput.code),
        couponInput.label,
        couponInput.description,
        couponInput.type,
        couponInput.percent ?? null,
        couponInput.amount ?? null,
        couponInput.minSubtotal ?? 0,
        couponInput.maxDiscount ?? null,
        JSON.stringify(couponInput.appliesToShippingMethods ?? []),
        couponInput.active === false ? 0 : 1,
      );

      return this.findCouponById(id);
    },
    async updateCoupon(couponId, patch) {
      db.prepare(
        `
          UPDATE coupons
          SET
            code = ?,
            label = ?,
            description = ?,
            type = ?,
            percent = ?,
            amount = ?,
            min_subtotal = ?,
            max_discount = ?,
            applies_to_shipping_methods = ?,
            active = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(
        normalizeCouponCode(patch.code),
        patch.label,
        patch.description,
        patch.type,
        patch.percent ?? null,
        patch.amount ?? null,
        patch.minSubtotal ?? 0,
        patch.maxDiscount ?? null,
        JSON.stringify(patch.appliesToShippingMethods ?? []),
        patch.active === false ? 0 : 1,
        couponId,
      );

      return this.findCouponById(couponId);
    },
    async deactivateCoupon(couponId) {
      db.prepare(
        `
          UPDATE coupons
          SET active = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(couponId);
    },
    async listProducts({ includeInactive = false } = {}) {
      const now = nowIso();
      const rows = db
        .prepare(
          `
            SELECT
              id,
              name,
              price,
              category,
              image,
              description,
              is_new,
              stock_quantity,
              active
            FROM products
            ${includeInactive ? "" : "WHERE active = 1"}
            ORDER BY created_at DESC, id DESC
          `,
        )
        .all();

      return rows.map((row) =>
        normalizeProductRow(
          row,
          getReservedQuantityForProductSync(row.id, now),
        ),
      );
    },
    async findProductById(productId, { includeInactive = false } = {}) {
      const row = getProductRowSync(productId, includeInactive);
      if (!row) return null;

      return normalizeProductRow(
        row,
        getReservedQuantityForProductSync(productId, nowIso()),
      );
    },
    async createProduct(productInput) {
      const id = productInput.id || createProductId();
      db.prepare(
        `
          INSERT INTO products (
            id,
            name,
            price,
            category,
            image,
            description,
            is_new,
            stock_quantity,
            active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
      ).run(
        id,
        productInput.name,
        productInput.price,
        productInput.category,
        productInput.image,
        productInput.description,
        productInput.isNew ? 1 : 0,
        productInput.stockQuantity,
      );

      return this.findProductById(id, { includeInactive: true });
    },
    async updateProduct(productId, patch) {
      db.prepare(
        `
          UPDATE products
          SET
            name = ?,
            price = ?,
            category = ?,
            image = ?,
            description = ?,
            is_new = ?,
            stock_quantity = ?,
            active = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(
        patch.name,
        patch.price,
        patch.category,
        patch.image,
        patch.description,
        patch.isNew ? 1 : 0,
        patch.stockQuantity,
        patch.active === false ? 0 : 1,
        productId,
      );

      return this.findProductById(productId, { includeInactive: true });
    },
    async deactivateProduct(productId) {
      db.prepare(
        `
          UPDATE products
          SET active = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(productId);
    },
    async getCart(userType, userId) {
      return getCartSync(userType, userId);
    },
    async saveCart(userType, userId, items, reservationMinutes) {
      const execute = db.transaction((sanitizedItems) => {
        const cart = getOrCreateActiveCartSync(userType, userId);
        const reservationUntil = addMinutes(nowIso(), reservationMinutes);

        for (const item of sanitizedItems) {
          const product = getProductRowSync(item.productId, false);
          if (!product) {
            const error = new Error("A termek nem elerheto.");
            error.code = "PRODUCT_NOT_FOUND";
            error.productId = item.productId;
            throw error;
          }

          const otherReserved = getReservedQuantityForProductSync(
            item.productId,
            nowIso(),
            cart.id,
          );

          if (item.quantity > Number(product.stock_quantity) - otherReserved) {
            const error = new Error("Nincs eleg keszlet a termekhez.");
            error.code = "INSUFFICIENT_STOCK";
            error.productId = item.productId;
            error.availableQuantity = Math.max(
              Number(product.stock_quantity) - otherReserved,
              0,
            );
            throw error;
          }
        }

        const existingIds = db
          .prepare("SELECT product_id FROM cart_items WHERE cart_id = ?")
          .all(cart.id)
          .map((row) => row.product_id);

        const nextIds = sanitizedItems.map((item) => item.productId);

        for (const existingId of existingIds) {
          if (!nextIds.includes(existingId)) {
            db.prepare(
              `
                DELETE FROM cart_items
                WHERE cart_id = ? AND product_id = ?
              `,
            ).run(cart.id, existingId);
          }
        }

        for (const item of sanitizedItems) {
          db.prepare(
            `
              INSERT INTO cart_items (
                cart_id,
                product_id,
                quantity,
                reserved_until,
                created_at,
                updated_at
              )
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT(cart_id, product_id) DO UPDATE SET
                quantity = excluded.quantity,
                reserved_until = excluded.reserved_until,
                updated_at = CURRENT_TIMESTAMP
            `,
          ).run(cart.id, item.productId, item.quantity, reservationUntil);
        }

        db.prepare(
          `
            UPDATE carts
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
        ).run(cart.id);

        return getCartSync(userType, userId);
      });

      return execute(items);
    },
    async clearCart(userType, userId) {
      const cart = getOrCreateActiveCartSync(userType, userId);
      db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cart.id);
      db.prepare(
        `
          UPDATE carts
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(cart.id);

      return getCartSync(userType, userId);
    },
    async createOrderFromCart(userType, userId, orderInput) {
      const execute = db.transaction((payload) => {
        const cart = getOrCreateActiveCartSync(userType, userId);
        const cartRows = db
          .prepare(
            `
              SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.category,
                p.image,
                p.stock_quantity,
                p.active
              FROM cart_items ci
              JOIN products p ON p.id = ci.product_id
              WHERE ci.cart_id = ?
              ORDER BY ci.id ASC
            `,
          )
          .all(cart.id);

        if (cartRows.length === 0) {
          const error = new Error("A kosar ures.");
          error.code = "EMPTY_CART";
          throw error;
        }

        const now = nowIso();
        for (const row of cartRows) {
          if (!normalizeBool(row.active)) {
            const error = new Error("Van mar nem elerheto termek a kosarban.");
            error.code = "PRODUCT_NOT_FOUND";
            error.productId = row.product_id;
            throw error;
          }

          const otherReserved = getReservedQuantityForProductSync(
            row.product_id,
            now,
            cart.id,
          );
          const available = Number(row.stock_quantity) - otherReserved;
          if (available < Number(row.quantity)) {
            const error = new Error("Nincs eleg keszlet az egyik termekhez.");
            error.code = "INSUFFICIENT_STOCK";
            error.productId = row.product_id;
            error.availableQuantity = Math.max(available, 0);
            throw error;
          }
        }

        const subtotal = cartRows.reduce(
          (sum, row) => sum + Number(row.price) * Number(row.quantity),
          0,
        );
        const coupons = listCouponRowsSync({ activeOnly: true }).map(
          normalizeCouponRow,
        );
        const {
          shippingMethod,
          shippingPrice,
          discountCode,
          discountAmount,
          total,
        } = buildOrderPricing({
          subtotal,
          shippingMethodId: payload.shippingMethod,
          couponCode: payload.couponCode,
          coupons,
        });
        const orderId = createOrderId();

        db.prepare(
          `
            INSERT INTO orders (
              id,
              user_type,
              user_id,
              contact_email,
              contact_phone,
          payment_method,
          shipping_method,
          status,
          tracking_number,
          discount_code,
          discount_amount,
          confirmed_at,
              processing_started_at,
              shipped_at,
              delivered_at,
              subtotal,
              shipping_price,
              total,
              shipping_full_name,
              shipping_line1,
              shipping_line2,
              shipping_city,
              shipping_zip,
              shipping_country,
              billing_full_name,
              billing_line1,
              billing_line2,
              billing_city,
              billing_zip,
              billing_country,
              inventory_released,
              created_at,
              updated_at
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, 'pending',
              NULL, ?, ?, NULL, NULL, NULL, NULL,
              ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              0,
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `,
        ).run(
          orderId,
          userType,
          userId,
          payload.contactEmail,
          payload.contactPhone,
          payload.paymentMethod,
          shippingMethod.id,
          discountCode,
          discountAmount,
          subtotal,
          shippingPrice,
          total,
          payload.shipping.fullName,
          payload.shipping.line1,
          payload.shipping.line2,
          payload.shipping.city,
          payload.shipping.zip,
          payload.shipping.country,
          payload.billing.fullName,
          payload.billing.line1,
          payload.billing.line2,
          payload.billing.city,
          payload.billing.zip,
          payload.billing.country,
        );

        const insertOrderItem = db.prepare(
          `
            INSERT INTO order_items (
              order_id,
              product_id,
              product_name,
              product_image,
              product_category,
              unit_price,
              quantity,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `,
        );

        const decrementStock = db.prepare(
          `
            UPDATE products
            SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
        );

        for (const row of cartRows) {
          insertOrderItem.run(
            orderId,
            row.product_id,
            row.name,
            row.image,
            row.category,
            Number(row.price),
            Number(row.quantity),
          );
          decrementStock.run(Number(row.quantity), row.product_id);
        }

        db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cart.id);
        db.prepare(
          `
            UPDATE carts
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
        ).run(cart.id);

        return getOrderByIdSync(orderId);
      });

      return execute(orderInput);
    },
    async listOrdersForUser(userType, userId) {
      return listOrdersSync(
        `
          SELECT id
          FROM orders
          WHERE user_type = ? AND user_id = ?
          ORDER BY created_at DESC, id DESC
        `,
        [userType, userId],
      );
    },
    async listAllOrders() {
      return listOrdersSync(
        `
          SELECT id
          FROM orders
          ORDER BY created_at DESC, id DESC
        `,
        [],
      );
    },
    async getOrderById(orderId) {
      return synchronizeOrderLifecycleSync(orderId);
    },
    async recordOrderFulfillmentEvent(orderId, payload = {}) {
      const execute = db.transaction((targetOrderId, input) => {
        const current = getOrderByIdSync(targetOrderId);
        if (!current) {
          return null;
        }

        const event = String(input?.event ?? "").trim();
        if (!FULFILLMENT_EVENTS.has(event)) {
          throw createDbError(
            "INVALID_FULFILLMENT_EVENT",
            "Ervenytelen fulfillment esemeny.",
          );
        }

        const occurredAt = normalizeLifecycleTimestamp(input?.occurredAt);
        const trackingNumber = normalizeTrackingNumber(input?.trackingNumber);
        const next = applyFulfillmentEvent(
          current,
          event,
          occurredAt,
          trackingNumber,
        );

        if (event === "cancelled" && !current.inventoryReleased) {
          const restore = db.prepare(
            `
              UPDATE products
              SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `,
          );

          for (const item of current.items) {
            if (item.productId) {
              restore.run(item.quantity, item.productId);
            }
          }

        }

        db.prepare(
          `
            UPDATE orders
            SET
              status = ?,
              tracking_number = ?,
              confirmed_at = ?,
              processing_started_at = ?,
              shipped_at = ?,
              delivered_at = ?,
              inventory_released = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
        ).run(
          next.status,
          next.trackingNumber,
          next.confirmedAt,
          next.processingStartedAt,
          next.shippedAt,
          next.deliveredAt,
          next.inventoryReleased ? 1 : 0,
          targetOrderId,
        );

        return getOrderByIdSync(targetOrderId);
      });

      return execute(orderId, payload);
    },
  };
}

function createPostgresAdapter() {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  });

  pool.on("error", (error) => {
    console.error("Varatlan PostgreSQL pool hiba.", error);
  });

  async function withClient(fn) {
    const client = await pool.connect();

    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async function withTransaction(fn) {
    return withClient(async (client) => {
      await client.query("BEGIN");

      try {
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  }

  async function getUserProfile(client, userId, fallbackUsername = "") {
    const result = await client.query(
      `
        SELECT
          user_id,
          display_name,
          billing_full_name,
          billing_line1,
          billing_line2,
          billing_city,
          billing_zip,
          billing_country
        FROM user_profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (result.rows[0]) {
      return normalizeProfileRow(result.rows[0], fallbackUsername);
    }

    await client.query(
      `
        INSERT INTO user_profiles (
          user_id,
          display_name,
          billing_full_name,
          billing_line1,
          billing_line2,
          billing_city,
          billing_zip,
          billing_country
        )
        VALUES ($1, $2, '', '', '', '', '', 'Magyarorszag')
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId, fallbackUsername || ""],
    );

    const retry = await client.query(
      `
        SELECT
          user_id,
          display_name,
          billing_full_name,
          billing_line1,
          billing_line2,
          billing_city,
          billing_zip,
          billing_country
        FROM user_profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    return normalizeProfileRow(retry.rows[0], fallbackUsername);
  }

  async function getOrCreateActiveCart(client, userType, userId) {
    const existing = await client.query(
      `
        SELECT id, user_type, user_id, status
        FROM carts
        WHERE user_type = $1 AND user_id = $2 AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
      `,
      [userType, userId],
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const inserted = await client.query(
      `
        INSERT INTO carts (user_type, user_id, status)
        VALUES ($1, $2, 'active')
        RETURNING id, user_type, user_id, status
      `,
      [userType, userId],
    );

    return inserted.rows[0];
  }

  async function getReservedQuantityForProduct(
    client,
    productId,
    now,
    excludeCartId = null,
  ) {
    const result = await client.query(
      `
        SELECT COALESCE(SUM(ci.quantity), 0) AS reserved_quantity
        FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id
        WHERE ci.product_id = $1
          AND c.status = 'active'
          AND ci.reserved_until IS NOT NULL
          AND ci.reserved_until > $2
          AND ($3::BIGINT IS NULL OR ci.cart_id <> $3)
      `,
      [productId, now, excludeCartId],
    );

    return Number(result.rows[0]?.reserved_quantity ?? 0);
  }

  async function getProductRow(client, productId, includeInactive = false) {
    const result = await client.query(
      `
        SELECT
          id,
          name,
          price,
          category,
          image,
          description,
          is_new,
          stock_quantity,
          active
        FROM products
        WHERE id = $1
          ${includeInactive ? "" : "AND active = TRUE"}
        LIMIT 1
      `,
      [productId],
    );

    return result.rows[0] ?? null;
  }

  async function listCouponRows(client, { activeOnly = false } = {}) {
    const result = await client.query(
      `
        SELECT
          id,
          code,
          label,
          description,
          type,
          percent,
          amount,
          min_subtotal,
          max_discount,
          applies_to_shipping_methods,
          active,
          created_at,
          updated_at
        FROM coupons
        ${activeOnly ? "WHERE active = TRUE" : ""}
        ORDER BY active DESC, created_at DESC, id DESC
      `,
    );

    return result.rows;
  }

  async function getCouponRowById(client, couponId) {
    const result = await client.query(
      `
        SELECT
          id,
          code,
          label,
          description,
          type,
          percent,
          amount,
          min_subtotal,
          max_discount,
          applies_to_shipping_methods,
          active,
          created_at,
          updated_at
        FROM coupons
        WHERE id = $1
        LIMIT 1
      `,
      [couponId],
    );

    return result.rows[0] ?? null;
  }

  async function getCouponRowByCode(client, code, activeOnly = false) {
    const result = await client.query(
      `
        SELECT
          id,
          code,
          label,
          description,
          type,
          percent,
          amount,
          min_subtotal,
          max_discount,
          applies_to_shipping_methods,
          active,
          created_at,
          updated_at
        FROM coupons
        WHERE LOWER(code) = LOWER($1)
          ${activeOnly ? "AND active = TRUE" : ""}
        LIMIT 1
      `,
      [code],
    );

    return result.rows[0] ?? null;
  }

  async function getOrderById(client, orderId) {
    const orderResult = await client.query(
      `
        SELECT
          id,
          user_type,
          user_id,
          contact_email,
          contact_phone,
          payment_method,
          shipping_method,
          status,
          tracking_number,
          discount_code,
          discount_amount,
          confirmed_at,
          processing_started_at,
          shipped_at,
          delivered_at,
          subtotal,
          shipping_price,
          total,
          shipping_full_name,
          shipping_line1,
          shipping_line2,
          shipping_city,
          shipping_zip,
          shipping_country,
          billing_full_name,
          billing_line1,
          billing_line2,
          billing_city,
          billing_zip,
          billing_country,
          inventory_released,
          created_at,
          updated_at
        FROM orders
        WHERE id = $1
        LIMIT 1
      `,
      [orderId],
    );

    if (!orderResult.rows[0]) return null;

    const order = normalizeOrderRow(orderResult.rows[0]);
    order.inventoryReleased = normalizeBool(orderResult.rows[0].inventory_released);

    const itemsResult = await client.query(
      `
        SELECT
          id,
          product_id,
          product_name,
          product_image,
          product_category,
          unit_price,
          quantity
        FROM order_items
        WHERE order_id = $1
        ORDER BY id ASC
      `,
      [orderId],
    );

    order.items = itemsResult.rows.map(normalizeOrderItemRow);
    return order;
  }

  async function synchronizeOrderLifecycle(client, orderId) {
    const current = await getOrderById(client, orderId);
    if (!current) {
      return current;
    }

    const next = resolveLifecycleState(current);
    const shouldUpdate =
      next.status !== current.status ||
      (next.trackingNumber ?? null) !== (current.trackingNumber ?? null);

    if (!shouldUpdate) {
      return current;
    }

    await client.query(
      `
        UPDATE orders
        SET
          status = $1,
          tracking_number = $2,
          updated_at = NOW()
        WHERE id = $3
      `,
      [next.status, next.trackingNumber, orderId],
    );

    return getOrderById(client, orderId);
  }

  async function synchronizeAllOrdersLifecycle(client) {
    const result = await client.query(
      `
        SELECT id
        FROM orders
        WHERE status <> 'cancelled'
        ORDER BY created_at ASC, id ASC
      `,
    );

    for (const row of result.rows) {
      await synchronizeOrderLifecycle(client, row.id);
    }
  }

  async function getCart(client, userType, userId) {
    const cart = await getOrCreateActiveCart(client, userType, userId);
    const now = nowIso();
    const rows = (
      await client.query(
        `
          SELECT
            ci.product_id,
            ci.quantity,
            ci.reserved_until,
            p.id,
            p.name,
            p.price,
            p.category,
            p.image,
            p.description,
            p.is_new,
            p.stock_quantity,
            p.active
          FROM cart_items ci
          JOIN products p ON p.id = ci.product_id
          WHERE ci.cart_id = $1
            AND p.active = TRUE
          ORDER BY ci.id ASC
        `,
        [cart.id],
      )
    ).rows;

    const lines = [];
    for (const row of rows) {
      const otherReserved = await getReservedQuantityForProduct(
        client,
        row.product_id,
        now,
        cart.id,
      );
      const availableQuantity = Math.max(
        Number(row.stock_quantity) - otherReserved,
        0,
      );
      lines.push(
        normalizeCartLine(
          {
            ...row,
            other_reserved_quantity: otherReserved,
          },
          availableQuantity,
        ),
      );
    }

    return buildCartResponse(lines);
  }

  async function listOrders(client, query, params) {
    await synchronizeAllOrdersLifecycle(client);
    const result = await client.query(query, params);
    const orders = [];

    for (const row of result.rows) {
      orders.push(await getOrderById(client, row.id));
    }

    return orders;
  }

  return {
    name: "postgres",
    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          username TEXT NOT NULL CHECK (char_length(username) BETWEEN 3 AND 32),
          email TEXT NOT NULL CHECK (char_length(email) BETWEEN 6 AND 320),
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
        ON users ((LOWER(username)))
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
        ON users ((LOWER(email)))
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          display_name TEXT NOT NULL DEFAULT '',
          billing_full_name TEXT NOT NULL DEFAULT '',
          billing_line1 TEXT NOT NULL DEFAULT '',
          billing_line2 TEXT NOT NULL DEFAULT '',
          billing_city TEXT NOT NULL DEFAULT '',
          billing_zip TEXT NOT NULL DEFAULT '',
          billing_country TEXT NOT NULL DEFAULT 'Magyarorszag',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'card' CHECK (type IN ('card')),
          provider_customer_id TEXT,
          provider_method_id TEXT NOT NULL,
          holder_name TEXT NOT NULL DEFAULT '',
          brand TEXT NOT NULL DEFAULT '',
          last4 TEXT NOT NULL CHECK (char_length(last4) = 4),
          expiry_month TEXT NOT NULL,
          expiry_year TEXT NOT NULL,
          funding TEXT NOT NULL DEFAULT '',
          fingerprint TEXT NOT NULL DEFAULT '',
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'active'
            CHECK (status IN ('active', 'pending_setup', 'revoked')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_provider_ref_idx
        ON payment_methods ((LOWER(provider)), provider_method_id)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS payment_methods_user_idx
        ON payment_methods (user_id, status, is_default, created_at)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_account (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          username TEXT NOT NULL DEFAULT 'admin',
          email TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          refresh_token_hash TEXT NOT NULL,
          user_agent TEXT NOT NULL DEFAULT '',
          ip_address TEXT NOT NULL DEFAULT '',
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ,
          last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_sessions_user_idx
        ON auth_sessions (user_type, user_id)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_throttles (
          scope TEXT NOT NULL,
          throttle_key TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          first_attempt_at TIMESTAMPTZ NOT NULL,
          last_attempt_at TIMESTAMPTZ NOT NULL,
          locked_until TIMESTAMPTZ,
          PRIMARY KEY (scope, throttle_key)
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id BIGSERIAL PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id BIGSERIAL PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user')),
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          purpose TEXT NOT NULL DEFAULT 'registration'
            CHECK (purpose IN ('registration', 'email_change')),
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx
        ON email_verification_tokens (user_type, user_id, purpose)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS legal_acceptances (
          id BIGSERIAL PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user')),
          user_id TEXT NOT NULL,
          document_key TEXT NOT NULL CHECK (document_key IN ('terms', 'privacy')),
          document_version TEXT NOT NULL,
          ip_address TEXT NOT NULL DEFAULT '',
          user_agent TEXT NOT NULL DEFAULT '',
          accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS legal_acceptances_user_idx
        ON legal_acceptances (user_type, user_id, document_key, accepted_at)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price INTEGER NOT NULL CHECK (price >= 0),
          category TEXT NOT NULL CHECK (category IN ('polo', 'pulover', 'nadrag', 'cipo')),
          image TEXT NOT NULL,
          description TEXT NOT NULL,
          is_new BOOLEAN NOT NULL DEFAULT FALSE,
          stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          label TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('percent', 'fixed', 'shipping')),
          percent INTEGER,
          amount INTEGER,
          min_subtotal INTEGER NOT NULL DEFAULT 0,
          max_discount INTEGER,
          applies_to_shipping_methods TEXT NOT NULL DEFAULT '[]',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_lower_idx
        ON coupons ((LOWER(code)))
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS carts (
          id BIGSERIAL PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS carts_owner_idx
        ON carts (user_type, user_id, status)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id BIGSERIAL PRIMARY KEY,
          cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          reserved_until TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (cart_id, product_id)
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS cart_items_product_idx
        ON cart_items (product_id, reserved_until)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
          user_id TEXT NOT NULL,
          contact_email TEXT NOT NULL,
          contact_phone TEXT NOT NULL,
          payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'card', 'transfer')),
          shipping_method TEXT NOT NULL DEFAULT 'gls_home',
          status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
          tracking_number TEXT,
          discount_code TEXT,
          discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
          confirmed_at TIMESTAMPTZ,
          processing_started_at TIMESTAMPTZ,
          shipped_at TIMESTAMPTZ,
          delivered_at TIMESTAMPTZ,
          subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
          shipping_price INTEGER NOT NULL DEFAULT 0 CHECK (shipping_price >= 0),
          total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
          shipping_full_name TEXT NOT NULL,
          shipping_line1 TEXT NOT NULL,
          shipping_line2 TEXT NOT NULL DEFAULT '',
          shipping_city TEXT NOT NULL,
          shipping_zip TEXT NOT NULL,
          shipping_country TEXT NOT NULL,
          billing_full_name TEXT NOT NULL,
          billing_line1 TEXT NOT NULL,
          billing_line2 TEXT NOT NULL DEFAULT '',
          billing_city TEXT NOT NULL,
          billing_zip TEXT NOT NULL,
          billing_country TEXT NOT NULL,
          inventory_released BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS orders_owner_idx
        ON orders (user_type, user_id, created_at)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id BIGSERIAL PRIMARY KEY,
          order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id TEXT,
          product_name TEXT NOT NULL,
          product_image TEXT NOT NULL,
          product_category TEXT NOT NULL,
          unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await ensurePostgresOrderColumns(pool);

      await ensureDefaultAdmin(async ({ email, phone, passwordHash }) => {
        await pool.query(
          `
            INSERT INTO admin_account (id, username, email, phone, password_hash)
            VALUES (1, 'admin', $1, $2, $3)
            ON CONFLICT (id) DO NOTHING
          `,
          [email, phone, passwordHash],
        );
      });

      const productCountResult = await pool.query(
        "SELECT COUNT(*)::int AS count FROM products",
      );

      if (Number(productCountResult.rows[0]?.count ?? 0) === 0) {
        for (const product of seedProducts) {
          await pool.query(
            `
              INSERT INTO products (
                id,
                name,
                price,
                category,
                image,
                description,
                is_new,
                stock_quantity,
                active
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
            `,
            [
              product.id,
              product.name,
              product.price,
              product.category,
              product.image,
              product.description,
              product.isNew,
              product.stockQuantity,
            ],
          );
        }
      }

      const couponCountResult = await pool.query(
        "SELECT COUNT(*)::int AS count FROM coupons",
      );

      if (Number(couponCountResult.rows[0]?.count ?? 0) === 0) {
        for (const coupon of DEFAULT_COUPONS) {
          await pool.query(
            `
              INSERT INTO coupons (
                id,
                code,
                label,
                description,
                type,
                percent,
                amount,
                min_subtotal,
                max_discount,
                applies_to_shipping_methods,
                active
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
            `,
            [
              createCouponId(),
              normalizeCouponCode(coupon.code),
              coupon.label,
              coupon.description,
              coupon.type,
              coupon.percent ?? null,
              coupon.amount ?? null,
              coupon.minSubtotal ?? 0,
              coupon.maxDiscount ?? null,
              JSON.stringify(coupon.appliesToShippingMethods ?? []),
            ],
          );
        }
      }
    },
    async findUserByIdentifier(identifier) {
      const result = await pool.query(
        `
          SELECT id, username, email, password_hash, role, email_verified
          FROM users
          WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [identifier],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async findUserById(userId) {
      const result = await pool.query(
        `
          SELECT id, username, email, role, email_verified
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [userId],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async findUserWithPasswordById(userId) {
      const result = await pool.query(
        `
          SELECT id, username, email, password_hash, role, email_verified
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [userId],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async findUserByUsernameOrEmail(username, email) {
      const result = await pool.query(
        `
          SELECT id, username, email
          FROM users
          WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)
          LIMIT 1
        `,
        [username, email],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async findUserByEmail(email) {
      const result = await pool.query(
        `
          SELECT id, username, email, role, email_verified
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [email],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async emailExistsForOtherUser(email, userId) {
      const result = await pool.query(
        `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1) AND id <> $2
          LIMIT 1
        `,
        [email, userId],
      );

      return result.rowCount > 0;
    },
    async createUser({ username, email, passwordHash, role = "user" }) {
      const result = await pool.query(
        `
          INSERT INTO users (username, email, password_hash, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, username, email, role, email_verified
        `,
        [username, email, passwordHash, role],
      );

      await withClient((client) => getUserProfile(client, result.rows[0].id, username));
      return normalizeUserRow(result.rows[0]);
    },
    async getUserProfile(userId, fallbackUsername = "") {
      return withClient((client) => getUserProfile(client, userId, fallbackUsername));
    },
    async updateUserProfile(userId, patch = {}) {
      return withClient(async (client) => {
        const current = await getUserProfile(client, userId);
        const next = {
          display_name:
            patch.displayName !== undefined
              ? patch.displayName
              : current.display_name,
          billing_full_name:
            patch.billing?.fullName !== undefined
              ? patch.billing.fullName
              : current.billing_full_name,
          billing_line1:
            patch.billing?.line1 !== undefined
              ? patch.billing.line1
              : current.billing_line1,
          billing_line2:
            patch.billing?.line2 !== undefined
              ? patch.billing.line2
              : current.billing_line2,
          billing_city:
            patch.billing?.city !== undefined
              ? patch.billing.city
              : current.billing_city,
          billing_zip:
            patch.billing?.zip !== undefined
              ? patch.billing.zip
              : current.billing_zip,
          billing_country:
            patch.billing?.country !== undefined
              ? patch.billing.country
              : current.billing_country,
        };

        await client.query(
          `
            UPDATE user_profiles
            SET
              display_name = $1,
              billing_full_name = $2,
              billing_line1 = $3,
              billing_line2 = $4,
              billing_city = $5,
              billing_zip = $6,
              billing_country = $7,
              updated_at = NOW()
            WHERE user_id = $8
          `,
          [
            next.display_name,
            next.billing_full_name,
            next.billing_line1,
            next.billing_line2,
            next.billing_city,
            next.billing_zip,
            next.billing_country,
            userId,
          ],
        );

        return getUserProfile(client, userId);
      });
    },
    async listPaymentMethodsForUser(userId, { includeRevoked = false } = {}) {
      const result = await pool.query(
        `
          SELECT
            id,
            user_id,
            provider,
            type,
            provider_customer_id,
            provider_method_id,
            holder_name,
            brand,
            last4,
            expiry_month,
            expiry_year,
            funding,
            fingerprint,
            is_default,
            status,
            created_at,
            updated_at
          FROM payment_methods
          WHERE user_id = $1
            AND ($2::boolean = TRUE OR status <> 'revoked')
          ORDER BY is_default DESC, created_at DESC
        `,
        [String(userId), includeRevoked],
      );

      return result.rows.map(normalizePaymentMethodRow);
    },
    async findPaymentMethodByIdForUser(userId, paymentMethodId) {
      const result = await pool.query(
        `
          SELECT
            id,
            user_id,
            provider,
            type,
            provider_customer_id,
            provider_method_id,
            holder_name,
            brand,
            last4,
            expiry_month,
            expiry_year,
            funding,
            fingerprint,
            is_default,
            status,
            created_at,
            updated_at
          FROM payment_methods
          WHERE user_id = $1
            AND id = $2
          LIMIT 1
        `,
        [String(userId), paymentMethodId],
      );

      return normalizePaymentMethodRow(result.rows[0]);
    },
    async createPaymentMethodForUser(userId, input) {
      return withTransaction(async (client) => {
        const existing = (
          await client.query(
            `
              SELECT id, user_id
              FROM payment_methods
              WHERE LOWER(provider) = LOWER($1)
                AND provider_method_id = $2
              LIMIT 1
            `,
            [input.provider, input.providerMethodId],
          )
        ).rows[0];

        if (existing && String(existing.user_id) !== String(userId)) {
          const error = new Error(
            "Ez a szolgáltatói fizetési mód már egy másik fiókhoz van kapcsolva.",
          );
          error.code = "PAYMENT_METHOD_ALREADY_LINKED";
          throw error;
        }

        const hasActiveMethods = Boolean(
          (
            await client.query(
              `
                SELECT id
                FROM payment_methods
                WHERE user_id = $1
                  AND status = 'active'
                LIMIT 1
              `,
              [String(userId)],
            )
          ).rows[0],
        );
        const shouldBeDefault = input.isDefault || !hasActiveMethods;

        if (shouldBeDefault) {
          await client.query(
            `
              UPDATE payment_methods
              SET is_default = FALSE, updated_at = NOW()
              WHERE user_id = $1
            `,
            [String(userId)],
          );
        }

        let paymentMethodId = existing?.id ?? createPaymentMethodId();

        if (existing) {
          await client.query(
            `
              UPDATE payment_methods
              SET
                provider_customer_id = $1,
                holder_name = $2,
                brand = $3,
                last4 = $4,
                expiry_month = $5,
                expiry_year = $6,
                funding = $7,
                fingerprint = $8,
                is_default = $9,
                status = 'active',
                updated_at = NOW()
              WHERE id = $10
            `,
            [
              input.providerCustomerId,
              input.holderName,
              input.brand,
              input.last4,
              input.expiryMonth,
              input.expiryYear,
              input.funding,
              input.fingerprint,
              shouldBeDefault,
              paymentMethodId,
            ],
          );
        } else {
          await client.query(
            `
              INSERT INTO payment_methods (
                id,
                user_id,
                provider,
                type,
                provider_customer_id,
                provider_method_id,
                holder_name,
                brand,
                last4,
                expiry_month,
                expiry_year,
                funding,
                fingerprint,
                is_default,
                status
              )
              VALUES (
                $1, $2, $3, 'card', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active'
              )
            `,
            [
              paymentMethodId,
              String(userId),
              input.provider,
              input.providerCustomerId,
              input.providerMethodId,
              input.holderName,
              input.brand,
              input.last4,
              input.expiryMonth,
              input.expiryYear,
              input.funding,
              input.fingerprint,
              shouldBeDefault,
            ],
          );
        }

        return this.findPaymentMethodByIdForUser(userId, paymentMethodId);
      });
    },
    async setDefaultPaymentMethodForUser(userId, paymentMethodId) {
      return withTransaction(async (client) => {
        const target = (
          await client.query(
            `
              SELECT id
              FROM payment_methods
              WHERE user_id = $1
                AND id = $2
                AND status = 'active'
              LIMIT 1
            `,
            [String(userId), paymentMethodId],
          )
        ).rows[0];

        if (!target) return null;

        await client.query(
          `
            UPDATE payment_methods
            SET is_default = FALSE, updated_at = NOW()
            WHERE user_id = $1
          `,
          [String(userId)],
        );

        await client.query(
          `
            UPDATE payment_methods
            SET is_default = TRUE, updated_at = NOW()
            WHERE user_id = $1
              AND id = $2
          `,
          [String(userId), paymentMethodId],
        );

        return this.findPaymentMethodByIdForUser(userId, paymentMethodId);
      });
    },
    async removePaymentMethodForUser(userId, paymentMethodId) {
      return withTransaction(async (client) => {
        const target = (
          await client.query(
            `
              SELECT id, is_default
              FROM payment_methods
              WHERE user_id = $1
                AND id = $2
                AND status <> 'revoked'
              LIMIT 1
            `,
            [String(userId), paymentMethodId],
          )
        ).rows[0];

        if (!target) return false;

        await client.query(
          `
            UPDATE payment_methods
            SET status = 'revoked', is_default = FALSE, updated_at = NOW()
            WHERE user_id = $1
              AND id = $2
          `,
          [String(userId), paymentMethodId],
        );

        if (normalizeBool(target.is_default)) {
          const fallback = (
            await client.query(
              `
                SELECT id
                FROM payment_methods
                WHERE user_id = $1
                  AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
              `,
              [String(userId)],
            )
          ).rows[0];

          if (fallback?.id) {
            await client.query(
              `
                UPDATE payment_methods
                SET is_default = TRUE, updated_at = NOW()
                WHERE user_id = $1
                  AND id = $2
              `,
              [String(userId), fallback.id],
            );
          }
        }

        return true;
      });
    },
    async updateUserEmail(userId, email) {
      const result = await pool.query(
        `
          UPDATE users
          SET email = $1, email_verified = FALSE, updated_at = NOW()
          WHERE id = $2
          RETURNING id, username, email, role, email_verified
        `,
        [email, userId],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async updateUserPassword(userId, passwordHash) {
      await pool.query(
        `
          UPDATE users
          SET password_hash = $1, updated_at = NOW()
          WHERE id = $2
        `,
        [passwordHash, userId],
      );
    },
    async getAdminAccount() {
      const result = await pool.query(
        `
          SELECT id, username, email, phone, password_hash
          FROM admin_account
          WHERE id = 1
          LIMIT 1
        `,
      );

      return normalizeAdminRow(result.rows[0]);
    },
    async findAdminByIdentifier(identifier) {
      const result = await pool.query(
        `
          SELECT id, username, email, phone, password_hash
          FROM admin_account
          WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [identifier],
      );

      return normalizeAdminRow(result.rows[0]);
    },
    async findAdminByEmail(email) {
      const result = await pool.query(
        `
          SELECT id, username, email, phone, password_hash
          FROM admin_account
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [email],
      );

      return normalizeAdminRow(result.rows[0]);
    },
    async isAdminEmail(email) {
      const result = await pool.query(
        `
          SELECT id
          FROM admin_account
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [email],
      );

      return result.rowCount > 0;
    },
    async updateAdminContact(email, phone) {
      const result = await pool.query(
        `
          UPDATE admin_account
          SET email = $1, phone = $2, updated_at = NOW()
          WHERE id = 1
          RETURNING id, username, email, phone, password_hash
        `,
        [email, phone],
      );

      return normalizeAdminRow(result.rows[0]);
    },
    async updateAdminPassword(passwordHash) {
      await pool.query(
        `
          UPDATE admin_account
          SET password_hash = $1, updated_at = NOW()
          WHERE id = 1
        `,
        [passwordHash],
      );
    },
    async createSession({
      id,
      userType,
      userId,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    }) {
      const result = await pool.query(
        `
          INSERT INTO auth_sessions (
            id,
            user_type,
            user_id,
            refresh_token_hash,
            user_agent,
            ip_address,
            expires_at,
            revoked_at,
            last_used_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NOW())
          RETURNING
            id,
            user_type,
            user_id,
            refresh_token_hash,
            user_agent,
            ip_address,
            expires_at,
            revoked_at,
            last_used_at,
            created_at
        `,
        [
          id,
          userType,
          userId,
          refreshTokenHash,
          userAgent ?? "",
          ipAddress ?? "",
          expiresAt,
        ],
      );

      return normalizeSessionRow(result.rows[0]);
    },
    async getSessionById(sessionId) {
      const result = await pool.query(
        `
          SELECT
            id,
            user_type,
            user_id,
            refresh_token_hash,
            user_agent,
            ip_address,
            expires_at,
            revoked_at,
            last_used_at,
            created_at
          FROM auth_sessions
          WHERE id = $1
          LIMIT 1
        `,
        [sessionId],
      );

      return normalizeSessionRow(result.rows[0]);
    },
    async rotateSessionRefreshToken(sessionId, refreshTokenHash, expiresAt) {
      const result = await pool.query(
        `
          UPDATE auth_sessions
          SET
            refresh_token_hash = $1,
            expires_at = $2,
            last_used_at = NOW(),
            revoked_at = NULL
          WHERE id = $3
          RETURNING
            id,
            user_type,
            user_id,
            refresh_token_hash,
            user_agent,
            ip_address,
            expires_at,
            revoked_at,
            last_used_at,
            created_at
        `,
        [refreshTokenHash, expiresAt, sessionId],
      );

      return normalizeSessionRow(result.rows[0]);
    },
    async touchSession(sessionId) {
      await pool.query(
        `
          UPDATE auth_sessions
          SET last_used_at = NOW()
          WHERE id = $1
        `,
        [sessionId],
      );
    },
    async revokeSession(sessionId) {
      await pool.query(
        `
          UPDATE auth_sessions
          SET revoked_at = COALESCE(revoked_at, NOW())
          WHERE id = $1
        `,
        [sessionId],
      );
    },
    async revokeUserSessions(userType, userId, excludeSessionId = null) {
      await pool.query(
        `
          UPDATE auth_sessions
          SET revoked_at = COALESCE(revoked_at, NOW())
          WHERE user_type = $1
            AND user_id = $2
            AND ($3::TEXT IS NULL OR id <> $3)
        `,
        [userType, userId, excludeSessionId],
      );
    },
    async getThrottle(scope, throttleKey) {
      const result = await pool.query(
        `
          SELECT
            scope,
            throttle_key,
            attempt_count,
            first_attempt_at,
            last_attempt_at,
            locked_until
          FROM auth_throttles
          WHERE scope = $1 AND throttle_key = $2
          LIMIT 1
        `,
        [scope, throttleKey],
      );

      return result.rows[0] ?? null;
    },
    async upsertThrottle(record) {
      await pool.query(
        `
          INSERT INTO auth_throttles (
            scope,
            throttle_key,
            attempt_count,
            first_attempt_at,
            last_attempt_at,
            locked_until
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (scope, throttle_key) DO UPDATE SET
            attempt_count = EXCLUDED.attempt_count,
            first_attempt_at = EXCLUDED.first_attempt_at,
            last_attempt_at = EXCLUDED.last_attempt_at,
            locked_until = EXCLUDED.locked_until
        `,
        [
          record.scope,
          record.throttleKey,
          record.attemptCount,
          record.firstAttemptAt,
          record.lastAttemptAt,
          record.lockedUntil,
        ],
      );
    },
    async clearThrottle(scope, throttleKey) {
      await pool.query(
        `
          DELETE FROM auth_throttles
          WHERE scope = $1 AND throttle_key = $2
        `,
        [scope, throttleKey],
      );
    },
    async createPasswordResetToken({
      userType,
      userId,
      tokenHash,
      expiresAt,
    }) {
      await pool.query(
        `
          INSERT INTO password_reset_tokens (
            user_type,
            user_id,
            token_hash,
            expires_at
          )
          VALUES ($1, $2, $3, $4)
        `,
        [userType, userId, tokenHash, expiresAt],
      );
    },
    async findPasswordResetToken(tokenHash) {
      const result = await pool.query(
        `
          SELECT id, user_type, user_id, token_hash, expires_at, used_at, created_at
          FROM password_reset_tokens
          WHERE token_hash = $1
          LIMIT 1
        `,
        [tokenHash],
      );

      return result.rows[0] ?? null;
    },
    async markPasswordResetUsed(id) {
      await pool.query(
        `
          UPDATE password_reset_tokens
          SET used_at = NOW()
          WHERE id = $1
        `,
        [id],
      );
    },
    async clearPasswordResetTokensForUser(userType, userId) {
      await pool.query(
        `
          DELETE FROM password_reset_tokens
          WHERE user_type = $1 AND user_id = $2
        `,
        [userType, userId],
      );
    },
    async createEmailVerificationToken({
      userType,
      userId,
      email,
      purpose = "registration",
      tokenHash,
      expiresAt,
    }) {
      await pool.query(
        `
          INSERT INTO email_verification_tokens (
            user_type,
            user_id,
            email,
            purpose,
            token_hash,
            expires_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [userType, userId, email, purpose, tokenHash, expiresAt],
      );
    },
    async findEmailVerificationToken(tokenHash) {
      const result = await pool.query(
        `
          SELECT
            id,
            user_type,
            user_id,
            email,
            purpose,
            token_hash,
            expires_at,
            used_at,
            created_at
          FROM email_verification_tokens
          WHERE token_hash = $1
          LIMIT 1
        `,
        [tokenHash],
      );

      return result.rows[0] ?? null;
    },
    async markEmailVerificationUsed(id) {
      await pool.query(
        `
          UPDATE email_verification_tokens
          SET used_at = NOW()
          WHERE id = $1
        `,
        [id],
      );
    },
    async clearEmailVerificationTokensForUser(
      userType,
      userId,
      purpose = null,
    ) {
      await pool.query(
        `
          DELETE FROM email_verification_tokens
          WHERE user_type = $1
            AND user_id = $2
            AND ($3::TEXT IS NULL OR purpose = $3)
        `,
        [userType, userId, purpose],
      );
    },
    async markUserEmailVerified(userId) {
      const result = await pool.query(
        `
          UPDATE users
          SET email_verified = TRUE, updated_at = NOW()
          WHERE id = $1
          RETURNING id, username, email, role, email_verified
        `,
        [userId],
      );

      return normalizeUserRow(result.rows[0]);
    },
    async createLegalAcceptance({
      userType,
      userId,
      documentKey,
      documentVersion,
      ipAddress,
      userAgent,
      acceptedAt = null,
    }) {
      await pool.query(
        `
          INSERT INTO legal_acceptances (
            user_type,
            user_id,
            document_key,
            document_version,
            ip_address,
            user_agent,
            accepted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::TIMESTAMPTZ, NOW()))
        `,
        [
          userType,
          userId,
          documentKey,
          documentVersion,
          ipAddress ?? "",
          userAgent ?? "",
          acceptedAt,
        ],
      );
    },
    async listCoupons({ activeOnly = false } = {}) {
      return withClient(async (client) =>
        (await listCouponRows(client, { activeOnly })).map(normalizeCouponRow),
      );
    },
    async findCouponById(couponId) {
      return withClient(async (client) =>
        normalizeCouponRow(await getCouponRowById(client, couponId)),
      );
    },
    async findCouponByCode(code, { activeOnly = false } = {}) {
      return withClient(async (client) =>
        normalizeCouponRow(
          await getCouponRowByCode(client, code, activeOnly),
        ),
      );
    },
    async createCoupon(couponInput) {
      const id = couponInput.id || createCouponId();
      const result = await pool.query(
        `
          INSERT INTO coupons (
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active,
            created_at,
            updated_at
        `,
        [
          id,
          normalizeCouponCode(couponInput.code),
          couponInput.label,
          couponInput.description,
          couponInput.type,
          couponInput.percent ?? null,
          couponInput.amount ?? null,
          couponInput.minSubtotal ?? 0,
          couponInput.maxDiscount ?? null,
          JSON.stringify(couponInput.appliesToShippingMethods ?? []),
          couponInput.active !== false,
        ],
      );

      return normalizeCouponRow(result.rows[0]);
    },
    async updateCoupon(couponId, patch) {
      const result = await pool.query(
        `
          UPDATE coupons
          SET
            code = $1,
            label = $2,
            description = $3,
            type = $4,
            percent = $5,
            amount = $6,
            min_subtotal = $7,
            max_discount = $8,
            applies_to_shipping_methods = $9,
            active = $10,
            updated_at = NOW()
          WHERE id = $11
          RETURNING
            id,
            code,
            label,
            description,
            type,
            percent,
            amount,
            min_subtotal,
            max_discount,
            applies_to_shipping_methods,
            active,
            created_at,
            updated_at
        `,
        [
          normalizeCouponCode(patch.code),
          patch.label,
          patch.description,
          patch.type,
          patch.percent ?? null,
          patch.amount ?? null,
          patch.minSubtotal ?? 0,
          patch.maxDiscount ?? null,
          JSON.stringify(patch.appliesToShippingMethods ?? []),
          patch.active !== false,
          couponId,
        ],
      );

      return normalizeCouponRow(result.rows[0]);
    },
    async deactivateCoupon(couponId) {
      await pool.query(
        `
          UPDATE coupons
          SET active = FALSE, updated_at = NOW()
          WHERE id = $1
        `,
        [couponId],
      );
    },
    async listProducts({ includeInactive = false } = {}) {
      return withClient(async (client) => {
        const now = nowIso();
        const result = await client.query(
          `
            SELECT
              id,
              name,
              price,
              category,
              image,
              description,
              is_new,
              stock_quantity,
              active
            FROM products
            ${includeInactive ? "" : "WHERE active = TRUE"}
            ORDER BY created_at DESC, id DESC
          `,
        );

        const products = [];
        for (const row of result.rows) {
          products.push(
            normalizeProductRow(
              row,
              await getReservedQuantityForProduct(client, row.id, now),
            ),
          );
        }

        return products;
      });
    },
    async findProductById(productId, { includeInactive = false } = {}) {
      return withClient(async (client) => {
        const row = await getProductRow(client, productId, includeInactive);
        if (!row) return null;

        return normalizeProductRow(
          row,
          await getReservedQuantityForProduct(client, productId, nowIso()),
        );
      });
    },
    async createProduct(productInput) {
      const id = productInput.id || createProductId();
      const result = await pool.query(
        `
          INSERT INTO products (
            id,
            name,
            price,
            category,
            image,
            description,
            is_new,
            stock_quantity,
            active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
          RETURNING
            id,
            name,
            price,
            category,
            image,
            description,
            is_new,
            stock_quantity,
            active
        `,
        [
          id,
          productInput.name,
          productInput.price,
          productInput.category,
          productInput.image,
          productInput.description,
          productInput.isNew ?? false,
          productInput.stockQuantity,
        ],
      );

      return normalizeProductRow(result.rows[0], 0);
    },
    async updateProduct(productId, patch) {
      const result = await pool.query(
        `
          UPDATE products
          SET
            name = $1,
            price = $2,
            category = $3,
            image = $4,
            description = $5,
            is_new = $6,
            stock_quantity = $7,
            active = $8,
            updated_at = NOW()
          WHERE id = $9
          RETURNING
            id,
            name,
            price,
            category,
            image,
            description,
            is_new,
            stock_quantity,
            active
        `,
        [
          patch.name,
          patch.price,
          patch.category,
          patch.image,
          patch.description,
          patch.isNew ?? false,
          patch.stockQuantity,
          patch.active !== false,
          productId,
        ],
      );

      if (!result.rows[0]) return null;

      return normalizeProductRow(
        result.rows[0],
        await withClient((client) =>
          getReservedQuantityForProduct(client, productId, nowIso()),
        ),
      );
    },
    async deactivateProduct(productId) {
      await pool.query(
        `
          UPDATE products
          SET active = FALSE, updated_at = NOW()
          WHERE id = $1
        `,
        [productId],
      );
    },
    async getCart(userType, userId) {
      return withClient((client) => getCart(client, userType, userId));
    },
    async saveCart(userType, userId, items, reservationMinutes) {
      return withTransaction(async (client) => {
        const cart = await getOrCreateActiveCart(client, userType, userId);
        const reservationUntil = addMinutes(nowIso(), reservationMinutes);
        const nextIds = items.map((item) => item.productId);

        for (const item of items) {
          const product = await getProductRow(client, item.productId, false);
          if (!product) {
            const error = new Error("A termek nem elerheto.");
            error.code = "PRODUCT_NOT_FOUND";
            error.productId = item.productId;
            throw error;
          }

          const otherReserved = await getReservedQuantityForProduct(
            client,
            item.productId,
            nowIso(),
            cart.id,
          );

          if (item.quantity > Number(product.stock_quantity) - otherReserved) {
            const error = new Error("Nincs eleg keszlet a termekhez.");
            error.code = "INSUFFICIENT_STOCK";
            error.productId = item.productId;
            error.availableQuantity = Math.max(
              Number(product.stock_quantity) - otherReserved,
              0,
            );
            throw error;
          }
        }

        await client.query(
          `
            DELETE FROM cart_items
            WHERE cart_id = $1
              AND NOT (product_id = ANY($2::TEXT[]))
          `,
          [cart.id, nextIds.length > 0 ? nextIds : ["__empty__"]],
        );

        for (const item of items) {
          await client.query(
            `
              INSERT INTO cart_items (
                cart_id,
                product_id,
                quantity,
                reserved_until
              )
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (cart_id, product_id) DO UPDATE SET
                quantity = EXCLUDED.quantity,
                reserved_until = EXCLUDED.reserved_until,
                updated_at = NOW()
            `,
            [cart.id, item.productId, item.quantity, reservationUntil],
          );
        }

        await client.query(
          `
            UPDATE carts
            SET updated_at = NOW()
            WHERE id = $1
          `,
          [cart.id],
        );

        return getCart(client, userType, userId);
      });
    },
    async clearCart(userType, userId) {
      return withTransaction(async (client) => {
        const cart = await getOrCreateActiveCart(client, userType, userId);
        await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);
        await client.query(
          `
            UPDATE carts
            SET updated_at = NOW()
            WHERE id = $1
          `,
          [cart.id],
        );

        return getCart(client, userType, userId);
      });
    },
    async createOrderFromCart(userType, userId, orderInput) {
      return withTransaction(async (client) => {
        const cart = await getOrCreateActiveCart(client, userType, userId);
        const cartRows = (
          await client.query(
            `
              SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.category,
                p.image,
                p.stock_quantity,
                p.active
              FROM cart_items ci
              JOIN products p ON p.id = ci.product_id
              WHERE ci.cart_id = $1
              ORDER BY ci.id ASC
            `,
            [cart.id],
          )
        ).rows;

        if (cartRows.length === 0) {
          const error = new Error("A kosar ures.");
          error.code = "EMPTY_CART";
          throw error;
        }

        const now = nowIso();
        for (const row of cartRows) {
          if (!normalizeBool(row.active)) {
            const error = new Error("Van mar nem elerheto termek a kosarban.");
            error.code = "PRODUCT_NOT_FOUND";
            error.productId = row.product_id;
            throw error;
          }

          const otherReserved = await getReservedQuantityForProduct(
            client,
            row.product_id,
            now,
            cart.id,
          );
          const available = Number(row.stock_quantity) - otherReserved;

          if (available < Number(row.quantity)) {
            const error = new Error("Nincs eleg keszlet az egyik termekhez.");
            error.code = "INSUFFICIENT_STOCK";
            error.productId = row.product_id;
            error.availableQuantity = Math.max(available, 0);
            throw error;
          }
        }

        const subtotal = cartRows.reduce(
          (sum, row) => sum + Number(row.price) * Number(row.quantity),
          0,
        );
        const coupons = (await listCouponRows(client, { activeOnly: true })).map(
          normalizeCouponRow,
        );
        const {
          shippingMethod,
          shippingPrice,
          discountCode,
          discountAmount,
          total,
        } = buildOrderPricing({
          subtotal,
          shippingMethodId: orderInput.shippingMethod,
          couponCode: orderInput.couponCode,
          coupons,
        });
        const orderId = createOrderId();

        await client.query(
          `
            INSERT INTO orders (
              id,
              user_type,
              user_id,
              contact_email,
              contact_phone,
              payment_method,
              shipping_method,
              status,
              discount_code,
              discount_amount,
              subtotal,
              shipping_price,
              total,
              shipping_full_name,
              shipping_line1,
              shipping_line2,
              shipping_city,
              shipping_zip,
              shipping_country,
              billing_full_name,
              billing_line1,
              billing_line2,
              billing_city,
              billing_zip,
              billing_country,
              inventory_released
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17,
              $18, $19, $20, $21, $22, $23, $24,
              FALSE
            )
          `,
          [
            orderId,
            userType,
            userId,
            orderInput.contactEmail,
            orderInput.contactPhone,
            orderInput.paymentMethod,
            shippingMethod.id,
            discountCode,
            discountAmount,
            subtotal,
            shippingPrice,
            total,
            orderInput.shipping.fullName,
            orderInput.shipping.line1,
            orderInput.shipping.line2,
            orderInput.shipping.city,
            orderInput.shipping.zip,
            orderInput.shipping.country,
            orderInput.billing.fullName,
            orderInput.billing.line1,
            orderInput.billing.line2,
            orderInput.billing.city,
            orderInput.billing.zip,
            orderInput.billing.country,
          ],
        );

        for (const row of cartRows) {
          await client.query(
            `
              INSERT INTO order_items (
                order_id,
                product_id,
                product_name,
                product_image,
                product_category,
                unit_price,
                quantity
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              orderId,
              row.product_id,
              row.name,
              row.image,
              row.category,
              Number(row.price),
              Number(row.quantity),
            ],
          );

          await client.query(
            `
              UPDATE products
              SET stock_quantity = stock_quantity - $1, updated_at = NOW()
              WHERE id = $2
            `,
            [Number(row.quantity), row.product_id],
          );
        }

        await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);
        await client.query(
          `
            UPDATE carts
            SET updated_at = NOW()
            WHERE id = $1
          `,
          [cart.id],
        );

        return getOrderById(client, orderId);
      });
    },
    async listOrdersForUser(userType, userId) {
      return withClient((client) =>
        listOrders(
          client,
          `
            SELECT id
            FROM orders
            WHERE user_type = $1 AND user_id = $2
            ORDER BY created_at DESC, id DESC
          `,
          [userType, userId],
        ),
      );
    },
    async listAllOrders() {
      return withClient((client) =>
        listOrders(
          client,
          `
            SELECT id
            FROM orders
            ORDER BY created_at DESC, id DESC
          `,
          [],
        ),
      );
    },
    async getOrderById(orderId) {
      return withClient((client) => synchronizeOrderLifecycle(client, orderId));
    },
    async recordOrderFulfillmentEvent(orderId, payload = {}) {
      return withTransaction(async (client) => {
        const current = await getOrderById(client, orderId);
        if (!current) {
          return null;
        }

        const event = String(payload?.event ?? "").trim();
        if (!FULFILLMENT_EVENTS.has(event)) {
          throw createDbError(
            "INVALID_FULFILLMENT_EVENT",
            "Ervenytelen fulfillment esemeny.",
          );
        }

        const occurredAt = normalizeLifecycleTimestamp(payload?.occurredAt);
        const trackingNumber = normalizeTrackingNumber(payload?.trackingNumber);
        const next = applyFulfillmentEvent(
          current,
          event,
          occurredAt,
          trackingNumber,
        );

        if (event === "cancelled" && !current.inventoryReleased) {
          for (const item of current.items) {
            if (item.productId) {
              await client.query(
                `
                  UPDATE products
                  SET stock_quantity = stock_quantity + $1, updated_at = NOW()
                  WHERE id = $2
                `,
                [item.quantity, item.productId],
              );
            }
          }
        }

        await client.query(
          `
            UPDATE orders
            SET
              status = $1,
              tracking_number = $2,
              confirmed_at = $3,
              processing_started_at = $4,
              shipped_at = $5,
              delivered_at = $6,
              inventory_released = $7,
              updated_at = NOW()
            WHERE id = $8
          `,
          [
            next.status,
            next.trackingNumber,
            next.confirmedAt,
            next.processingStartedAt,
            next.shippedAt,
            next.deliveredAt,
            next.inventoryReleased,
            orderId,
          ],
        );

        return getOrderById(client, orderId);
      });
    },
  };
}

async function initDatabase() {
  if (adapter) {
    return adapter;
  }

  if (config.databaseUrl) {
    try {
      const pgAdapter = createPostgresAdapter();
      await pgAdapter.init();
      adapter = pgAdapter;
      return adapter;
    } catch (error) {
      if (config.nodeEnv === "production") {
        throw error;
      }

      console.warn(
        "A PostgreSQL kapcsolat nem sikerult, SQLite fallback indul fejlesztoi modban.",
        error.message,
      );
    }
  }

  const sqliteAdapter = createSqliteAdapter();
  await sqliteAdapter.init();
  adapter = sqliteAdapter;
  return adapter;
}

function getAdapter() {
  if (!adapter) {
    throw new Error("Az adatbazis meg nincs inicializalva.");
  }

  return adapter;
}

module.exports = {
  initDatabase,
  getDatabaseDriver: () => (adapter ? adapter.name : null),
  addDays,
  addMinutes,
  nowIso,
  findUserByIdentifier: (...args) => getAdapter().findUserByIdentifier(...args),
  findUserById: (...args) => getAdapter().findUserById(...args),
  findUserWithPasswordById: (...args) =>
    getAdapter().findUserWithPasswordById(...args),
  findUserByUsernameOrEmail: (...args) =>
    getAdapter().findUserByUsernameOrEmail(...args),
  findUserByEmail: (...args) => getAdapter().findUserByEmail(...args),
  emailExistsForOtherUser: (...args) =>
    getAdapter().emailExistsForOtherUser(...args),
  createUser: (...args) => getAdapter().createUser(...args),
  getUserProfile: (...args) => getAdapter().getUserProfile(...args),
  updateUserProfile: (...args) => getAdapter().updateUserProfile(...args),
  listPaymentMethodsForUser: (...args) =>
    getAdapter().listPaymentMethodsForUser(...args),
  findPaymentMethodByIdForUser: (...args) =>
    getAdapter().findPaymentMethodByIdForUser(...args),
  createPaymentMethodForUser: (...args) =>
    getAdapter().createPaymentMethodForUser(...args),
  setDefaultPaymentMethodForUser: (...args) =>
    getAdapter().setDefaultPaymentMethodForUser(...args),
  removePaymentMethodForUser: (...args) =>
    getAdapter().removePaymentMethodForUser(...args),
  updateUserEmail: (...args) => getAdapter().updateUserEmail(...args),
  updateUserPassword: (...args) => getAdapter().updateUserPassword(...args),
  getAdminAccount: (...args) => getAdapter().getAdminAccount(...args),
  findAdminByIdentifier: (...args) =>
    getAdapter().findAdminByIdentifier(...args),
  findAdminByEmail: (...args) => getAdapter().findAdminByEmail(...args),
  isAdminEmail: (...args) => getAdapter().isAdminEmail(...args),
  updateAdminContact: (...args) => getAdapter().updateAdminContact(...args),
  updateAdminPassword: (...args) => getAdapter().updateAdminPassword(...args),
  createSession: (...args) => getAdapter().createSession(...args),
  getSessionById: (...args) => getAdapter().getSessionById(...args),
  rotateSessionRefreshToken: (...args) =>
    getAdapter().rotateSessionRefreshToken(...args),
  touchSession: (...args) => getAdapter().touchSession(...args),
  revokeSession: (...args) => getAdapter().revokeSession(...args),
  revokeUserSessions: (...args) => getAdapter().revokeUserSessions(...args),
  getThrottle: (...args) => getAdapter().getThrottle(...args),
  upsertThrottle: (...args) => getAdapter().upsertThrottle(...args),
  clearThrottle: (...args) => getAdapter().clearThrottle(...args),
  createPasswordResetToken: (...args) =>
    getAdapter().createPasswordResetToken(...args),
  findPasswordResetToken: (...args) =>
    getAdapter().findPasswordResetToken(...args),
  markPasswordResetUsed: (...args) => getAdapter().markPasswordResetUsed(...args),
  clearPasswordResetTokensForUser: (...args) =>
    getAdapter().clearPasswordResetTokensForUser(...args),
  createEmailVerificationToken: (...args) =>
    getAdapter().createEmailVerificationToken(...args),
  findEmailVerificationToken: (...args) =>
    getAdapter().findEmailVerificationToken(...args),
  markEmailVerificationUsed: (...args) =>
    getAdapter().markEmailVerificationUsed(...args),
  clearEmailVerificationTokensForUser: (...args) =>
    getAdapter().clearEmailVerificationTokensForUser(...args),
  markUserEmailVerified: (...args) =>
    getAdapter().markUserEmailVerified(...args),
  createLegalAcceptance: (...args) =>
    getAdapter().createLegalAcceptance(...args),
  listCoupons: (...args) => getAdapter().listCoupons(...args),
  findCouponById: (...args) => getAdapter().findCouponById(...args),
  findCouponByCode: (...args) => getAdapter().findCouponByCode(...args),
  createCoupon: (...args) => getAdapter().createCoupon(...args),
  updateCoupon: (...args) => getAdapter().updateCoupon(...args),
  deactivateCoupon: (...args) => getAdapter().deactivateCoupon(...args),
  listProducts: (...args) => getAdapter().listProducts(...args),
  findProductById: (...args) => getAdapter().findProductById(...args),
  createProduct: (...args) => getAdapter().createProduct(...args),
  updateProduct: (...args) => getAdapter().updateProduct(...args),
  deactivateProduct: (...args) => getAdapter().deactivateProduct(...args),
  getCart: (...args) => getAdapter().getCart(...args),
  saveCart: (...args) => getAdapter().saveCart(...args),
  clearCart: (...args) => getAdapter().clearCart(...args),
  createOrderFromCart: (...args) => getAdapter().createOrderFromCart(...args),
  listOrdersForUser: (...args) => getAdapter().listOrdersForUser(...args),
  listAllOrders: (...args) => getAdapter().listAllOrders(...args),
  getOrderById: (...args) => getAdapter().getOrderById(...args),
  recordOrderFulfillmentEvent: (...args) =>
    getAdapter().recordOrderFulfillmentEvent(...args),
};
