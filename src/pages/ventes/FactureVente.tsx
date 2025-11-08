import React, { useEffect, useRef, useState } from "react";
import {
    fetchListItems,
    fetchSigleItem,
} from "../../api/callApi";
import { Modal, LoaderAndError } from "../../components";
import { fileUrl, showErrorMessage } from "../../api/config";

interface EntrepriseInfo {
    nomEntreprise?: string;
    adresseEntreprise?: string;
    telephoneEntreprise?: string;
    telephone?: string;
    emailEntreprise?: string;
    rccm?: string;
    logo?: string;
}

interface VenteEntete {
    refEnteteVente?: number;
    contact?: string;
    noms?: string;
    dateVente?: string;
    totalFacture?: number;
    totalFactureFC?: number;
    totalPaie?: number;
    RestePaie?: number;
    author?: string;
}

interface VenteDetail {
    designation?: string;
    qteVente?: number;
    Unites?: string;
    puVente?: number;
    PTVente?: number;
    Reduction?: number;
}

interface FactureVenteProps {
    show: boolean;
    onClose: () => void;
    refEnteteSortie: number;
    serviceType: "Ventes" | "Salon";
    title?: string;
}

export default function FactureVente({
    show,
    onClose,
    refEnteteSortie,
    serviceType,
    title = "Facture de vente",
}: FactureVenteProps) {
    const [loading, setLoading] = useState(false);
    const [entreprise, setEntreprise] = useState<EntrepriseInfo>({});
    const [entete, setEntete] = useState<VenteEntete>({});
    const [details, setDetails] = useState<VenteDetail[]>([]);
    const [error, setError] = useState<string | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    // ============================ LOAD DATA ============================
    useEffect(() => {
        if (show && refEnteteSortie) {
            loadEntreprise();
            loadFacture();
        }
    }, [show, refEnteteSortie]);

    const loadEntreprise = async () => {
        try {
            const res = await fetchListItems("/fetch_site_2");
            if (res?.data && res.data.length) setEntreprise(res.data[0]);
        } catch (e) {
            showErrorMessage("Erreur lors du chargement des informations société.");
        }
    };

    const loadFacture = async () => {
        setLoading(true);
        try {
            // Charger les détails du bon
            const url = `/fetch_detail_facture/${refEnteteSortie}`;
            const res = await fetchListItems<any>(url);

            if (res?.data?.length) {
                setDetails(res.data);
                setEntete(res.data[0]);
            }
        } catch (e) {
            setError("Erreur lors du chargement de la facture.");
        } finally {
            setLoading(false);
        }
    };

    // ============================ PRINT ============================
    const handlePrint = () => {
        if (!printRef.current) return;
        const printContents = printRef.current.innerHTML;
        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) return;

        win.document.write(`
      <html>
        <head>
          <title>Facture Vente</title>
          <!-- ✅ Bootstrap CSS -->
                <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                rel="stylesheet"
                integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
                crossorigin="anonymous"
                />
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 30px; color: #000; }
            h5, h6 { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 6px 8px; }
            th { background-color: #f1f1f1; text-align: center; }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .fw-bold { font-weight: bold; }
            
            @media print {
              .no-print { display: none !important; }
              body { margin: 10mm; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);

        win.document.close();
    };

    // ============================ UI ============================
    return (
        <Modal show={show} onClose={onClose} title={title} dimension="modal-lg">
            <LoaderAndError loading={loading} error={error} />

            <div ref={printRef}>
                <div className="text-center mb-3">
                    <img
                        src={`${fileUrl}/images/${entreprise.logo}`}
                        alt="logo"
                        className="logo"
                        style={{ width: 150 }}
                    />
                    <h5>{entreprise.nomEntreprise}</h5>
                    <p>
                        {entreprise.adresseEntreprise} <br />
                        {entreprise.telephoneEntreprise} - {entreprise.telephone} <br />
                        {entreprise.emailEntreprise}
                    </p>
                    <small>RCCM : {entreprise.rccm}</small>
                </div>

                <div className="mb-3">
                    <table className="table table-borderless small">
                        <tbody>
                            <tr>
                                <td><strong>Facture N° :</strong> 00{entete.refEnteteVente}</td>
                                <td><strong>Date :</strong> {entete.dateVente}</td>
                            </tr>
                            <tr>
                                <td><strong>Client :</strong> {entete.noms}</td>
                                <td><strong>Contact :</strong> {entete.contact}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>Désignation</th>
                            <th>Qté</th>
                            <th>PU ($)</th>
                            <th>PT ($)</th>
                            <th>Réduction ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((item, i) => (
                            <tr key={i}>
                                <td>{item.designation}</td>
                                <td>{item.qteVente} ({item.Unites})</td>
                                <td>{item.puVente}</td>
                                <td>{item.PTVente}</td>
                                <td>{item.Reduction ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="text-end mt-3">
                    <p><strong>Total (FC):</strong> {entete.totalFactureFC ?? 0} FC</p>
                    <p><strong>Total (USD):</strong> {entete.totalFacture ?? 0} $</p>
                    <p><strong>Montant Payé:</strong> {entete.totalPaie ?? 0} $</p>
                    <p><strong>Reste à Payer:</strong> {entete.RestePaie ?? 0} $</p>
                </div>

                <div className="text-center mt-4">
                    <small>Utilisateur : {entete.author}</small>
                    <br />
                    <strong>** Merci pour votre visite **</strong>
                </div>
            </div>

            <div className="d-flex justify-content-end mt-3 no-print">
                <button className="btn btn-secondary me-2" onClick={onClose}>
                    Fermer
                </button>
                <button className="btn btn-primary" onClick={handlePrint}>
                    <i className="fas fa-print me-2"></i> Imprimer
                </button>
            </div>
        </Modal>
    );
}
