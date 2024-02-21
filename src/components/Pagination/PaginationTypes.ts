export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    showArrows: boolean;
    handlePageChange: (newPage: number) => void;
}