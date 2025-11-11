import { ROLES, RoleId } from "../auth/permissions";
import { MenuItem } from "./menu"; // importer ton type

export const MENU_COMPTABLE: MenuItem[] = [
    {
        label: "Tableau de bord",
        icon: "activity",
        to: "/",
        roles: [ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER],
    },

    {
        label: "Trésorerie & Finances",
        icon: "credit-card",
        children: [
            { label: "Paiements élèves", to: "/compta/paiements" },
            { label: "Recettes", to: "/tresorerie/recettes" },
            { label: "Dépenses", to: "/tresorerie/depenses" },
            { label: "Caisse du jour", to: "/tresorerie/caisse-jour" },
            { label: "Comptabilité du jour", to: "/tresorerie/comptabilite-jour" },
        ],
    },

    {
        label: "Ventes & Stock",
        icon: "shopping-bag",
        children: [
            { label: "Ventes", to: "/stock/ventes" },
            { label: "Approvisionnements", to: "/stock/approvisionnements" },
            { label: "Produits", to: "/stock/produits" },
            { label: "Fournisseurs", to: "/stock/fournisseurs" },
        ],
    },

    {
        label: "OHADA & Comptabilité",
        icon: "file-text",
        children: [
            { label: "Classes", to: "/ohada/classes" },
            { label: "Comptes", to: "/ohada/comptes" },
            { label: "Sous Comptes", to: "/ohada/sous-comptes" },
            { label: "Type Opération", to: "/ohada/type-operation" },
            { label: "Type Compte", to: "/ohada/type-compte" },
            { label: "Mode de Paiement", to: "/ohada/mode-paiement" },
            { label: "Caisse & Banque", to: "/ohada/caisse-banque" },
            { label: "Rubriques", to: "/ohada/rubriques" },
            { label: "Catégories Rubriques", to: "/ohada/cat-rubriques" },
        ],
    },

    {
        label: "Rapports",
        icon: "bar-chart-2",
        children: [
            { label: "Rapports financiers", to: "/rapport/finances" },
            { label: "Rapport trésorerie", to: "/rapport/tresorerie" },
            { label: "Rapport de stock", to: "/rapport/stocks" },
            { label: "Rapport paiements", to: "/rapport/paiements" },
            { label: "Rapport inscriptions", to: "/rapport/inscriptions" },
        ],
    },

    {
        label: "Configuration École",
        icon: "settings",
        children: [
            { label: "Tranches", to: "/ecole/tranche" },
            { label: "Frais", to: "/ecole/frais" },
            { label: "Prévision", to: "/ecole/prevision" },
            { label: "Années scolaires", to: "/ecole/annee-scolaire" },
            { label: "Classes", to: "/ecole/classes" },
            { label: "Options", to: "/ecole/options" },
            { label: "Sections", to: "/ecole/sections" },
            { label: "Divisions", to: "/ecole/divisions" },
        ],
    },
];
