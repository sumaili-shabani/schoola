import React, { useEffect, useState, useMemo } from "react";
import {
  fetchItems,
  fetchListItems,
  fetchSigleItem,
  saveItem,
  removeItem,
  showConfirmationDialog,
  extractTime,
  formatDateFR,
} from "../../api/callApi";
import { getUser, showErrorMessage, showSuccessMessage } from "../../api/config";
import {
  TextField,
  SelectPickerField,
  Modal,
  Pagination,
  LoaderAndError,
} from "../../components";
import { usePagination } from "../../hooks/usePagination";
import LoadingSpinner from "../../components/LoadingSpinner";

// ---- Types ----
interface Rubrique {
  id?: number | string;
  designation?: string;
  refMvt?: number | string;
  refCompte?: number | string;
  refSousCompte?: number | string;
  refSscompte?: number | string;
  TypeMouvement?: string;
  nom_ssouscompte?: string;
  numero_ssouscompte?: string;
  author?: string;
  created_at?: string;
  Compte?:string;
}

interface Option {
  value: string;
  label: string;
}

// ---- Composant principal ----
export default function RubriqueOhadaPage() {
  const [datas, setDatas] = useState<Rubrique[]>([]);
  const [formData, setFormData] = useState<Partial<Rubrique>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Dropdowns
  const [mouvementOptions, setMouvementOptions] = useState<Option[]>([]);
  const [compteOptions, setCompteOptions] = useState<Option[]>([]);
  const [sousCompteOptions, setSousCompteOptions] = useState<Option[]>([]);
  const [ssousCompteOptions, setSSousCompteOptions] = useState<Option[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
    currentPage,
    totalPages,
  });

  const debounce = useMemo(() => {
    let timer: any;
    return (fn: () => void) => {
      clearTimeout(timer);
      timer = setTimeout(fn, 350);
    };
  }, []);

  // ---- Charger les données principales ----
  const loadDatas = async () => {
    setLoading(true);
    try {
      const res = await fetchItems<Rubrique>("/fetch_libelle", {
        page: currentPage,
        limit,
        query: search,
      });
      setDatas(res.data);
      setTotalPages(res.lastPage);
    } finally {
      setLoading(false);
    }
  };

  // ---- Charger les listes dépendantes ----
  const loadMouvements = async () => {
    const res = await fetchListItems("/fetch_typemouvement");
    setMouvementOptions(
      res.data.map((x: any) => ({ value: String(x.id), label: x.designation }))
    );
  };

  const loadComptes = async () => {
    const res = await fetchListItems("/fetch_compte2");
    setCompteOptions(
      res.data.map((x: any) => ({ value: String(x.id), label: x.nom_compte }))
    );
  };

  const loadSousComptes = async (refCompte: string | number) => {
    if (!refCompte) {
      setSousCompteOptions([]);
      return;
    }
    const res = await fetchListItems(`/fetch_souscompte_compte2/${refCompte}`);
    setSousCompteOptions(
      res.data.map((x: any) => ({ value: String(x.id), label: x.nom_souscompte }))
    );
  };

  const loadSSousComptes = async (refSousCompte: string | number) => {
    if (!refSousCompte) {
      setSSousCompteOptions([]);
      return;
    }
    const res = await fetchListItems(`/fetch_ssouscompte_sous2/${refSousCompte}`);
    setSSousCompteOptions(
      res.data.map((x: any) => ({ value: String(x.id), label: x.nom_ssouscompte }))
    );
  };

  // ---- Ajouter / Modifier ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designation || !formData.refMvt || !formData.refSscompte) {
      showErrorMessage("Veuillez remplir tous les champs requis !");
      return;
    }

    const user = getUser();
    const payload = {
      ...formData,
      id: formData.id ?? "",
      author: user.name ?? "Inconnu",
    };

    const route = isEditing
      ? `/update_libelle/${formData.id}`
      : "/insert_libelle";

    const res = await saveItem(route, payload);
    showSuccessMessage(res);
    setFormData({});
    setShowModal(false);
    setIsEditing(false);
    loadDatas();
  };

  // ---- Éditer ----
  const handleEdit = async (id: number) => {
    const res = await fetchSigleItem<Rubrique>("/fetch_single_libelle", id);
    const data = Array.isArray(res) && res.length ? res[0] : undefined;
    if (!data) {
      showErrorMessage("Rubrique introuvable !");
      return;
    }

    await loadSousComptes(data.refCompte ?? "");
    await loadSSousComptes(data.refSousCompte ?? "");

    setFormData(data);
    setIsEditing(true);
    setShowModal(true);
  };

  // ---- Supprimer ----
  const handleDelete = async (id: number) => {
    const confirm = await showConfirmationDialog({
      title: "Supprimer ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      confirmButtonText: "Oui, supprimer",
    });
    if (!confirm) return;
    const res = await removeItem("/delete_libelle", id);
    showSuccessMessage(res);
    loadDatas();
  };

  // ---- Modal ----
  const openModal = () => {
    setFormData({});
    setIsEditing(false);
    setSousCompteOptions([]);
    setSSousCompteOptions([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
  };

  // ---- Initialisation ----
  useEffect(() => {
    loadDatas();
    loadMouvements();
    loadComptes();
  }, [currentPage]);

  useEffect(() => {
    debounce(() => {
      setCurrentPage(1);
      loadDatas();
    });
  }, [search]);

  // ---- Rendu ----
  return (
    <div className="col-md-12">
      <h4>Rubriques Comptables OHADA</h4>

      <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

      {/* Barre de recherche */}
      <div className="d-flex justify-content-between mb-3">
        <div className="col-auto col-sm-6">
          <div className="input-group">
            <button className="btn btn-sm btn-primary me-1" onClick={loadDatas}>
              <i className="fas fa-sync" />
            </button>
            <input
              type="text"
              className="form-control"
              placeholder="Recherche…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <LoadingSpinner loading={loading} />
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={openModal}>
          <i className="fas fa-plus me-1" /> Ajouter
        </button>
      </div>

      {/* Tableau */}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Rubrique</th>
            <th>Type Mouvement</th>
            <th>Sous-Sous Compte</th>
            <th>N° SSCompte</th>
            <th>Auteur</th>
            <th>Date création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {datas.map((d) => (
            <tr key={d.id}>
              <td>{d.Compte}</td>
              <td>{d.TypeMouvement}</td>
              <td>{d.nom_ssouscompte}</td>
              <td>{d.numero_ssouscompte}</td>
              <td>{d.author}</td>
              <td>
                {formatDateFR(d.created_at || "")}{" "}
                {extractTime(d.created_at || "")}
              </td>
              <td>
                <button
                  className="btn btn-warning btn-circle btn-sm me-1"
                  onClick={() => handleEdit(Number(d.id))}
                >
                  <i className="fas fa-edit" />
                </button>
                <button
                  className="btn btn-danger btn-circle btn-sm"
                  onClick={() => handleDelete(Number(d.id))}
                >
                  <i className="fas fa-trash" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
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

      {/* Modal */}
      <Modal
        title={isEditing ? "Modifier Rubrique" : "Ajouter Rubrique"}
        show={showModal}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            label="Désignation Rubrique"
            name="designation"
            value={formData.designation ?? ""}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            required
            icon="fas fa-book"
          />

          <SelectPickerField
            label="Type Mouvement"
            name="refMvt"
            icon="fas fa-exchange-alt"
            value={formData.refMvt ? String(formData.refMvt) : ""}
            options={mouvementOptions}
            required
            onChange={(v) => setFormData({ ...formData, refMvt: v })}
          />

          <SelectPickerField
            label="Compte"
            name="refCompte"
            icon="fas fa-layer-group"
            value={formData.refCompte ? String(formData.refCompte) : ""}
            options={compteOptions}
            onChange={(v) => {
              setFormData({ ...formData, refCompte: v });
              loadSousComptes(v);
            }}
          />

          <SelectPickerField
            label="Sous-Compte"
            name="refSousCompte"
            icon="fas fa-sitemap"
            value={formData.refSousCompte ? String(formData.refSousCompte) : ""}
            options={sousCompteOptions}
            onChange={(v) => {
              setFormData({ ...formData, refSousCompte: v });
              loadSSousComptes(v);
            }}
          />

          <SelectPickerField
            label="Sous-Sous Compte"
            name="refSscompte"
            icon="fas fa-diagram-project"
            value={formData.refSscompte ? String(formData.refSscompte) : ""}
            options={ssousCompteOptions}
            required
            onChange={(v) => setFormData({ ...formData, refSscompte: v })}
          />

          <button className="btn btn-primary w-100 mt-2">
            {isEditing ? "Modifier" : "Ajouter"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
