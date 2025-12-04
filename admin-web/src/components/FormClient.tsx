/* ============================
   FORMULAIRE D'AJOUT / MODIFICATION DE CLIENT
============================ */
import { FC, useState, FormEvent } from 'react'

/* ============================
   TYPES
============================ */
interface FormClientProps {
  initialData?: {
    name: string
    email: string
    phone: string
  }
  onSubmit: (data: { name: string; email: string; phone: string }) => void
}

/* ============================
   COMPOSANT
============================ */
export const FormClient: FC<FormClientProps> = ({ initialData, onSubmit }) => {
  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [phone, setPhone] = useState(initialData?.phone || '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, email, phone })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      {/* Nom */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Téléphone */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Téléphone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Enregistrer
      </button>
    </form>
  )
}
