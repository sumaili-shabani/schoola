import React, { useEffect, useState } from "react";
import { fetchItems, saveItem, removeItem, extractTime, formatDateFR, showConfirmationDialog, truncateText, fetchSigleItem, } from "../../api/callApi";
import { usePagination } from "../../hooks/usePagination";
import { LoaderAndError, Modal, Pagination, TextField } from "../../components";
import { showErrorMessage, showSuccessMessage, showWarningMessage } from "../../api/config";
import LoadingSpinner from "../../components/LoadingSpinner";



interface Role {
  id?: number;
  nom: string;
  created_at?: string;
  updated_at?: string;
}

export default function RolePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<Partial<Role>>({});
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // declaration de la pagination
  const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
    currentPage,
    totalPages,
  });

  // chargement de la table
  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await fetchItems<Role>("/fetch_role", {
        page: currentPage,
        limit,
        q: search,
      });
      setRoles(res.data);
      setTotalPages(res.lastPage); // ✅ correction ici
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [search, currentPage, limit]);


  // ✅ Ajout / Modification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveItem("/insert_role", formData);
      showSuccessMessage(res);
      loadRoles();
      handleCloseModal();

    } catch (error) {
      showWarningMessage(error);

    }

  };

  // ✅ Édition
  const handleEdit = async (id: number) => {
    try {
setLoading(true);
      const roles = await fetchSigleItem<Role[]>("/fetch_single_role", id);
      const data = roles && roles.length > 0 ? roles[0] : undefined;
      if (!data) {
        setLoading(false);
        setError("Rôle introuvable.");
        setLoading(false);
        return;
      }
      // console.log(data);
      setFormData(data);
      setIsEditing(true);
      setShowModal(true);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      showWarningMessage(error);
    }
  };

  // ✅ Suppression
  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmationDialog({
      title: "Supprimer cette donnée ?",
      text: "Cette action est irréversible.",
      confirmButtonText: "Oui, supprimer",
      icon: "warning",
    });
    if (confirmed) {
      try {
        setLoading(true);
        const res = await removeItem("/delete_role", id);
        setLoading(false);
        showSuccessMessage(res);
        loadRoles();
        

      } catch (error) {
        setLoading(false);
        showErrorMessage(error);
      }
    }
  };

  //ouverture et fer;eture de modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({});
    setIsEditing(false);
  };

  // changement des textes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container mt-0">

      <h4 className="mb-3">Gestion de privilège</h4>


      {/* loading component */}
      <LoaderAndError
        loading={loading}
        error={error}
        onClearError={() => setError(null)}
      />

      {/* modal component */}
      <Modal
        title={isEditing ? 'Modifier le rôle' : 'Ajouter un rôle'}
        show={showModal}
        onClose={handleCloseModal}
        dimension="modal-sm"
      >
        <form onSubmit={handleSubmit}>
          <TextField
            name="nom"
            value={formData.nom || ''}
            onChange={handleInputChange}
            placeholder="Nom du rôle"
            icon="fas fa-user-tag"
            label="Nom du rôle"
            required
          />
          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {isEditing ? 'Modifier' : 'Ajouter'}

            </button>
          </div>
        </form>
      </Modal>
      {/* fin modal component */}

      {/* entete de recherche */}
      <div className="d-flex justify-content-between mb-3">
        <div className="col-auto col-sm-4">
          <div className="input-group mb-2">
            <button
              type="button"
              className="btn btn-sm btn-primary me-1"
              onClick={() => loadRoles()} // recharge
              id='btn-search'
            >
              <i className="fas fa-sync"></i>
            </button>
            <input
              type="text"
              className="form-control me-2"
              placeholder="Recherche..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <LoadingSpinner loading={loading} />
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-1"></i> Ajouter
        </button>
      </div>
      {/* fin entete de recherche */}

      <div className="card">
        <div className="card-body">

          {/* table des données */}
          <div className="table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      Aucun rôle trouvé
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id}>
                      <td>#{role.id}</td>
                      <td>{truncateText(role.nom, 20)}</td>
                      <td>{formatDateFR(role.created_at ?? '')} {extractTime(role.created_at ?? '')}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-circle btn-sm me-1"
                          onClick={() => handleEdit(role.id!)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-circle btn-sm"
                          onClick={() => handleDelete(role.id!)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* fin table des données */}


        </div>
        
      </div>

      {/* pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginationRange={paginationRange}
        isCurrentPage={isCurrentPage}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        onPageChange={setCurrentPage}
        textCounter={true}
      />
      {/* fin pagination */}

    </div>
  );
}
