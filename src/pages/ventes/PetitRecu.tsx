import React, { useEffect, useState } from "react";
import { fetchListItems } from "../../api/callApi";
import { fileUrl, showErrorMessage } from "../../api/config";

interface RecuProps {
    show: boolean;
    onClose: () => void;
    refEnteteSortie: number;
}

interface RecuEntreprise {
    nomEntreprise?: string;
    adresseEntreprise?: string;
    telephoneEntreprise?: string;
    emailEntreprise?: string;
    logo?: string;
}

interface RecuDetail {
    designation?: string;
    qteVente?: number;
    puVente?: number;
    PTVente?: number;
    Reduction?: number;
    totalFacture?: number;
    totalPaie?: number;
    RestePaie?: number;
    dateVente?: string;
    noms?: string;
    author?: string;
    devise?: string;
}

export default function PetitRecu({ show, onClose, refEnteteSortie }: RecuProps) {
    const [entreprise, setEntreprise] = useState<RecuEntreprise>({});
    const [details, setDetails] = useState<RecuDetail[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && refEnteteSortie) loadRecuData();
    }, [show, refEnteteSortie]);

    const loadRecuData = async () => {
        setLoading(true);
        try {
            const site = await fetchListItems("/fetch_site_2");
            if (site?.data && site.data.length > 0) setEntreprise(site.data[0]);
            const facture = await fetchListItems(`/fetch_detail_facture/${refEnteteSortie}`);
            setDetails(facture?.data || []);
        } catch (err) {
            showErrorMessage("Erreur lors du chargement du reçu.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById("printRecu");
        if (!printContent) return;
        const win = window.open("", "_blank", "width=400,height=600");
        win?.document.write(`
      <html>
        <head>
          <title>Reçu</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 8cm; }
            .center { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { padding: 2px; text-align: left; }
            th { border-bottom: 1px solid #000; }
            .total { border-top: 1px dashed #000; margin-top: 8px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">${printContent.innerHTML}</body>
      </html>
    `);
        win?.document.close();
    };

    if (!show) return null;

    return (
        <div
            className="modal fade show"
            style={{
                display: "block",
                background: "rgba(0,0,0,0.4)",
                zIndex: 2000,
            }}
        >
            <div className="modal-dialog modal-sm">
                <div className="modal-content p-2">
                    <div className="modal-header py-1">
                        <h6 className="modal-title">Reçu de paiement</h6>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body" id="printRecu">
                        {loading ? (
                            <p className="text-center">Chargement...</p>
                        ) : (
                            <>
                                <div className="center">
                                    {entreprise.logo && (
                                        <img
                                            src={`${fileUrl}/images/${entreprise.logo}`}
                                            alt="Logo"
                                            style={{ width: "60px", height: "60px" }}
                                        />
                                    )}
                                    <div>
                                        <strong>{entreprise.nomEntreprise}</strong>
                                        <br />
                                        <small>{entreprise.adresseEntreprise}</small>
                                        <br />
                                        <small>{entreprise.telephoneEntreprise}</small>
                                    </div>
                                    <hr />
                                </div>

                                {details.length > 0 && (
                                    <>
                                        <div>
                                            <small>
                                                <b>Client:</b> {details[0].noms}
                                            </small>
                                            <br />
                                            <small>
                                                <b>Date:</b> {details[0].dateVente}
                                            </small>
                                            <br />
                                            <small>
                                                <b>Caissier:</b> {details[0].author}
                                            </small>
                                        </div>
                                        <hr />

                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Désignation</th>
                                                    <th>Qté</th>
                                                    <th>PU</th>
                                                    <th>PT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {details.map((d, i) => (
                                                    <tr key={i}>
                                                        <td>{d.designation}</td>
                                                        <td>{d.qteVente}</td>
                                                        <td>{d.puVente}</td>
                                                        <td>{d.PTVente}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <hr className="total" />

                                        <div>
                                            <div>
                                                <b>Total:</b> {details[0].totalFacture}$ {details[0].devise}
                                            </div>
                                            <div>
                                                <b>Payé:</b> {details[0].totalPaie}$ {details[0].devise}
                                            </div>
                                            <div>
                                                <b>Reste:</b> {details[0].RestePaie}$ {details[0].devise}
                                            </div>
                                        </div>

                                        <hr />
                                        <div className="center">
                                            <small>Merci pour votre confiance 🙏</small>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer py-1">
                        <button className="btn btn-secondary btn-sm" onClick={onClose}>
                            Fermer
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                            Imprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
