import feather from "feather-icons";

export function initAppKit() {
    // 🔹 1. Attendre que le DOM soit prêt
    const waitForElement = (selector: string, callback: (el: HTMLElement) => void) => {
        const element = document.querySelector(selector);
        if (element) {
            callback(element as HTMLElement);
        } else {
            // Réessaie après 200ms (utile dans React où le DOM change)
            setTimeout(() => waitForElement(selector, callback), 200);
        }
    };

    // 🔹 2. Initialiser Feather Icons
    try {
        feather.replace();
    } catch (err) {
        console.warn("Feather not loaded yet");
    }

    // 🔹 3. Activer le bouton toggle sidebar
    waitForElement(".js-sidebar-toggle", (toggleBtn) => {
        const sidebar = document.querySelector(".js-sidebar");

        if (!sidebar) {
            console.warn("Sidebar not found in DOM");
            return;
        }

        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sidebar.classList.toggle("collapsed");
        });
    });

    // 🔹 4. Fermer le menu mobile si on clique à l’extérieur
    document.addEventListener("click", (e) => {
        const sidebar = document.querySelector(".js-sidebar");
        const toggle = document.querySelector(".js-sidebar-toggle");

        if (!sidebar || !sidebar.classList.contains("collapsed")) return;
        const target = e.target as HTMLElement;

        if (!target.closest(".js-sidebar") && !target.closest(".js-sidebar-toggle")) {
            sidebar.classList.remove("collapsed");
        }
    });
}
