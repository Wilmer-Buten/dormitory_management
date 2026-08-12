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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
    <div className="bg-white p-6 rounded-2xl shadow-popover max-w-md w-full animate-slide-up">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <p className="mb-5 text-sm text-slate-600">
        {description}
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={handleCancelButton}
          className="btn-secondary btn-md text-sm"
        >
          {t.common.cancel}
        </button>
        <button onClick={handleConfirmButton} className="btn-primary btn-md text-sm">
          {confirmButtonText}
        </button>
      </div>
    </div>
  </div>,
  document.body
  )
}

export default ModalComponent