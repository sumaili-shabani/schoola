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
import ClotureCaissePage from "../pages/paiement/ClotureCaissePage";
import ClotureComptabilitePagePage from "../pages/paiement/ClotureComptabilitePage";
import FournisseurPage from "../pages/ventes/FournisseurPage";
import ProduitPage from "../pages/ventes/ProduitPage";
import RequisitionPage from "../pages/ventes/RequisitionPage";
import VentePage from "../pages/ventes/VentePage";
import ApprovisionnementPage from "../pages/ventes/ApprovisionnementPage";
import RapportComptabilitePage from "../pages/rapport/RapportComptabilitePage";
import RapportCaisseBanquePage from "../pages/rapport/RapportCaisseBanquePage";
import RapportVenteStockPage from "../pages/rapport/RapportVenteStockPage";
import RapportInscriptionPage from "../pages/rapport/RapportInscriptionPage";
import RapportRecouvrementPage from "../pages/rapport/RapportRecouvrementPage";
import PeriodePage from "../pages/enseignement/PeriodePage";
import CatCoursPage from "../pages/enseignement/CatCoursPage";
import CoursPage from "../pages/enseignement/CoursPage";
import EnseignantPage from "../pages/enseignement/EnseignantPage";
import PlanificationPage from "../pages/reception/Planification";
import CotationPage from "../pages/reception/CotationPage";
import RapportResultatsPage from "../pages/rapport/RapportResultatsPage";
import MessageScolairePage from "../pages/ecole/MessageScolairePage";

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
                    path="/profil"
                    element={
                        <RoleGuard

                        >
                            <UserProfile />
                        </RoleGuard>
                    }
                />

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
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <Dashboard />
                        </RoleGuard>
                    }
                />

                <Route
                    path="statistiques/eleves"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <StatInscription />
                        </RoleGuard>
                    }
                />

                <Route
                    path="statistiques/paiements"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
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

                <Route
                    path="tresorerie/caisse-jour"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ClotureCaissePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="tresorerie/comptabilite-jour"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ClotureComptabilitePagePage />
                        </RoleGuard>
                    }
                />

                {/* vente */}
                <Route
                    path="stock/fournisseurs"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <FournisseurPage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="stock/produits"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ProduitPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="stock/etat-besoin"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RequisitionPage />
                        </RoleGuard>
                    }
                />


                <Route
                    path="stock/ventes"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <VentePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="stock/approvisionnements"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <ApprovisionnementPage />
                        </RoleGuard>
                    }
                />

                {/* rapports */}
                <Route
                    path="/rapport/finances"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RapportCaisseBanquePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/rapport/tresorerie"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RapportComptabilitePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/rapport/stocks"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RapportVenteStockPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/rapport/inscriptions"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RapportInscriptionPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/rapport/paiements"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RapportRecouvrementPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/rapport/evaluations"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <RapportResultatsPage />
                        </RoleGuard>
                    }
                />

                

                {/* enseignement */}
                <Route
                    path="/parametrage/periode"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <PeriodePage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/parametrage/categorie-cours"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <CatCoursPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/parametrage/cours"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <CoursPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/enseignement/enseignants"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <EnseignantPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/enseignement/planifications"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                       
                            <PlanificationPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/enseignement/evaluations"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <CotationPage />
                        </RoleGuard>
                    }
                />

                <Route
                    path="/messages/annonces"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN, ROLES.COMPTABLE, ROLES.CAISSIER,]}>
                            <MessageScolairePage />
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
