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

export default function Dashboard() {
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
        Bienvenue – <span className="text-success">Ecole Dashboard</span>
      </h4>

      {/* ===== Cartes principales ===== */}
      {data && (
        <div className="row g-3 mb-2">
          <CardStat
            title="Élèves"
            value={data.NombreTotalUtilisateur}
            subtitle="Total des élèves"
            icon="fa-user-graduate"
            bg="linear-gradient(135deg, #00b09b, #96c93d)"
          />

          <CardStat
            title="Rôles"
            value={data.NombreTotalRole}
            subtitle="Total des rôles"
            icon="fa-user-shield"
            bg="linear-gradient(135deg, #667eea, #764ba2)"
          />

          <CardStat
            title="Inscriptions"
            value={data.NombreTotalInscrit}
            subtitle="Total inscrits"
            icon="fa-file-signature"
            bg="linear-gradient(135deg, #43cea2, #185a9d)"
          />

          <CardStat
            title="Caisse"
            value={data.SommeTotalCaisse}
            subtitle="Solde caisse ($)"
            icon="fa-cash-register"
            bg="linear-gradient(135deg, #fc5c7d, #6a82fb)"
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

        <div className="col-md-6 mb-2">
          <PieChartComponent data={statSexeUser} title="Répartition des Genres utilisateurs" />
        </div>


        <div className="col-md-6 mb-2">
          <BarChartComponent data={statRoleUser} color="#6D69CD" title="Répartition des rôles utilisateurs" />
        </div>

        
      </div>
    </div>
  );
}

