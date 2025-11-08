// src/pages/ecole/BonCommande.tsx
import React, { useEffect, useRef, useState } from "react";
import {
    fetchSigleItem,
    fetchListItems,
} from "../../api/callApi";
import { fileUrl, showErrorMessage } from "../../api/config";

interface BonCommandeProps {
    show: boolean;
    onClose: () => void;
    refEnteteCmd?: number;
    service?: "Ventes" | "Logistique";
    title?: string;
}

interface Entreprise {
    nomEntreprise?: string;
    adresseEntreprise?: string;
    telephoneEntreprise?: string;
    telephone?: string;
    emailEntreprise?: string;
    rccm?: string;
    logo?: string;
}

interface ProduitCommande {
    designation?: string;
    qteCmd?: number;
    puCmd?: number;
    PTCmd?: number;
}

interface EnteteCommande {
    refEnteteCmd?: number;
    contact?: string;
    noms?: string;
    dateCmd?: string;
    TotalCmd?: number;
    TotalCmdFC?: number;
    author?: string;
}

export default function BonRequisition({
    show,
    onClose,
    refEnteteCmd,
    service = "Ventes",
    title = "Bon de Commande",
}: BonCommandeProps) {
    const [loading, setLoading] = useState(false);
    const [entreprise, setEntreprise] = useState<Entreprise>({});
    const [entete, setEntete] = useState<EnteteCommande>({});
    const [produits, setProduits] = useState<ProduitCommande[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (show && refEnteteCmd) {
            loadBonCommande();
        }
    }, [show, refEnteteCmd]);

    const loadBonCommande = async () => {
        setLoading(true);
        try {
            // Charger les infos de l’entreprise
            const resSite = await fetchListItems("/fetch_site_2");
            setEntreprise(resSite.data?.[0] || {});

            // Charger les détails du bon
            const url = `/fetch_detail_requisition_vente/${refEnteteCmd}`;
            const resDetails = await fetchListItems<any[]>(url);
            setProduits(resDetails.data);
            if (resDetails.data?.length) setEntete(resDetails.data[0]);
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!printRef.current) return;

        const printContents = printRef.current.innerHTML;
        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) return;

        win.document.write(`
            <html>
            <head>
                <title>Bon de commande</title>

                <!-- ✅ Bootstrap CSS -->
                <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                rel="stylesheet"
                integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
                crossorigin="anonymous"
                />

                <!-- ✅ Custom print styles -->
                <style>
                body {
                    font-family: "Segoe UI", Roboto, sans-serif;
                    background-color: #fff;
                    color: #000;
                    margin: 30px;
                }

                h5, h6 {
                    margin: 0;
                    font-weight: 600;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                th, td {
                    border: 1px solid #333 !important;
                    padding: 6px 8px;
                    text-align: left;
                }

                th {
                    background-color: #f0f0f0;
                    font-weight: 600;
                    text-transform: uppercase;
                    text-align: center;
                }

                td {
                    vertical-align: middle;
                }

                .text-end strong {
                    font-size: 14px;
                }

                .company-header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }

                .company-header img {
                    width: 100px;
                    height: auto;
                    margin-bottom: 5px;
                }

                @media print {
                    body {
                    margin: 10mm;
                    -webkit-print-color-adjust: exact;
                    }

                    .btn, .no-print {
                    display: none !important;
                    }

                    table th, table td {
                    font-size: 11pt;
                    border: 1px solid #333;
                    }
                }
                </style>
            </head>

            <body onload="window.print(); window.close();">
                <div class="container-fluid">
                ${printContents}
                </div>
            </body>
            </html>
        `);

        win.document.close();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">{title}</h5>
                        <button className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body" ref={printRef}>
                        {loading ? (
                            <p>Chargement...</p>
                        ) : (
                            <>
                                <div className="text-center mb-3">
                                    {entreprise.logo && (
                                        <img
                                            src={`${fileUrl}/images/${entreprise.logo}`}
                                            alt="logo"
                                            style={{ width: 100 }}
                                        />
                                    )}
                                    <h6 className="mt-2">{entreprise.nomEntreprise}</h6>
                                    <p className="mb-0">{entreprise.adresseEntreprise}</p>
                                    <p className="mb-0">
                                        {entreprise.telephoneEntreprise} - {entreprise.telephone}
                                    </p>
                                    <p className="mb-0">{entreprise.emailEntreprise}</p>
                                    <p className="mb-0">N° Impôt : {entreprise.rccm}</p>
                                </div>

                                <hr />

                                <div className="row mb-2">
                                    <div className="col-md-6">
                                        <strong>N° :</strong> {entete.refEnteteCmd}
                                        <br />
                                        <strong>Fournisseur :</strong> {entete.noms}
                                        <br />
                                        <strong>Contact :</strong> {entete.contact}
                                        <br />
                                        <strong>Date :</strong> {entete.dateCmd}
                                    </div>
                                </div>

                                <table className="table table-bordered table-sm">
                                    <thead>
                                        <tr>
                                            <th>Designation</th>
                                            <th>Qté</th>
                                            <th>PU</th>
                                            <th>PT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {produits.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.designation}</td>
                                                <td>{p.qteCmd}</td>
                                                <td>{p.puCmd}$</td>
                                                <td>{p.PTCmd}$</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="text-end mt-3">
                                    <p>
                                        <strong>Total (USD):</strong> {entete.TotalCmd}$
                                    </p>
                                    <p>
                                        <strong>Total (FC):</strong> {entete.TotalCmdFC} FC
                                    </p>
                                </div>

                                <div className="text-center mt-4">
                                    <small className="text-muted">
                                        User : {entete.author}
                                    </small>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-outline-secondary" onClick={onClose}>
                            Fermer
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            <i className="fas fa-print me-1"></i> Imprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
