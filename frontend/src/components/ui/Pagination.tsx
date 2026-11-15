import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemLabel = 'records',
  className = '',
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) {
    return null;
  }

  // Generate numbered array with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  // Calculate showing item range
  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem =
    pageSize && totalItems
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 bg-white border border-[#e4eaf0] rounded-xl text-xs ${className}`}
    >
      {/* Item counts */}
      <div className="text-[#627086] text-[11px] sm:text-xs">
        {totalItems !== undefined && startItem && endItem ? (
          <span>
            Showing <strong className="text-[#102641] font-bold">{startItem}</strong> to{' '}
            <strong className="text-[#102641] font-bold">{endItem}</strong> of{' '}
            <strong className="text-[#102641] font-bold">{totalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Showing page <strong className="text-[#102641] font-bold">{currentPage}</strong> of{' '}
            <strong className="text-[#102641] font-bold">{Math.max(1, totalPages)}</strong>
          </span>
        )}
      </div>

      {/* Numbered Controls */}
      <nav aria-label="Pagination Navigation" className="flex items-center gap-1 select-none flex-wrap justify-center sm:justify-end">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e4eaf0] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold text-xs cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers: Adaptive for mobile screens */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-slate-400 font-bold text-xs select-none"
                >
                  …
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;
            const isFarFromCurrent =
              Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#087b63] text-white shadow-xs'
                    : 'bg-white border border-[#e4eaf0] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                } ${isFarFromCurrent ? 'hidden sm:flex' : 'flex'}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e4eaf0] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold text-xs cursor-pointer"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
};
