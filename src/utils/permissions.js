export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    PRODUCT_MANAGER: 'product_manager',
    ORDER_MANAGER: 'order_manager',
    SUPPORT: 'support',
    FINANCE: 'finance',
    USER: 'user'
}

const ROLE_ALIASES = {
    admin: ROLES.SUPER_ADMIN,
}

export const normalizeRole = (role) => {
    if (!role) return role
    return ROLE_ALIASES[role] || role
}

export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: [ROLES.SUPER_ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ORDER_MANAGER, ROLES.SUPPORT, ROLES.FINANCE],
    VIEW_REVENUE_STATS: [ROLES.SUPER_ADMIN, ROLES.FINANCE],

    // Products
    VIEW_PRODUCTS: [ROLES.SUPER_ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ORDER_MANAGER, ROLES.SUPPORT],
    MANAGE_PRODUCTS: [ROLES.SUPER_ADMIN, ROLES.PRODUCT_MANAGER],
    APPROVE_PRODUCTS: [ROLES.SUPER_ADMIN, ROLES.PRODUCT_MANAGER],

    // Orders
    VIEW_ORDERS: [ROLES.SUPER_ADMIN, ROLES.ORDER_MANAGER, ROLES.SUPPORT, ROLES.PRODUCT_MANAGER],
    MANAGE_ORDERS: [ROLES.SUPER_ADMIN, ROLES.ORDER_MANAGER],
    PROCESS_REFUNDS: [ROLES.SUPER_ADMIN, ROLES.ORDER_MANAGER, ROLES.FINANCE],

    // Users
    VIEW_USERS: [ROLES.SUPER_ADMIN, ROLES.SUPPORT, ROLES.ORDER_MANAGER],
    MANAGE_USERS: [ROLES.SUPER_ADMIN],

    // Reviews
    VIEW_REVIEWS: [ROLES.SUPER_ADMIN, ROLES.SUPPORT, ROLES.PRODUCT_MANAGER],
    MANAGE_REVIEWS: [ROLES.SUPER_ADMIN, ROLES.SUPPORT],

    // Sellers
    VIEW_SELLERS: [ROLES.SUPER_ADMIN, ROLES.PRODUCT_MANAGER],
    MANAGE_SELLERS: [ROLES.SUPER_ADMIN, ROLES.PRODUCT_MANAGER],

    // Settings
    VIEW_SETTINGS: [ROLES.SUPER_ADMIN],
    MANAGE_SETTINGS: [ROLES.SUPER_ADMIN],

    // Finance
    VIEW_REPORTS: [ROLES.SUPER_ADMIN, ROLES.FINANCE],
}

/**
 * Check if a role has specific permission
 * @param {string} role - The user role
 * @param {Array} allowedRoles - List of roles that have permission
 * @returns {boolean}
 */
export const hasPermission = (userRole, allowedRoles) => {
    const normalizedUserRole = normalizeRole(userRole)
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole)

    if (!normalizedUserRole) return false
    if (normalizedUserRole === ROLES.SUPER_ADMIN) return true
    return normalizedAllowedRoles.includes(normalizedUserRole)
}
