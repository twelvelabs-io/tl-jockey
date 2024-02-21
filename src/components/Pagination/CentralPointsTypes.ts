export interface CentralPointsProps {
    currentPage: number;
    totalPages: number;
    handlePageChange: (pageNumber: number) => void;
}