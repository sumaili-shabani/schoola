import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SimpleRecharts() {
  const data = [
    { mois: "Janvier", eleves: 30, filles: 12, garcons: 18 },
    { mois: "Février", eleves: 45, filles: 20, garcons: 25 },
    { mois: "Mars", eleves: 60, filles: 35, garcons: 25 },
    { mois: "Avril", eleves: 40, filles: 18, garcons: 22 },
    { mois: "Mai", eleves: 70, filles: 40, garcons: 30 },
  ];

  const pieData = [
    { name: "Garçons", value: 60 },
    { name: "Filles", value: 40 },
  ];
  const colors = ["#00b09b", "#6a82fb"];

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4 text-success">
        Exemples de graphiques Recharts
      </h2>

      <div className="row g-4">
        {/* ====== BAR CHART ====== */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h6 className="fw-bold text-center mb-3">
              Inscriptions mensuelles
            </h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="eleves" fill="#00b09b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ====== LINE CHART ====== */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h6 className="fw-bold text-center mb-3">
              Tendance des inscriptions
            </h6>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="filles" stroke="#6a82fb" />
                <Line type="monotone" dataKey="garcons" stroke="#00b09b" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ====== PIE CHART ====== */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h6 className="fw-bold text-center mb-3">
              Répartition par genre
            </h6>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
