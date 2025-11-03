import React, { useEffect, useState } from "react";
import { fetchListItems } from "../../api/callApi";
import { showErrorMessage } from "../../api/config";
import LoadingSpinner from "../../components/LoadingSpinner";
import BarChartComponent from "../../components/charts/BarChartComponent";
import PieChartComponent from "../../components/charts/PieChartComponent";
import CardStat from "./CardStat";

interface DashUi {
    SommeTotalCaisseE?: number; // Entrées
    SommeTotalCaisseS?: number; // Sorties
    SommeTotalCaisse?: number;  // Solde caisse
    SommeTotalBanque?: number;  // Solde banque
}

interface StatUi {
    name: string;
    value: number;
}

export default function StatPaiement() {
    const [data, setData] = useState<DashUi | null>(null);

    const [statPayAnneesScolaires, setStatPayAnneesScolaires] = useState<StatUi[]>([]);
    const [statPayMoisEncours, setStatPayMoisEncours] = useState<StatUi[]>([]);
    const [statPayOptions, setStatPayOptions] = useState<StatUi[]>([]);
    const [statPayClasses, setStatPayClasses] = useState<StatUi[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);

            // 🔹 Données globales
            const resCount = await fetchListItems("/showCountDashbord");
            setData(resCount.data[0]);

            // 🔹 Statistiques de paiement (par API)
            const resPayAnnees = await fetchListItems("/stat_eleve_dashborad_annee_scolaire");
            setStatPayAnneesScolaires(resPayAnnees.data);

            const resPayMois = await fetchListItems("/stat_dashboard_paiement_mois_encours");
            setStatPayMoisEncours(resPayMois.data);

            const resPayOptions = await fetchListItems("/stat_dashboard_paiement_par_option");
            setStatPayOptions(resPayOptions.data);

            const resPayClasses = await fetchListItems("/stat_dashboard_paiement_par_classe");
            setStatPayClasses(resPayClasses.data);
        } catch (e) {
            showErrorMessage("Erreur de chargement du tableau de bord : " + e);
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
                Statistiques des paiements –{" "}
                <span className="text-success">Ecole Dashboard</span>
            </h4>

            {/* ===== Cartes principales ===== */}
            {data && (
                <div className="row g-3 mb-3">
                    <CardStat
                        title="Total Recettes"
                        value={data.SommeTotalCaisseE}
                        subtitle="Entrées de caisse (USD)"
                        icon="fa-arrow-down text-dark"
                        bg="linear-gradient(135deg, #00b09b, #96c93d)"
                    />

                    <CardStat
                        title="Total Dépenses"
                        value={data.SommeTotalCaisseS}
                        subtitle="Sorties de caisse (USD)"
                        icon="fa-arrow-up text-danger"
                        bg="linear-gradient(135deg, #ff758c, #ff7eb3)"
                    />

                    <CardStat
                        title="Solde Caisse"
                        value={data.SommeTotalCaisse}
                        subtitle="Disponible en caisse (USD)"
                        icon="fa-wallet"
                        bg="linear-gradient(135deg, #43cea2, #185a9d)"
                    />

                    <CardStat
                        title="Solde Banque"
                        value={data.SommeTotalBanque}
                        subtitle="Disponible en banque (USD)"
                        icon="fa-university"
                        bg="linear-gradient(135deg, #667eea, #764ba2)"
                    />
                </div>
            )}

            {/* ===== Section Graphiques ===== */}
            <div className="row mt-4">
                <div className="col-md-6 mb-3">
                    <BarChartComponent
                        data={statPayAnneesScolaires}
                        color="#6a82fb"
                        title="Paiements par année scolaire"
                    />
                </div>

                <div className="col-md-6 mb-3">
                    {/* <PieChartComponent
                        data={statPayMoisEncours}
                        title="Paiements du mois en cours"
                    /> */}
                    <PieChartComponent
                        data={statPayAnneesScolaires}
                        title="Paiements du mois en cours"
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <PieChartComponent
                        data={statPayOptions}
                        title="Répartition des paiements par option"
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <PieChartComponent
                        data={statPayClasses}
                        title="Répartition des paiements par classe"
                    />
                </div>
            </div>
        </div>
    );
}
