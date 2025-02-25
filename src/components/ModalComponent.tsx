import React from 'react'
import ReactDOM from 'react-dom'
import { useStore } from "../store/useStore"

interface ModalComponentProps {
  title: string;
  description: string;
  confirmButtonText: string;
  handleConfirmButton: () => void;
  handleCancelButton: () => void;
}

const ModalComponent: React.FC<ModalComponentProps> = ({
    title,
    description,
    confirmButtonText,
    handleConfirmButton,
    handleCancelButton
  }) => {
    const { getTranslation } = useStore();
    const t = getTranslation();
    return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
    <div className="bg-white p-6 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="mb-4">
        {description}
      </p>
      <div className="flex justify-end gap-4">
        <button
          onClick={handleCancelButton}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          {t.common.cancel}
        </button>
        <button onClick={handleConfirmButton} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {confirmButtonText}
        </button>
      </div>
    </div>
  </div>,
  document.body
  )
}

export default ModalComponent