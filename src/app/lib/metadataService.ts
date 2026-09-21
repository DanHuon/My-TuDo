export interface MetadataItem {
  id: string
  title: string
  originalTitle?: string | null
  year?: string | null
  synopsis?: string | null
  posterUrl?: string | null
  category: 'movie' | 'series' | 'anime' | 'manga' | 'book' | 'game'
  startDate?: string | null
  totalEpisodes?: number | null
  totalSeasons?: number | null
}

export interface MetadataSearchResult {
  items: MetadataItem[]
  fromCache: boolean
  rateLimited?: boolean
  error?: string | null
}

// In-memory cache across the application session
const metadataCacheMap = new Map<string, MetadataItem[]>()

export async function searchMetadata(
  query: string,
  category: 'movie' | 'series' | 'anime' | 'manga' | 'book' | 'game'
): Promise<MetadataSearchResult> {
  const cleanQuery = query.trim()
  if (!cleanQuery) {
    return { items: [], fromCache: false }
  }

  const cacheKey = `${category}:${cleanQuery.toLowerCase()}`
  if (metadataCacheMap.has(cacheKey)) {
    const cached = metadataCacheMap.get(cacheKey) || []
    return { items: cached, fromCache: true }
  }

  try {
    let items: MetadataItem[] = []

    if (category === 'movie' || category === 'series') {
      const res = await fetch(
        `/api/metadata/tmdb?query=${encodeURIComponent(cleanQuery)}&type=${category}`
      )
      if (res.status === 429) {
        return { items: [], fromCache: false, rateLimited: true, error: 'Limite de requisições atingido no TMDB. Tente novamente mais tarde.' }
      }
      const data = await res.json()
      if (!res.ok) {
        return { items: [], fromCache: false, error: data.error || 'Falha ao buscar no TMDB' }
      }
      items = data.results || []
    } else if (category === 'game') {
      const res = await fetch(
        `/api/metadata/games?query=${encodeURIComponent(cleanQuery)}`
      )
      if (res.status === 429) {
        return { items: [], fromCache: false, rateLimited: true, error: 'Limite de requisições atingido no RAWG. Tente novamente mais tarde.' }
      }
      const data = await res.json()
      if (!res.ok) {
        return { items: [], fromCache: false, error: data.error || 'Falha ao buscar no RAWG' }
      }
      items = data.results || []
    } else if (category === 'anime' || category === 'manga') {
      const endpoint = category === 'anime' ? 'anime' : 'manga'
      const url = `https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(cleanQuery)}&limit=5&sfw=true`
      
      const res = await fetch(url)
      if (res.status === 429) {
        return { items: [], fromCache: false, rateLimited: true, error: 'Limite de requisições atingido no Jikan (MyAnimeList). Tente novamente mais tarde.' }
      }
      if (!res.ok) {
        return { items: [], fromCache: false, error: `Falha ao consultar ${category} no Jikan` }
      }
      const data = await res.json()
      const rawList = Array.isArray(data.data) ? data.data.slice(0, 5) : []

      items = rawList.map((item: any) => {
        const title = item.title_portuguese || item.title || item.title_english || 'Sem título'
        const originalTitle = item.title_japanese || item.title || null
        let dateStr: string | null = null
        if (category === 'anime' && item.aired?.from) {
          dateStr = item.aired.from.split('T')[0]
        } else if (category === 'manga' && item.published?.from) {
          dateStr = item.published.from.split('T')[0]
        }
        const year = item.year ? String(item.year) : dateStr ? dateStr.split('-')[0] : null
        const posterUrl = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null
        const episodesCount = category === 'anime' ? item.episodes : item.chapters

        return {
          id: `jikan-${item.mal_id}`,
          title,
          originalTitle: originalTitle !== title ? originalTitle : null,
          year,
          startDate: dateStr,
          synopsis: item.synopsis || null,
          posterUrl,
          category,
          totalEpisodes: episodesCount || null,
          totalSeasons: null,
        }
      })
    } else if (category === 'book') {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=5`
      const res = await fetch(url)
      if (res.status === 429) {
        return { items: [], fromCache: false, rateLimited: true, error: 'Limite de requisições atingido no Google Books. Tente novamente mais tarde.' }
      }
      if (!res.ok) {
        return { items: [], fromCache: false, error: 'Falha ao buscar livro no Google Books' }
      }
      const data = await res.json()
      const rawList = Array.isArray(data.items) ? data.items.slice(0, 5) : []

      items = rawList.map((item: any) => {
        const vol = item.volumeInfo || {}
        const authors = Array.isArray(vol.authors) ? vol.authors.join(', ') : null
        const dateStr = vol.publishedDate || null
        const year = dateStr ? dateStr.split('-')[0] : null
        let posterUrl = vol.imageLinks?.thumbnail || vol.imageLinks?.smallThumbnail || null
        if (posterUrl && posterUrl.startsWith('http://')) {
          posterUrl = posterUrl.replace('http://', 'https://')
        }

        return {
          id: `gbooks-${item.id}`,
          title: vol.title || 'Sem título',
          originalTitle: authors ? `Autor(es): ${authors}` : null,
          year,
          startDate: dateStr,
          synopsis: vol.description || null,
          posterUrl,
          category: 'book',
          totalEpisodes: vol.pageCount || null,
          totalSeasons: null,
        }
      })
    }

    if (items.length > 0) {
      metadataCacheMap.set(cacheKey, items)
    }

    return { items, fromCache: false }
  } catch (err: any) {
    console.error('Metadata search exception:', err)
    return { items: [], fromCache: false, error: 'Falha de conexão ao buscar metadados.' }
  }
}
