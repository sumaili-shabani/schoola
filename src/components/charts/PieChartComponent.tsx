import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface PieChartProps {
    title?: string;
    data: any[]; // Exemple : [{ name: "Garçons", value: 60 }, { name: "Filles", value: 40 }]
    nameKey?: string;
    valueKey?: string;
    colors?: string[];
}

const PieChartComponent: React.FC<PieChartProps> = ({
    title = "Répartition",
    data,
    nameKey = "name",
    valueKey = "value",
    colors = ["#00b09b", "#6a82fb", "#FFB200", "#FF4560"],
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
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={valueKey}
                        nameKey={nameKey}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PieChartComponent;
