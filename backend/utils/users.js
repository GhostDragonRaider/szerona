function buildBilling(profile) {
  return {
    fullName: profile?.billing_full_name ?? "",
    line1: profile?.billing_line1 ?? "",
    line2: profile?.billing_line2 ?? "",
    city: profile?.billing_city ?? "",
    zip: profile?.billing_zip ?? "",
    country: profile?.billing_country ?? "Magyarorszag",
  };
}

function buildApiUser(userRow, profile) {
  return {
    id: String(userRow.id),
    username: userRow.username,
    email: userRow.email,
    role: userRow.role,
    displayName:
      profile?.display_name?.trim() || userRow.username,
    billing: buildBilling(profile),
    emailVerified: Boolean(userRow.email_verified),
  };
}

function buildAdminUser(adminAccount) {
  return {
    id: "admin",
    username: "admin",
    email: adminAccount.email,
    role: "admin",
    phone: adminAccount.phone ?? "",
    displayName: "admin",
    billing: {
      fullName: "",
      line1: "",
      line2: "",
      city: "",
      zip: "",
      country: "Magyarorszag",
    },
    emailVerified: true,
  };
}

module.exports = {
  buildAdminUser,
  buildApiUser,
  buildBilling,
};
