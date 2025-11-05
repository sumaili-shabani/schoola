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

                

                

                

                

               

                

                

                


                

               
                
                
                

                

                


                





                {/* Toutes les autres routes protégées */}
            </Route>

            {/* Page 404 (doit être à la fin) */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
