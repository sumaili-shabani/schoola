import React, { useEffect, useState } from "react";
import { fetchItems, saveItem, removeItem, extractTime, formatDateFR, showConfirmationDialog, truncateText, fetchSigleItem, saveItemImageForm, fetchListItems, } from "../../api/callApi";
import { usePagination } from "../../hooks/usePagination";
import { LoaderAndError, Modal, Pagination, RichTextField, SelectPickerField, TextField } from "../../components";
import { fileUrl, showErrorMessage, showSuccessMessage, showWarningMessage } from "../../api/config";
import LoadingSpinner from "../../components/LoadingSpinner";
import TextAreaFild from "../../components/TextAreaField";
import ComboBoxField from "../../components/ComboBox";


interface User {
    id?: number;
    nomP?: string;
    emailP?: string;
    telephoneP?: string;
    sexeP?: string;
    date_naissanceP?: string;
    professionP?: string;
    adresseP?: string;
    telephoneWhatsappP?: string;

    password?: string;
    image?: string;
    logo?: string;
    active?: number;
    logoFile?: File;
    created_at?: string;
    updated_at?: string;

}
export default function ParentPage() {
    // declaration de variables
    const [datas, setDatas] = useState<User[]>([]);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const SexeOptions = [
        { value: 'M', label: 'Homme' },
        { value: 'F', label: 'Femme' },
    ];

    const [roles, setRoles] = useState([]);
    //fin declaration

    // declaration de la pagination
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
        currentPage,
        totalPages,
    });

    // chargement de la table
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<User>("/fetch_parent", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage); // ✅ correction ici
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // chargement de la table
    const loadRoleList = async () => {
        setLoading(true);
        try {
            const res = await fetchListItems('/fetch_all_role');
            // console.log(JSON.stringify(res.data));
            setRoles(res.data);

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadRoleList();
        loadDatas();
    }, [search, currentPage, limit]);


    // ✅ Ajout / Modification
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await saveItem("/insert_parent", formData);
            showSuccessMessage(res);
            loadDatas();
            handleCloseModal();

        } catch (error) {
            showWarningMessage(error);

        }

    };

    // ✅ Édition
    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const roles = await fetchSigleItem<User[]>("/fetch_single_parent", id);
            const data = roles && roles.length > 0 ? roles[0] : undefined;
            if (!data) {
                setLoading(false);
                setError("Parent introuvable.");
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
                const res = await removeItem("/delete_parent", id);
                setLoading(false);
                showSuccessMessage(res);
                loadDatas();


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


    const [showModalSiteLogo, setShowModalSiteLogo] = useState(false);

    /*
 *
 *==========================
 * Utilisation de l'image
 *==========================
 *
 */
    const handlEditImage = async (id: number) => {

        try {
            setLoading(true);
            const roles = await fetchSigleItem<User[]>("/fetch_single_parent", id);
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
            setShowModalSiteLogo(true);
            setLoading(false);

        } catch (error) {
            setLoading(false);
            showWarningMessage(error);
        }

    }
    const handleCloseModalImage = () => {
        setShowModalSiteLogo(false);
        setFormData({});
        setIsEditing(false);
    };
    // fin modal image

    const [preview, setPreview] = useState<string | null>(null);

    const handleInputChangeImage = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, files } = e.target as HTMLInputElement;

        if (name === 'logo' && files && files[0]) {
            const file = files[0]; // ✅ Déclaration correcte

            setFormData((prev) => ({
                ...prev,
                logoFile: file,
            }));

            setPreview(URL.createObjectURL(file)); // ✅ Utilisation correcte de `file`
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };





    const handleSubmitImage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.logoFile) {
            showErrorMessage("Veuillez sélectionner une image !");
            return;
        }

        // Préparer les données JSON à envoyer avec l'image
        const data = {
            agentId: formData.id,
            id: formData.id,
        };

        // Créer un FormData
        const formDataToSend = new FormData();
        formDataToSend.append("data", JSON.stringify(data)); // ✅ correspond à $_POST['data']
        formDataToSend.append("image", formData.logoFile);   // ✅ correspond à $request->image
        formDataToSend.append("logo", formData.logoFile);   // ✅ correspond à $request->image

        try {
            const res = await saveItemImageForm("/edit_photo_parent", formDataToSend);
            showSuccessMessage(res.data);
            loadDatas();
        } catch (error: any) {
            showErrorMessage("Une erreur est survenue lors de l'envoi du fichier.");
            console.error(error);
        }

        handleCloseModalImage();
    };

    /*
    *
    *==========================
    * Utilisation de l'image
    *==========================
    *
    */






    return (
        <div className="col-md-12 mt-0">
            <h4 className="mb-3">Gestion de compte parent</h4>
            {/* loading component */}
            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />
            {/* fin loading component */}
            {/* modal image site */}
            <Modal title={isEditing ? "Modifier l'image" : "Ajouter son image"}
                show={showModalSiteLogo}
                onClose={handleCloseModalImage}
                dimension="modal-md">
                <form onSubmit={handleSubmitImage}>
                    <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                        {/* formulaire */}
                        <div className="row">
                            <div className="col-md-12 mb-2">

                                <input
                                    type="file"
                                    name="logo"
                                    id="logo"
                                    className='form-control'
                                    onChange={handleInputChangeImage}
                                    required
                                />
                            </div>

                            <div className="col-md-12">
                                {/* affichage de l'image selectionnée */}
                                <img src={preview || fileUrl + '/images/' + formData.image} alt="image sélectionnée" className='img img-thumbnail col-md-6' width={50} height={50} />


                            </div>
                        </div>
                        {/* fin formulaire */}
                        {/* boutton */}
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-end mt-2">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {isEditing ? 'Modifier' : 'Ajouter'}

                                </button>
                            </div>
                        </div>
                        {/* fin boutton */}
                    </div>


                </form>
            </Modal>
            {/* fin modal image site */}




            {/* modal component */}
            <Modal
                title={isEditing ? 'Modifier les informations' : 'Ajouter un parent'}
                show={showModal}
                onClose={handleCloseModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                        <div className="row">
                            <div className="col-md-6">
                                <TextField
                                    name="nomP"
                                    value={formData.nomP || ''}
                                    onChange={handleInputChange}
                                    placeholder="Nom complet"
                                    icon="fas fa-user-tag"
                                    label="Nom complet"
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    type='email'
                                    name="emailP"
                                    value={formData.emailP || ''}
                                    onChange={handleInputChange}
                                    label="Adresse Mail"
                                    placeholder="Adresse Mail"
                                    icon="fas fa-envelope"

                                />
                            </div>


                            <div className="col-md-6">
                                <TextField
                                    name="telephoneP"
                                    value={formData.telephoneP || ''}
                                    onChange={handleInputChange}
                                    label="N° de téléphone principal"
                                    placeholder="N° de téléphone principal"
                                    icon="fas fa-phone"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <TextField
                                    name="telephoneWhatsappP"
                                    value={formData.telephoneWhatsappP || ''}
                                    onChange={handleInputChange}
                                    label="N° de téléphone whatsapp"
                                    placeholder="N° de téléphone whatsapp"
                                    icon="fab fa-whatsapp"

                                />
                            </div>


                            <div className="col-md-6">
                                <SelectPickerField
                                    name="sexeP"
                                    value={formData.sexeP || ''}
                                    onChange={(v) => setFormData({ ...formData, sexeP: v })}
                                    placeholder="Sexe"
                                    icon="fas fa-genderless"
                                    label="Sexe"
                                    options={SexeOptions}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    name="adresseP"
                                    value={formData.adresseP || ''}
                                    onChange={handleInputChange}
                                    label="Adresse"
                                    placeholder="Adresse"
                                    icon="fas fa-map"

                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    name="professionP"
                                    value={formData.professionP || ''}
                                    onChange={handleInputChange}
                                    label="Profession"
                                    placeholder="Profession"


                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    type="date"
                                    name="date_naissanceP"
                                    value={formData.date_naissanceP || ''}
                                    onChange={handleInputChange}
                                    label="Date de naissance"
                                    placeholder="Date de naissance"
                                    icon="fas fa-calendar"

                                />
                            </div>

                            {!isEditing && (<div className="col-md-12">
                                <TextField
                                    name="password"
                                    value={formData.password || ''}
                                    onChange={handleInputChange}
                                    label="Mot de passe"
                                    placeholder="Mot de passe"
                                    icon="fas fa-lock"
                                    required
                                />
                            </div>)}



                            {/* <div className="col-md-12">
                                <TextAreaFild
                                name="description"
                                value={formData.description || ''}
                                onChange={handleInputChange}
                                placeholder="Description"
                                icon="fas fa-text-width"
                                label="Description du site"
                                required
                                />
                            </div> */}



                        </div>

                    </div>
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
                            onClick={() => loadDatas()} // recharge
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


            {/* table des données */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Avatar</th>
                                    <th>Nom</th>
                                    <th>Sexe</th>
                                    <th>Email</th>
                                    <th>Téléphone principal</th>
                                    <th>Profession</th>
                                    <th>Date de création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((item) => (
                                        <tr key={item.id}>
                                            <td><img src={fileUrl + '/images/' + item.image} alt={item.image} width={40} height={40} className='img rounded-circle' /></td>
                                            <td>{truncateText(item.nomP ?? '', 40)}</td>
                                            <td>{truncateText(item.sexeP ?? '', 40)}</td>
                                            <td>
                                                <a href={'mailto:' + item.emailP} className='text-primary small'><i className='fas fa-envelope fa-sm me-1'></i>{truncateText(item.emailP ?? '', 20)}</a>

                                            </td>
                                            <td>
                                                <a href={'tel:' + item.telephoneP} className='text-primary small'><i className='fas fa-phone fa-sm me-1'></i> {truncateText(item.telephoneP ?? '', 20)}</a>
                                            </td>

                                            <td>
                                                {item.professionP}
                                            </td>


                                            <td>{formatDateFR(item.created_at ?? '')} {extractTime(item.created_at ?? '')}</td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-circle btn-sm me-1"
                                                    onClick={() => handlEditImage(item.id!)}
                                                >
                                                    <i className="fas fa-camera"></i>
                                                </button>

                                                <button
                                                    className="btn btn-warning btn-circle btn-sm me-1"
                                                    onClick={() => handleEdit(item.id!)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-circle btn-sm"
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
                    </div>
                </div>
            </div>
            {/* fin table des données */}
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
    )
}
