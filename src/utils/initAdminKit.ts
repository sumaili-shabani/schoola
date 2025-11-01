export function initAdminKit() {
    // Attendre que AdminKit soit chargé
    const tryInit = () => {
        const app = (window as any).App;
        if (app && typeof app.init === "function") {
            console.log("✅ AdminKit initialized in React");
            app.init();
            return true;
        }
        return false;
    };

    // Essayer plusieurs fois (React monte le DOM un peu après)
    let tries = 0;
    const interval = setInterval(() => {
        tries++;
        if (tryInit() || tries > 10) clearInterval(interval);
    }, 300);
}
