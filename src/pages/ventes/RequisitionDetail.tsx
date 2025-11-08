import React, { useEffect, useMemo, useState } from "react";
import {
  fetchItems,
  fetchListItems,
  fetchSigleItem,
  saveItem,
  removeItem,
  showConfirmationDialog,
} from "../../api/callApi";
import {
  getUser,
  showErrorMessage,
  showSuccessMessage,
  showWarningMessage,
} from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {
  LoaderAndError,
  Modal,
  Pagination,
  TextField,
  SelectPickerField,
} from "../../components";
import BonRequisition from "./BonRequisition";
import LoadingSpinner from "../../components/LoadingSpinner";

// ===================== Interfaces =====================
interface DetailRequisition {
  id?: number;
  refEnteteCmd?: number;
  refProduit?: number | string;
  designation?: string;
  qteCmd?: number;
  puCmd?: number;
  devise?: string;
  taux?: number;
  noms?: string;
  dateCmd?: string;
  PTCmd?: number;
  qteDisponible?: number;
  author?: string;
}

interface Produit {
  id: number;
  designation: string;
  pu: number;
  qte: number;
}

interface Props {
  show: boolean;
  onClose: () => void;
  refEnteteCmd: number;
  title?: string;
}

export default function RequisitionDetail({
  show,
  onClose,
  refEnteteCmd,
  title = "Détails de la commande",
}: Props) {
  const [datas, setDatas] = useState<DetailRequisition[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [formData, setFormData] = useState<Partial<DetailRequisition>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
    usePagination({ currentPage, totalPages });

  const [showBon, setShowBon] = useState(false);
  const [bonId, setBonId] = useState<number | null>(null);
  const [fournisseurName, setFournisseurName] = useState("");

  const debounced = useMemo(() => {
    let t: any;
    return (fn: () => void, delay = 350) => {
      clearTimeout(t);
      t = setTimeout(fn, delay);
    };
  }, []);

  // =================== Effects ===================
  useEffect(() => {
    if (show) {
      loadProduits();
      loadDatas();
    }
  }, [show, currentPage]);

  useEffect(() => {
    debounced(() => {
      setCurrentPage(1);
      loadDatas();
    });
  }, [search]);

  // =================== Fetch ===================
  const loadDatas = async () => {
    if (!refEnteteCmd) return;
    setLoading(true);
    try {
      const res = await fetchItems<DetailRequisition>(
        `/fetch_vente_detail_requisition/${refEnteteCmd}`,
        { page: currentPage, limit, query: search }
      );
      setDatas(res.data || []);
      setTotalPages(res.lastPage || 1);
    } catch {
      setError("Erreur lors du chargement des détails de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const loadProduits = async () => {
    try {
      const res = await fetchListItems("/fetch_produit_2");
      setProduits(res?.data || []);
    } catch {
      showErrorMessage("Erreur lors du chargement des produits.");
    }
  };

  const getPrice = async (id: string) => {
    try {
      const res = await fetchSigleItem<Produit[]>("/fetch_single_produit", id);
      const produit = res[0];
      if (produit) {
        setFormData((prev) => ({
          ...prev,
          puCmd: produit.pu,
          qteDisponible: produit.qte,
        }));
      }
    } catch {
      showErrorMessage("Erreur lors de la récupération du prix.");
    }
  };

  // =================== Form ===================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectProduit = async (val: string) => {
    setFormData((prev) => ({ ...prev, refProduit: val }));
    await getPrice(val);
  };

  const openModal = () => {
    setFormData({});
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setFormData({});
    setIsEditing(false);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.refProduit) return showWarningMessage("Sélectionnez un article.");
    if (!formData.qteCmd || formData.qteCmd <= 0)
      return showWarningMessage("Quantité invalide.");
    if (!formData.puCmd || formData.puCmd <= 0)
      return showWarningMessage("Prix unitaire invalide.");
    if (!formData.devise) return showWarningMessage("Choisissez une devise.");

    // if ((formData.qteCmd || 0) > (formData.qteDisponible || 0))
    //   return showErrorMessage("Quantité demandée > disponible.");

    const user = getUser();
    const payload = {
      ...formData,
      refEnteteCmd,
      author: user?.name || "Admin",
    };

    try {
      setLoading(true);
      await saveItem("/insert_vente_detail_requisition", payload);
      showSuccessMessage("Détail ajouté avec succès !");
      closeModal();
      loadDatas();
    } catch {
      showErrorMessage("Erreur lors de l’enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await showConfirmationDialog({
      title: "Supprimer cet article ?",
      text: "Cette action est irréversible.",
    });
    if (!confirm) return;
    try {
      await removeItem("/delete_vente_detail_requisition", id);
      showSuccessMessage("Supprimé !");
      loadDatas();
    } catch {
      showErrorMessage("Erreur lors de la suppression.");
    }
  };

  // =================== UI ===================
  return (
    <Modal title={title} show={show} onClose={onClose} dimension="modal-xl">
      <LoaderAndError loading={loading} error={error} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="input-group w-25">
          <button className="btn btn-sm btn-outline-primary" onClick={loadDatas}>
            <i className="fas fa-sync"></i>
          </button>
          <input
            type="text"
            className="form-control"
            placeholder="Recherche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <LoadingSpinner loading={loading} />
        </div>

        <div>
          <button className="btn btn-primary btn-sm me-2" onClick={openModal}>
            <i className="fas fa-plus me-1"></i> Ajouter
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setBonId(refEnteteCmd!);
              setShowBon(true);
              setFournisseurName(formData.noms ?? "");
            }}
          >
            <i className="fas fa-print me-1"></i> Imprimer
          </button>
        </div>
      </div>

      <table className="table table-bordered table-sm align-middle">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Quantité</th>
            <th>PU ($)</th>
            <th>PT ($)</th>
            <th>N° Bon</th>
            <th>Fournisseur</th>
            <th>Date</th>
            <th>Taux</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {datas.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center text-muted">
                Aucun détail trouvé
              </td>
            </tr>
          ) : (
            datas.map((item) => (
              <tr key={item.id}>
                <td>{item.designation}</td>
                <td>{item.qteCmd}</td>
                <td>{item.puCmd}</td>
                <td>{item.PTCmd}</td>
                <td>{item.refEnteteCmd}</td>
                <td>{item.noms}</td>
                <td>{item.dateCmd}</td>
                <td>{item.taux}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item.id!)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginationRange={paginationRange}
        isCurrentPage={isCurrentPage}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        onPageChange={setCurrentPage}
        textCounter
      />

      {/* Modal d’ajout */}
      <Modal
        title={isEditing ? "Modifier un article" : "Ajouter un article"}
        show={showModal}
        onClose={closeModal}
        dimension="modal-md"
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-12">
              <SelectPickerField
                label="Article"
                name="refProduit"
                options={produits.map((p) => ({
                  value: String(p.id),
                  label: p.designation,
                }))}
                value={formData.refProduit ? String(formData.refProduit) : ""}
                required
                onChange={(v) => handleSelectProduit(v)}
              />
            </div>

            <div className="col-md-6">
              <TextField
                type="number"
                label="Qté disponible"
                name="qteDisponible"
                value={String(formData.qteDisponible || "")}
                onChange={handleChange}
                disabled
              />
            </div>

            <div className="col-md-6">
              <TextField
                label="Qté demandée"
                name="qteCmd"
                type="number"
                value={String(formData.qteCmd || "")}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <TextField
                label="Prix Unitaire ($)"
                name="puCmd"
                type="number"
                value={String(formData.puCmd || "")}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <SelectPickerField
                label="Devise"
                name="devise"
                options={[
                  { value: "USD", label: "USD" },
                  { value: "FC", label: "FC" },
                ]}
                value={formData.devise || ""}
                required
                onChange={(v) => setFormData((p) => ({ ...p, devise: v }))}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={closeModal}
            >
              Fermer
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {isEditing ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>

      {bonId && (
        <BonRequisition
          show={showBon}
          onClose={() => setShowBon(false)}
          refEnteteCmd={bonId}
          title={`Bon de requisition - ${fournisseurName}`}
        />
      )}
    </Modal>
  );
}
