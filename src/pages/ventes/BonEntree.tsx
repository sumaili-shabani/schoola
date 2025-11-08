import React, { useEffect, useRef, useState } from "react";
import { fetchSigleItem, fetchListItems } from "../../api/callApi";
import { Modal, LoaderAndError } from "../../components";
import { fileUrl, showErrorMessage } from "../../api/config";

interface BonEntreeProps {
    show: boolean;
    onClose: () => void;
    refEnteteEntree: number;
    title?: string;
}

interface Entreprise {
    nomEntreprise?: string;
    adresseEntreprise?: string;
    telephoneEntreprise?: string;
    emailEntreprise?: string;
    rccm?: string;
    logo?: string;
}

interface Entete {
    id?: number;
    refEnteteEntree?: number;
    noms?: string;
    contact?: string;
    dateEntree?: string;
    TotalEntree?: number;
    TotalEntreeFC?: number;
    author?: string;
}

interface DetailEntree {
    id?: number;
    designation?: string;
    qteEntree?: number;
    puEntree?: number;
    PTEntree?: number;
}

export default function BonEntree({
    show,
    onClose,
    refEnteteEntree,
    title = "Bon d’entrée",
}: BonEntreeProps) {
    const [loading, setLoading] = useState(false);
    const [entreprise, setEntreprise] = useState<Entreprise>({});
    const [entete, setEntete] = useState<Entete>({});
    const [details, setDetails] = useState<DetailEntree[]>([]);
    const [error, setError] = useState<string | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    const [showBon, setShowBon] = useState(false);
    const [selectedEntreeId, setSelectedEntreeId] = useState<number | null>(null);
    const [fournisseurName, setFournisseurName] = useState("");


    useEffect(() => {
        if (show && refEnteteEntree) {
            loadData();
        }
    }, [show, refEnteteEntree]);

    const loadData = async () => {
        setLoading(true);
        try {
            const entrepriseRes = await fetchListItems("/fetch_site_2");
            setEntreprise(entrepriseRes?.data?.[0] || {});

            const url = `/fetch_detail_appro_vente/${refEnteteEntree}`;
            const resDetails = await fetchListItems<any[]>(url);

            setDetails(resDetails.data || []);
            if (resDetails.data?.length) setEntete(resDetails.data[0]);
        } catch (e) {
            setError("Erreur lors du chargement du bon d’entrée");
            showErrorMessage(String(e));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) return;
        win.document.write(`
      <html>
        <head>
          <title>Bon d’entrée</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { width: 100px; height: auto; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; }
            th { background-color: #f1f1f1; text-align: center; }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
        win.document.close();
    };

    return (
        <Modal show={show} onClose={onClose} title={title} dimension="modal-lg">
            <LoaderAndError loading={loading} error={error} />

            <div ref={printRef}>
                <div className="text-center mb-3">
                    {entreprise.logo && (
                        <img
                            src={`${fileUrl}/images/${entreprise.logo}`}
                            alt="logo"
                            className="logo"
                            style={{ width: 150 }}
                        />
                    )}
                    <h5 className="fw-bold mt-2">
                        {entreprise.nomEntreprise || "Nom de l’entreprise"}
                    </h5>
                    <p className="mb-0">{entreprise.adresseEntreprise}</p>
                    <p className="mb-0">
                        {entreprise.telephoneEntreprise} – {entreprise.emailEntreprise}
                    </p>
                    <p className="mb-0">N° Impôt / RCCM : {entreprise.rccm}</p>
                </div>

                <h5 className="text-center fw-bold mb-3">BON D’ENTRÉE</h5>

                <div className="row mb-3">
                    <div className="col-6">
                        <p>
                            <strong>N° Bon :</strong> 00{entete.refEnteteEntree}
                        </p>
                        <p>
                            <strong>Fournisseur :</strong> {entete.noms}
                        </p>
                        <p>
                            <strong>Contact :</strong> {entete.contact}
                        </p>
                    </div>
                    <div className="col-6 text-end">
                        <p>
                            <strong>Date :</strong> {entete.dateEntree}
                        </p>
                        <p>
                            <strong>User :</strong> {entete.author}
                        </p>
                    </div>
                </div>

                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>Article</th>
                            <th>Qté</th>
                            <th>PU ($)</th>
                            <th>PT ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-muted">
                                    Aucune donnée disponible
                                </td>
                            </tr>
                        ) : (
                            details.map((d, i) => (
                                <tr key={i}>
                                    <td>{d.designation}</td>
                                    <td className="text-center">{d.qteEntree}</td>
                                    <td className="text-end">{d.puEntree?.toFixed(2)}</td>
                                    <td className="text-end">{d.PTEntree?.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="d-flex justify-content-between mt-3">
                    <div></div>
                    <div>
                        <p>
                            <strong>Total (USD) :</strong> {entete.TotalEntree?.toFixed(2)} $
                        </p>
                        <p>
                            <strong>Total (FC) :</strong> {entete.TotalEntreeFC?.toFixed(2)} FC
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-end mt-3">
                <button
                    className="btn btn-outline-secondary me-2 no-print"
                    onClick={onClose}
                >
                    Fermer
                </button>
                <button className="btn btn-primary no-print" onClick={() => {
                    handlePrint();

                }}>
                    <i className="fas fa-print me-1"></i> Imprimer
                </button>
            </div>
        </Modal>
    );
}
