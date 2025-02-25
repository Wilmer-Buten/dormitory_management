import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  
  // Función para generar el rango de páginas a mostrar
  const getPageRange = () => {
    const delta = 2 // Número de páginas a mostrar antes y después de la página actual
    const range = []
    const rangeWithDots = []

    // Siempre mostrar la primera página
    range.push(1)

    // Calcular el rango de páginas alrededor de la página actual
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i)
      }
    }

    // Siempre mostrar la última página si hay más de una página
    if (totalPages > 1) {
      range.push(totalPages)
    }

    // Agregar los números de página y los puntos suspensivos
    let l
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push("...")
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  return (
    <nav className="flex justify-center items-center mt-8 overflow-x-auto max-w-full py-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        {getPageRange().map((pageNumber, index) =>
          pageNumber === "..." ? (
            <span key={`ellipsis-${index}`} className="px-4 py-2">
              {pageNumber}
            </span>
          ) : (
            <button
              key={`page-${pageNumber}`}
              onClick={() => onPageChange(Number(pageNumber))}
              className={`px-4 py-2 rounded-md ${
                currentPage === pageNumber
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pageNumber}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </nav>
  )
}

