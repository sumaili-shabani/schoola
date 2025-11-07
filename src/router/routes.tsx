import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../auth/PrivateRoute";
import RoleGuard from "../auth/RoleGuard";
import { ROLES } from "../auth/permissions";
import AdminLayout from "../layout/AdminLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import RoleList from "../pages/roles/RoleList";
import Login from "../pages/Login";
import UserProfile from "../pages/profil/UserProfile";
import NotFoundPage from "../pages/NotFoundPage";
import SitePage from "../pages/site/SitePage";
import UserPage from "../pages/user/UserPage";
import StatInscription from "../pages/dashboard/StatInscription";
import StatPaiement from "../pages/dashboard/StatPaiement";
import ProvincePage from "../pages/localisation/Province";
import QuartierPage from "../pages/localisation/Quartier";
import Commune from "../pages/localisation/Commune";
import Pays from "../pages/localisation/Pays";
import AvenuePage from "../pages/localisation/Avenue";
import TypeOperationPage from "../pages/ohada/TypeOperation";
import TypePositionPage from "../pages/ohada/TypePosition";
import TauxPage from "../pages/ohada/TauxPage";
import TypeComptePage from "../pages/ohada/TypeCompteOhata";
import ClaaseOhadaPage from "../pages/ohada/ClasseOhata";
import CompteOhadaPage from "../pages/ohada/CompteOhadaPage";
import SousCompteOhadaPage from "../pages/ohada/SCompte";
import SSousCompteOhadaPage from "../pages/ohada/SSousCompteOhadaPage";
import ModePaiementPage from "../pages/finances/ModePaiementPage";
import BanqueOhadaPage from "../pages/finances/BanqueOhadaPage";
import RubriqueOhadaPage from "../pages/finances/RubriqueOhadaPage";
import CategorieRubriquePage from "../pages/finances/CategorieRubriquePage";
import RubriquePage from "../pages/finances/RubriquePage";
import BlocPage from "../pages/ohada/BlocPage";
import ProvenancePage from "../pages/ohada/ProvenancePage";
import CategorieProduitPage from "../pages/finances/CategorieProduitPage";
import TranchePage from "../pages/ecole/TranchePage";
import FraisPage from "../pages/ecole/FraisPage";
import PrevisionPage from "../pages/ecole/PrevisionPage";
import ClassePage from "../pages/ecole/ClassePage";
import AnneeScolairePage from "../pages/ecole/AnneeScolaire";
import DivisionPage from "../pages/ecole/DivisionPage";
import OptionPage from "../pages/ecole/Options";
import SectionPage from "../pages/ecole/SectionPage";
import MoisScolairePage from "../pages/ecole/MoisScolaire";
import ElevePage from "../pages/reception/ElevePage";
import InscriptionPage from "../pages/reception/InscriptionPage";
import PaiementPage from "../pages/paiement/PaiementPage";
import ParentPage from "../pages/reception/ParentPage";
import RecettePage from "../pages/paiement/RecettePage";
import PresencePage from "../pages/reception/PresencePage";
import EffectifPage from "../pages/reception/EffectifPage";
import PonctualitePage from "../pages/reception/PonctualitePage";
import DepensePage from "../pages/paiement/DepensePage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Accès refusé */}
            <Route
                path="/unauthorized"
                element={<div className="p-4 text-center text-danger fw-bold">Accès refusé 🚫</div>}
            />

            {/* Routes protégées */}
            <Route
                path="profil"
                element={
                    <RoleGuard
                        allowed={[
                            ROLES.SUPER_ADMIN,
                            ROLES.ADMIN,
                            ROLES.ENSEIGNANT,
                            ROLES.COMPTABLE,
                            ROLES.SECRETAIRE,
                            ROLES.AUDITEUR,
                        ]}
                    >
                        <UserProfile />
                    </RoleGuard>
                }
            />

            {/* interfaces superadmin */}
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <AdminLayout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Dashboard />} />

                <Route
                    path="roles"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <RoleList />
                        </RoleGuard>
                    }
                />
                <Route
                    path="systeme"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <SitePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="users"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <UserPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="statistiques/dashboard"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <Dashboard />
                        </RoleGuard>
                    }
                />

                <Route
                    path="statistiques/eleves"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <StatInscription />
                        </RoleGuard>
                    }
                />

                <Route
                    path="statistiques/paiements"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <StatPaiement />
                        </RoleGuard>
                    }
                />

                {/* localisation */}
                <Route
                    path="geo/ville"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <ProvincePage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="geo/quartier"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <QuartierPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="geo/commune"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <Commune />
                        </RoleGuard>
                    }
                />

                <Route
                    path="geo/pays"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <Pays />
                        </RoleGuard>
                    }
                />
                <Route
                    path="geo/avenue"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <AvenuePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="system/ecoles"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <SitePage />
                        </RoleGuard>
                    }
                />

                {/* taux */}

                <Route
                    path="ohada/type-operation"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <TypeOperationPage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="ohada/type-position"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <TypePositionPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/config-taux"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <TauxPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/type-compte"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <TypeComptePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/classes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ClaaseOhadaPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/comptes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <CompteOhadaPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/sous-comptes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <SousCompteOhadaPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/ssous-comptes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <SSousCompteOhadaPage />
                        </RoleGuard>
                    }
                />
                {/* confiruation finance */}

                <Route
                    path="ohada/mode-paiement"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ModePaiementPage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="ohada/caisse-banque"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <BanqueOhadaPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/rubriques"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RubriqueOhadaPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/cat-rubriques"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <CategorieRubriquePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/eb-rubriques"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RubriquePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/bloc"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <BlocPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ohada/service"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ProvenancePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="vente/category-product"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <CategorieProduitPage />
                        </RoleGuard>
                    }
                />

                {/* ecole */}
                <Route
                    path="ecole/tranche"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <TranchePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/frais"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <FraisPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/prevision"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <PrevisionPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/classes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ClassePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/annee-scolaire"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <AnneeScolairePage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="ecole/divisions"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <DivisionPage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="ecole/options"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <OptionPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/sections"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <SectionPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/mois-scolaire"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <MoisScolairePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/eleves"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ElevePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/presences"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <PresencePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/cloture-effectif"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <EffectifPage />
                        </RoleGuard>
                    }
                />

                

                

                <Route
                    path="ecole/parents"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ParentPage />
                        </RoleGuard>
                    }
                />

                

                <Route
                    path="ecole/inscriptions"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <InscriptionPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="ecole/ponctualite/:codeInscription"
                    element={
                        <RoleGuard
                            allowed={[
                                ROLES.SUPER_ADMIN,
                                ROLES.COMPTABLE,
                                ROLES.CAISSIER,
                                ROLES.ENSEIGNANT,
                                ROLES.AUDITEUR,
                                ROLES.ADMIN,
                            ]}
                        >
                            <PonctualitePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="compta/paiements"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <PaiementPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="tresorerie/recettes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RecettePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="tresorerie/depenses"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <DepensePage />
                        </RoleGuard>
                    }
                />

                

                

                


                


                
                

                

              


                

                

                

                

                

                

                

                

                

                

               

                

                

                


                

               
                
                
                

                

                


                





                {/* Toutes les autres routes protégées */}
            </Route>

            {/* Page 404 (doit être à la fin) */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
