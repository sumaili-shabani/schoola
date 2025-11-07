import { ROLES, RoleId } from "../auth/permissions";

export type MenuItem = {
    label: string;
    icon?: string; // icons 'feather'
    to?: string;
    children?: MenuItem[];
    roles?: RoleId[];
};

export const MENU: MenuItem[] = [
    {
        label: "Tableau de bord",
        icon: "activity",
        to: "/",
    },

    // 📊 STATISTIQUES
    {
        label: "Statistiques & Gestion",
        icon: "bar-chart-2",
        children: [
            { label: "Tableau de bord", to: "/statistiques/dashboard" },
            { label: "Élèves par option", to: "/statistiques/eleves" },
            { label: "Paiements mensuels", to: "/statistiques/paiements" },
            // { label: "Paiements par option", to: "/statistiques/paiements-option" },
            // { label: "Paiements par classe", to: "/statistiques/paiements-classe" },
        ],
    },

    // 🌍 GÉOGRAPHIE ET PARAMÈTRES AVANCÉS
    {
        label: "Système & Configuration",
        icon: "settings",
        roles: [ROLES.SUPER_ADMIN],
        children: [
            // 📘 COMPTABILITÉ OHADA
            {
                label: "Comptabilité OHADA",
                icon: "file-text",
                roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE],
                children: [
                    { label: "Classes", to: "/ohada/classes" },
                    { label: "Comptes", to: "/ohada/comptes" },
                    { label: "Sous Comptes", to: "/ohada/sous-comptes" },
                    { label: "SSous Comptes", to: "/ohada/ssous-comptes" },
                    { label: "Type Compte", to: "/ohada/type-compte" },
                    { label: "Type Position", to: "/ohada/type-position" },
                    { label: "Type Opération", to: "/ohada/type-operation" },
                
                ],
            },

            {
                label: "Trésorerie",
                icon: "credit-card",
                roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE],
                children: [

                    { label: "Config. Taux", to: "/ohada/config-taux" },
                    { label: "Rubriques", to: "/ohada/rubriques" },
                    { label: "Caisse & Banque", to: "/ohada/caisse-banque" },
                    { label: "Mode de Paiement", to: "/ohada/mode-paiement" },

                    { label: "Categorie de rubrique", to: "/ohada/cat-rubriques" },
                    { label: "Rubriques EB", to: "/ohada/eb-rubriques" },
                    { label: "Bloc", to: "/ohada/bloc" },
                    { label: "Service", to: "/ohada/service" },

                ],
            },

            {
                label: "Localisation",
                icon: "file-text",
                roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE],
                children: [
                    { label: "Pays", to: "/geo/pays" },
                    { label: "Provinces", to: "/geo/ville" },
                    { label: "Commune", to: "/geo/commune" },
                    { label: "Quartier", to: "/geo/quartier" },
                    { label: "Avenue", to: "/geo/avenue" },
                ],
            },
            {
                label: "Paiement et frais",
                icon: "dollar-sign",
                roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE],
                children: [
                    { label: "Tranches", to: "/ecole/tranche" },
                    { label: "Frais", to: "/ecole/frais" },
                    { label: "Prévision", to: "/ecole/prevision" },
                    
                ],
            },
            {
                label: "Paramétrages scolaires",
                icon: "dollar-sign",
                roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE],
                children: [
                  
                    { label: "Années scolaires", to: "/ecole/annee-scolaire" },
                    { label: "Sections", to: "/ecole/sections" },
                    { label: "Options", to: "/ecole/options" },
                    { label: "Classes", to: "/ecole/classes" },
                    { label: "Division", to: "/ecole/divisions" },
                    { label: "Mois scolaires", to: "/ecole/mois-scolaire" },
                    { label: "Matières", to: "/ecole/matieres" },

                    // { label: "Horaires & emplois du temps", to: "/ecole/horaires" },

                ],
            },
            { label: "Catégorie des produits", to: "/vente/category-product" },
            { label: "Établissements", to: "/system/ecoles" },
            { label: "Sauvegardes", to: "/system/backup" },
            { label: "Logs système", to: "/system/logs" },
        ],
    },

    // 🏫 GESTION SCOLAIRE
    {
        label: "École & Élèves",
        icon: "book-open",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SECRETAIRE],
        children: [
            { label: "Élèves", to: "/ecole/eleves" },
            { label: "Inscriptions", to: "/ecole/inscriptions" },
            { label: "Parents d’élèves", to: "/ecole/parents" },
            { label: "Présences d’élèves", to: "/ecole/presences" },
            { label: "Clôture effectif des élèves", to: "/ecole/cloture-effectif" },
            
           
        ],
    },

    // 🧑‍🏫 ENSEIGNEMENT
    {
        label: "Enseignement",
        icon: "layers",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENSEIGNANT],
        children: [
            { label: "Cours & Devoirs", to: "/enseignement/cours" },
            { label: "Planification", to: "/enseignement/planifications" },
            { label: "Évaluations", to: "/enseignement/evaluations" },
            {
                label: "Résultats & Bulletins",
                children: [
                    { label: "Saisie des notes", to: "/resultats/notes" },
                    { label: "Bulletins scolaires", to: "/resultats/bulletins" },
                    { label: "Palmarès", to: "/resultats/palmares" },
                ],
            },
        ],
    },

    // 💳 FINANCES
    {
        label: "Trésorerie & Finances",
        icon: "credit-card",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER],
        children: [
            { label: "Paiements élèves", to: "/compta/paiements" },
            { label: "Recettes", to: "/tresorerie/recettes" },
            { label: "Dépenses", to: "/tresorerie/depenses" },
            { label: "Caisse du jour", to: "/tresorerie/caisse-jour" },
            {
                label: "Rapports & Statistiques",
                children: [
                    { label: "Rapport mensuel", to: "/tresorerie/rapports/mensuels" },
                    { label: "Rapport annuel", to: "/tresorerie/rapports/annuels" },
                    { label: "Analyse financière", to: "/tresorerie/analyse" },
                ],
            },
        ],
    },

    // 🧾 COMPTABILITÉ
    {
        label: "Comptabilité",
        icon: "dollar-sign",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMPTABLE],
        children: [
           
            { label: "Dépenses générales", to: "/compta/depenses" },
            { label: "Budgets & prévisions", to: "/compta/budgets" },
            { label: "Recouvrement forcé", to: "/compta/recouvrement" },
        ],
    },

    // 📅 PRÉSENCE ET DISCIPLINE
    {
        label: "Présences & Discipline",
        icon: "calendar",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENSEIGNANT, ROLES.SECRETAIRE],
        children: [
            { label: "Feuilles de présence", to: "/presences/liste" },
            { label: "QR Code de pointage", to: "/presences/qrcode" },
            { label: "Discipline & Retards", to: "/presences/discipline" },
        ],
    },

    // 💬 COMMUNICATION
    {
        label: "Communication",
        icon: "message-circle",
        children: [
            { label: "Messagerie interne", to: "/messages/inbox" },
            { label: "Nouveau message", to: "/messages/new" },
            { label: "Communiqués & annonces", to: "/messages/annonces" },
            { label: "Alertes urgentes", to: "/messages/alertes" },
        ],
    },

    // 👥 UTILISATEURS & SÉCURITÉ
    {
        label: "Utilisateurs & Accès",
        icon: "users",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
        children: [
            { label: "Utilisateurs", to: "/users" },
            { label: "Rôles & permissions", to: "/roles" },
            { label: "Configuration système", to: "/systeme" },
            {
                label: "Journal & Sécurité",
                children: [
                    { label: "Journal des connexions", to: "/security/logins" },
                    { label: "Tentatives échouées", to: "/security/fails" },
                    { label: "Historique d’actions", to: "/security/actions" },
                ],
            },
        ],
    },

  
];
