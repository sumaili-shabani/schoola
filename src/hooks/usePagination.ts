import { useMemo } from 'react';

type PaginationRange = (number | string)[];

interface UsePaginationProps {
    currentPage: number;
    totalPages: number;
    maxButtons?: number;
}

export const usePagination = ({
    currentPage,
    totalPages,
    maxButtons = 7, // nombre max de boutons visibles dans la pagination
}: UsePaginationProps) => {
    const paginationRange: PaginationRange = useMemo(() => {
        const halfMax = Math.floor(maxButtons / 2);

        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= halfMax + 1) {
            const start = Array.from({ length: maxButtons - 2 }, (_, i) => i + 1);
            return [...start, '...', totalPages];
        }

        if (currentPage >= totalPages - halfMax) {
            const end = Array.from({ length: maxButtons - 2 }, (_, i) => totalPages - (maxButtons - 3) + i);
            return [1, '...', ...end];
        }

        const middle = Array.from(
            { length: maxButtons - 4 },
            (_, i) => currentPage - Math.floor((maxButtons - 4) / 2) + i
        );

        return [1, '...', ...middle, '...', totalPages];
    }, [currentPage, totalPages, maxButtons]);

    const isCurrentPage = (page: number) => page === currentPage;
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return {
        paginationRange,
        isCurrentPage,
        isFirstPage,
        isLastPage,
    };
};