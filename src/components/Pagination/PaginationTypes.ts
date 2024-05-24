export interface PaginationProps {
    chosenIndex: number;
    totalIndexes: number;
    handlePageChange: (newPage: number, totalIndexes: number) => void;
}