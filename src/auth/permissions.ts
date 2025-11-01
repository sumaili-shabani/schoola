// Map/constantes à aligner avec ta table `users.id_role`
export const ROLES = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    COMPTABLE: 3,
    CAISSIER: 4,
    SECRETAIRE: 5,
    ENSEIGNANT: 6,
    AUDITEUR: 7,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const hasRole = (id_role?: number | null, allowed?: RoleId[] | null) => {
    if (!allowed || allowed.length === 0) return true; // pas de restriction
    if (!id_role) return false;
    return allowed.includes(id_role as RoleId);
};
