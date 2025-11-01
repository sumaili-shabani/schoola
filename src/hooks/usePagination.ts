import { useState, useMemo } from "react";

/**
 * 📄 Hook de pagination universelle
 * - Fonctionne avec données locales OU backend paginé
 * - Renvoie les éléments de la page courante et les infos de navigation
 */

export const usePagination = <T>(data: T[], itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return data.slice(start, end);
    }, [data, currentPage, itemsPerPage]);

    const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
    const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return {
        currentData,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        goToPage,
        setCurrentPage,
    };
};

export default usePagination;
