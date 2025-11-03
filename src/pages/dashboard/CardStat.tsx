import React from 'react'

/* ====================== SOUS-COMPONENTS ====================== */

interface CardStatProps {
    title: string;
    value: number | undefined;
    subtitle: string;
    icon: string;
    bg: string;
}


 const CardStat = ({ title, value, subtitle, icon, bg }: CardStatProps) => (
    <div className="col-md-3">
        <div
            className="card text-white shadow-sm border-0 rounded-3 h-100"
            style={{ background: bg }}
        >
            <div className="card-body text-center">
                <i className={`fas ${icon} fa-2x mb-2`}></i>
                <h5 className="fw-bold">{title}</h5>
                <h3 className="fw-bold">{value}</h3>
                <small>{subtitle}</small>
            </div>
        </div>
    </div>
);

export default CardStat;
