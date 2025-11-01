// src/components/Pagination.tsx

import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    paginationRange: (number | string)[];
    isCurrentPage: (page: number) => boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
    onPageChange: (page: number) => void;
    textCounter?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    paginationRange,
    isCurrentPage,
    isFirstPage,
    isLastPage,
    onPageChange,
    textCounter=false
}) => {
    return (
        <div className="d-flex justify-content-between mt-3">
            {textCounter ? <span >
                Page {currentPage} sur {totalPages}
            </span> :''}
           
            <nav>
                <ul className="pagination">
                    <li className={`page-item ${isFirstPage ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={isFirstPage}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    </li>

                    {paginationRange.map((page, index) =>
                        typeof page === 'number' ? (
                            <li
                                key={index}
                                className={`page-item ${isCurrentPage(page) ? 'active' : ''}`}
                            >
                                <button className="page-link" onClick={() => onPageChange(page)}>
                                    {page}
                                </button>
                            </li>
                        ) : (
                            <li key={index} className="page-item disabled">
                                <span className="page-link">...</span>
                            </li>
                        )
                    )}

                    <li className={`page-item ${isLastPage ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={isLastPage}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;
