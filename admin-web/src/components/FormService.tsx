/* ============================
   FORMULAIRE D'AJOUT / MODIFICATION DE SERVICE
============================ */
import { FC, useState, FormEvent } from 'react'

/* ============================
   TYPES
============================ */
interface FormServiceProps {
  initialData?: {
    name: string
    price: number
    description: string
  }
  onSubmit: (data: { name: string; price: number; description: string }) => void
}

/* ============================
   COMPOSANT
============================ */
export const FormService: FC<FormServiceProps> = ({ initialData, onSubmit }) => {
  const [name, setName] = useState(initialData?.name || '')
  const [price, setPrice] = useState(initialData?.price || 0)
  const [description, setDescription] = useState(initialData?.description || '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, price, description })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      {/* Nom du service */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Nom du service</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Prix */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Prix</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
