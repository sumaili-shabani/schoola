export default function AppLoader() {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
            <div className="spinner-border text-primary mb-3" style={{ width: "4rem", height: "4rem" }} role="status">
                <span className="visually-hidden">Chargement...</span>
            </div>
            <h4 className="fw-bold text-dark mb-0">Dream of DRC</h4>
            <small className="text-muted">powered by <span className="text-primary">Schoola</span></small>
        </div>
    );
}
