/* ============================
   BOUTON PERSONNALISÉ
============================ */
import { FC, ButtonHTMLAttributes } from 'react'

/* ============================
   TYPES
============================ */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

/* ============================
   COMPOSANT
============================ */
export const Button: FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const baseClasses =
    'px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition'

  const variantClasses =
    variant === 'primary'
      ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'

  return <button className={`${baseClasses} ${variantClasses} ${className}`} {...props} />
}
