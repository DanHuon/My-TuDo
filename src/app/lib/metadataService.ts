export interface MetadataItem {
  id: string
  title: string
  originalTitle?: string | null
  year?: string | null
  synopsis?: string | null
  posterUrl?: string | null
  category: 'movie' | 'series' | 'anime' | 'manga' | 'book' | 'game'
  releaseDate?: string | null
  releaseYear?: string | null
  startDate?: string | null
  totalEpisodes?: number | null
  totalSeasons?: number | null
  maxEpisodes?: number | null
  maxSeasons?: number | null
  metadataExtras?: Record<string, any>
}

export interface MetadataSearchResult {
  items: MetadataItem[]
  fromCache: boolean
  rateLimited?: boolean
  error?: string | null
}

function cleanHtmlDescription(str?: string | null): string | null {
  if (!str) return null
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
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
      try {
        const anilistType = category === 'anime' ? 'ANIME' : 'MANGA'
        const graphQLQuery = `
          query ($search: String, $type: MediaType) {
            Page(page: 1, perPage: 5) {
              media(search: $search, type: $type) {
                id
                title { romaji english native }
                description(asHtml: false)
                format
                status
                startDate { year month day }
                endDate { year month day }
                chapters
                volumes
                episodes
                duration
                genres
                averageScore
                coverImage { extraLarge large medium }
                bannerImage
                studios(isMain: true) { nodes { name } }
                staff(perPage: 3) {
                  edges {
                    role
                    node { name { full } }
                  }
                }
              }
            }
          }
        `

        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: graphQLQuery,
            variables: { search: cleanQuery, type: anilistType },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const rawList = data.data?.Page?.media || []

          items = rawList.map((media: any) => {
            const title = media.title?.english || media.title?.romaji || media.title?.native || 'Sem título'
            const originalTitle = media.title?.native || (media.title?.english && media.title?.romaji ? media.title.romaji : null)
            const year = media.startDate?.year ? String(media.startDate.year) : null
            const month = media.startDate?.month ? String(media.startDate.month).padStart(2, '0') : '01'
            const day = media.startDate?.day ? String(media.startDate.day).padStart(2, '0') : '01'
            const releaseDate = year ? `${year}-${month}-${day}` : null

            const episodesCount = category === 'anime' ? media.episodes : media.chapters
            const author = media.staff?.edges?.find((e: any) =>
              e.role?.toLowerCase().includes('story') || e.role?.toLowerCase().includes('art')
            )?.node?.name?.full || media.staff?.edges?.[0]?.node?.name?.full || null

            const metadataExtras: Record<string, any> = {
              format: media.format || null,
              status: media.status || null, // RELEASING, FINISHED, etc.
              genres: media.genres || [],
              averageScore: media.averageScore ? media.averageScore / 10 : null,
              bannerImage: media.bannerImage || null,
              ...(category === 'anime' ? {
                studio: media.studios?.nodes?.[0]?.name || null,
                duration: media.duration || null,
              } : {
                author,
                volumes: media.volumes || null,
              })
            }

            return {
              id: `anilist-${media.id}`,
              title,
              originalTitle: originalTitle !== title ? originalTitle : null,
              year,
              releaseYear: year,
              releaseDate,
              startDate: null,
              synopsis: cleanHtmlDescription(media.description),
              posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || null,
              category,
              totalEpisodes: episodesCount || null,
              totalSeasons: null,
              maxEpisodes: episodesCount || null,
              maxSeasons: null,
              metadataExtras,
            }
          })
        }
      } catch (aniErr) {
        console.error('AniList search error:', aniErr)
      }

      // Fallback for anime to TMDB series if AniList yields 0 results
      if (category === 'anime' && items.length === 0) {
        try {
          const res = await fetch(
            `/api/metadata/tmdb?query=${encodeURIComponent(cleanQuery)}&type=series`
          )
          if (res.ok) {
            const data = await res.json()
            items = (data.results || []).map((it: MetadataItem) => ({
              ...it,
              category: 'anime' as const,
              startDate: null,
            }))
          }
        } catch {
          // Silent fallback
        }
      }
    } else if (category === 'book') {
      try {
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=5${googleApiKey ? `&key=${googleApiKey}` : ''}`
        const res = await fetch(url)
        if (res.ok) {
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

            const metadataExtras: Record<string, any> = {
              authors: Array.isArray(vol.authors) ? vol.authors : (authors ? [authors] : []),
              publisher: vol.publisher || null,
              pageCount: vol.pageCount || null,
              isbn: vol.industryIdentifiers?.[0]?.identifier || null,
              genres: Array.isArray(vol.categories) ? vol.categories : [],
            }

            return {
              id: `gbooks-${item.id}`,
              title: vol.title || 'Sem título',
              originalTitle: authors ? `Autor(es): ${authors}` : null,
              year,
              releaseYear: year,
              releaseDate: dateStr,
              startDate: null,
              synopsis: cleanHtmlDescription(vol.description),
              posterUrl,
              category: 'book',
              totalEpisodes: vol.pageCount || null,
              totalSeasons: null,
              maxEpisodes: vol.pageCount || null,
              maxSeasons: null,
              metadataExtras,
            }
          })
        }
      } catch {
        // Fall back to Open Library
      }

      // If Google Books returned 429 or 0 items, fallback to Open Library (free, no quota limit)
      if (items.length === 0) {
        try {
          const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&limit=5`
          const olRes = await fetch(olUrl)
          if (olRes.ok) {
            const olData = await olRes.json()
            const docs = Array.isArray(olData.docs) ? olData.docs.slice(0, 5) : []
            items = docs.map((doc: any) => {
              const authors = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : null
              const year = doc.first_publish_year ? String(doc.first_publish_year) : null
              const posterUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null

              const metadataExtras: Record<string, any> = {
                authors: Array.isArray(doc.author_name) ? doc.author_name : (authors ? [authors] : []),
                publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : null,
                pageCount: doc.number_of_pages_median || null,
                isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : null,
                genres: Array.isArray(doc.subject) ? doc.subject.slice(0, 4) : [],
              }

              return {
                id: `ol-${doc.key ? doc.key.replace('/works/', '') : Math.random().toString()}`,
                title: doc.title || 'Sem título',
                originalTitle: authors ? `Autor(es): ${authors}` : null,
                year,
                releaseYear: year,
                releaseDate: year,
                startDate: null,
                synopsis: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence.join(' ') : String(doc.first_sentence)) : null,
                posterUrl,
                category: 'book',
                totalEpisodes: doc.number_of_pages_median || null,
                totalSeasons: null,
                maxEpisodes: doc.number_of_pages_median || null,
                maxSeasons: null,
                metadataExtras,
              }
            })
          }
        } catch {
          // Open Library error
        }
      }
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

/**
 * Fast sync for ongoing works (series, anime, manga) to update max ceiling episodes/seasons.
 */
export async function fetchLatestCeiling(
  category: 'series' | 'anime' | 'manga',
  title: string,
  externalProviderId?: string | null
): Promise<{ maxEpisodes: number | null; maxSeasons: number | null; status: string | null } | null> {
  try {
    if (category === 'anime' || category === 'manga') {
      const isAnime = category === 'anime'
      const anilistType = isAnime ? 'ANIME' : 'MANGA'
      let variables: any = { type: anilistType }

      if (externalProviderId && externalProviderId.startsWith('anilist-')) {
        const idNum = parseInt(externalProviderId.replace('anilist-', ''))
        if (!isNaN(idNum)) variables.id = idNum
      }
      if (!variables.id) {
        variables.search = title.trim()
      }

      const query = `
        query ($id: Int, $search: String, $type: MediaType) {
          Media(id: $id, search: $search, type: $type) {
            id
            status
            episodes
            chapters
            volumes
          }
        }
      `

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables }),
      })

      if (res.ok) {
        const data = await res.json()
        const media = data.data?.Media
        if (media) {
          return {
            maxEpisodes: isAnime ? (media.episodes || null) : (media.chapters || null),
            maxSeasons: null,
            status: media.status || null,
          }
        }
      }
    } else if (category === 'series') {
      const res = await fetch(`/api/metadata/tmdb?query=${encodeURIComponent(title)}&type=series`)
      if (res.ok) {
        const data = await res.json()
        const first = data.results?.[0]
        if (first) {
          return {
            maxEpisodes: first.maxEpisodes || null,
            maxSeasons: first.maxSeasons || null,
            status: first.metadataExtras?.status || null,
          }
        }
      }
    }
    return null
  } catch (err) {
    console.error('fetchLatestCeiling error:', err)
    return null
  }
}
