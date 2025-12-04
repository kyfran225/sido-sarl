/* ============================
   COMPOSANT BOTTOM SHEET
============================ */
import { FC, ReactNode } from 'react'

/* ============================
   TYPES
============================ */
interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

/* ============================
   COMPOSANT
============================ */
export const BottomSheet: FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50"
          onClick={onClose}
        >
          <div
            className="w-full md:w-1/2 bg-white rounded-t-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </>
  )
}
