import React from "react";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface BarChartProps {
    title?: string;
    data: any[]; // Exemple : [{ name: "Cycle A", value: 10 }, { name: "Cycle B", value: 5 }]
    xKey?: string; // clé du nom → "name" par défaut
    yKey?: string; // clé de la valeur → "value" par défaut
    color?: string;
}

const BarChartComponent: React.FC<BarChartProps> = ({
    title = "Statistiques",
    data,
    xKey = "name",
    yKey = "value",
    color = "#00b09b",
}) => {
    if (!data || data.length === 0) {
        return (
            <div className="card shadow-sm border-0 p-3 text-center text-muted">
                <p>Aucune donnée à afficher</p>
            </div>
        );
    }

    return (
        <div className="card shadow-sm border-0 p-3 h-100">
            <h6 className="fw-bold text-center mb-3">{title}</h6>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={yKey} fill={color} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BarChartComponent;
