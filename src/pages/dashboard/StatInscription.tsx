import React, { useEffect, useState } from "react";
import { fetchListItems } from "../../api/callApi";
import { showErrorMessage } from "../../api/config";
import LoadingSpinner from "../../components/LoadingSpinner";
import SimpleCharts from "../../components/SimpleRecharts";
import BarChartComponent from "../../components/charts/BarChartComponent";
import PieChartComponent from "../../components/charts/PieChartComponent";
import CardStat from "./CardStat";

interface DashUi {
    NombreTotalUtilisateur?: number;
    NombreTotalUtilisateurM?: number;
    NombreTotalUtilisateurF?: number;
    NombreTotalRole?: number;
    NombreTotalEleveM?: number;
    NombreTotalEleveF?: number;
    NombreTotalInscrit?: number;
    NombreTotalInscritReduction?: number;
    SommeTotalCaisseE?: number;
    SommeTotalCaisseS?: number;
    SommeTotalCaisse?: number;
    SommeTotalBanque?: number;
}

interface StatUi {
    name: any;
    value: any;
}

export default function StatInscription() {
    const [data, setData] = useState<DashUi | null>(null);
    const [statUser, setStatUser] = useState<StatUi[]>([]);

    const [statSexeUser, setStatSexeUser] = useState<StatUi[]>([]);
    const [statRoleUser, setStatRoleUser] = useState<StatUi[]>([]);
    const [statInscriptionUser, setStatInscriptionUser] = useState<StatUi[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);

            const resCount = await fetchListItems("/showCountDashbord");
            setData(resCount.data[0]);


            const resEleve = await fetchListItems("/stat_eleve_dashborad_annee_scolaire");
            setStatInscriptionUser(resEleve.data);

            const res = await fetchListItems("/stat_users_dashborad");
            setStatUser(res.data);
            // console.log("res: ", res.data);

            const resRole = await fetchListItems("/stat_users_role_dashborad");
            setStatRoleUser(resRole.data);

            const resSexe = await fetchListItems("/stat_users_role_sexe_dashborad");
            setStatSexeUser(resSexe.data);

            setLoading(false);

        } catch (e) {
            showErrorMessage("Erreur de chargement du tableau de bord: " + e);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <LoadingSpinner loading={loading} />;

    return (
        <div className="col-md-12">
            <h4 className="fw-bold mb-4 text-dark">
                Inscriptions des élèves – <span className="text-success">Ecole Dashboard</span>
            </h4>

            {/* ===== Cartes principales ===== */}
            {data && (
                <div className="row g-3 mb-3">
                    {/* Total des élèves */}
                    <CardStat
                        title="Élèves Inscrits (Total)"
                        value={data.NombreTotalInscrit}
                        subtitle="Garçons + Filles"
                        icon="fa-users"
                        bg="linear-gradient(135deg, #00b09b, #96c93d)"
                    />

                    {/* Garçons */}
                    <CardStat
                        title="Élèves Garçons"
                        value={data.NombreTotalEleveM}
                        subtitle="Sexe : M"
                        icon="fa-mars"
                        bg="linear-gradient(135deg, #36d1dc, #5b86e5)"
                    />

                    {/* Filles */}
                    <CardStat
                        title="Élèves Filles"
                        value={data.NombreTotalEleveF}
                        subtitle="Sexe : F"
                        icon="fa-venus"
                        bg="linear-gradient(135deg, #ff758c, #ff7eb3)"
                    />

                    {/* Rôles */}
                    <CardStat
                        title="Rôles"
                        value={data.NombreTotalRole}
                        subtitle="Total des rôles"
                        icon="fa-user-shield"
                        bg="linear-gradient(135deg, #667eea, #764ba2)"
                    />

                 
                </div>
            )}

            {/* ===== Section Graphiques ===== */}
            <div className="row mt-4">
                <div className="col-md-6 mb-2">
                    <BarChartComponent data={statUser} color="#6a82fb" title="Répartition des options des élèves" />
                </div>

                <div className="col-md-6 mb-2">
                    <PieChartComponent data={statInscriptionUser} title="Évolution des inscriptions par année scolaire" />
                </div>

                

            </div>
        </div>
    );
}

