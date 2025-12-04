/* ============================
   CLIENT API CENTRALISÉ SIDO (CORRIGÉ)
   - Résout les erreurs TypeScript liées à HeadersInit
   - Construit proprement les headers sans valeurs undefined
   - Gestion des erreurs et typage clair
============================ */

export interface ApiError {
  status: number
  message: string
  details?: any
}

/* ============================
   CONFIG / ENV
============================ */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:5000/api' // <-- adapte selon ton backend

/* ============================
   GESTION TOKEN (JWT)
   Retourne le token stocké côté client (localStorage)
============================ */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

/* ============================
   UTILE : CONSTRUIRE DES HEADERS PROPRES
   - Accepte options.headers (HeadersInit) et les fusionne
   - N'ajoute pas d'entrées avec valeur undefined
============================ */
function buildHeaders(optionsHeaders?: HeadersInit): Headers {
  const headers = new Headers()

  // 1) header par défaut
  headers.set('Content-Type', 'application/json')

  // 2) token si présent
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // 3) fusionner options.headers (s'il y en a)
  if (optionsHeaders) {
    // optionsHeaders peut être Headers, string[][], Record<string,string>
    if (optionsHeaders instanceof Headers) {
      optionsHeaders.forEach((value, key) => {
        if (value !== undefined) headers.set(key, value)
      })
    } else if (Array.isArray(optionsHeaders)) {
      // Array of tuples
      for (const [key, value] of optionsHeaders) {
        if (value !== undefined) headers.set(key, value)
      }
    } else {
      // Record<string, string> (probablement)
      for (const key of Object.keys(optionsHeaders)) {
        // @ts-ignore -- we accept that optionsHeaders[key] est string | undefined
        const value = (optionsHeaders as Record<string, any>)[key]
        if (value !== undefined && value !== null) {
          headers.set(key, String(value))
        }
      }
    }
  }

  return headers
}

/* ============================
   PARSER SÉCURISÉ
============================ */
async function safeParse(response: Response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    // si ce n'est pas du JSON, renvoyer le texte brut
    return text
  }
}

/* ============================
   FONCTION GÉNÉRIQUE DE REQUÊTE
============================ */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Normaliser endpoint : s'assurer qu'il commence par '/' si BASE_URL a un /api
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const headers = buildHeaders(options.headers)

  const response = await fetch(`${BASE_URL}${normalizedEndpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const details = await safeParse(response)
    const error: ApiError = {
      status: response.status,
      message: response.statusText || 'Erreur API',
      details
    }
    // log pour dev
    // eslint-disable-next-line no-console
    console.error('API ERROR:', error)
    throw error
  }

  return safeParse(response)
}

/* ============================
   MÉTHODES HTTP
============================ */
export const apiClient = {
  get: <T = any>(endpoint: string, options?: { params?: Record<string, any> }) => {
    let url = endpoint
    if (options?.params) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      }
      url += `?${params.toString()}`
    }
    return request<T>(url, { method: 'GET' })
  },
  post: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),
  delete: <T = any>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' })
}

/* ============================
   EXEMPLES D'UTILISATION (commentés)
============================ */
// const clients = await apiClient.get<Client[]>('/clients')
// const created = await apiClient.post('/services', { name: 'X', price: 1000 })

export default apiClient
