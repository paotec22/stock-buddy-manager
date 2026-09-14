/**
 * Role-Based Access Control and Super Admin configuration
 */

export const SUPER_ADMIN_IDENTIFIERS = [
  "paotec22@gmail.com",
  "paotec22",
];

/**
 * Checks if a given user (by email or database role) is designated as Super Admin.
 * paotec22 / paotec22@gmail.com is granted permanent Super Admin authority.
 */
export function isSuperAdminUser(email?: string | null, role?: string | null): boolean {
  if (role === "super_admin") return true;
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return (
    normalizedEmail === "paotec22@gmail.com" ||
    normalizedEmail.startsWith("paotec22@") ||
    normalizedEmail.includes("paotec22")
  );
}

/**
 * Checks if a user has administrative capabilities (either Super Admin or Admin).
 */
export function isAdminUser(email?: string | null, role?: string | null): boolean {
  return isSuperAdminUser(email, role) || role === "admin";
}

/**
 * Destructive authority: ONLY the Super Admin can delete or reset the database.
 */
export function canDeleteDatabase(email?: string | null, role?: string | null): boolean {
  return isSuperAdminUser(email, role);
}

/**
 * Destructive authority: ONLY the Super Admin can delete user accounts.
 */
export function canDeleteUser(email?: string | null, role?: string | null): boolean {
  return isSuperAdminUser(email, role);
}

/**
 * Returns formatted role display text.
 */
export function getRoleLabel(email?: string | null, role?: string | null): string {
  if (isSuperAdminUser(email, role)) return "Super Admin";
  switch (role) {
    case "admin":
      return "Admin";
    case "inventory_manager":
      return "Inventory Manager";
    case "uploader":
      return "Uploader";
    default:
      return "User";
  }
}
