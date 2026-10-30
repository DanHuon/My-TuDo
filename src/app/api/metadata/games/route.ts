import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const query = searchParams.get('query')

    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RAWG_API_KEY não configurada no servidor (.env.local)' },
        { status: 500 }
      )
    }

    // 1. On-Demand Detail Fetch for a single game (Lazy Fetching)
    if (id) {
      const cleanId = id.trim()
      const detailUrl = `https://api.rawg.io/api/games/${cleanId}?key=${apiKey}`
      const detailRes = await fetch(detailUrl, {
        headers: { Accept: 'application/json' },
      })

      if (detailRes.status === 429) {
        return NextResponse.json(
          { error: 'RATE_LIMIT', message: 'Limite de requisições no RAWG atingido.' },
          { status: 429 }
        )
      }

      if (!detailRes.ok) {
        return NextResponse.json(
          { error: `Erro ao obter detalhes do jogo (${detailRes.status})` },
          { status: detailRes.status }
        )
      }

      const detailData = await detailRes.json()
      const developers = Array.isArray(detailData.developers)
        ? detailData.developers.map((d: any) => d.name).filter(Boolean)
        : []
      const publishers = Array.isArray(detailData.publishers)
        ? detailData.publishers.map((p: any) => p.name).filter(Boolean)
        : []

      return NextResponse.json({
        id: detailData.id,
        synopsis: detailData.description_raw || detailData.description || null,
        developers,
        publishers,
        metacritic: detailData.metacritic || null,
        playtime: detailData.playtime || null,
        released: detailData.released || null,
        website: detailData.website || null,
      })
    }

    // 2. Search Query (Returns top 8 candidates with Lazy Fetching)
    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const cleanQuery = query.trim()
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(cleanQuery)}&page_size=8`

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (res.status === 429) {
      return NextResponse.json(
        { error: 'RATE_LIMIT', message: 'Limite de buscas no RAWG atingido temporariamente.' },
        { status: 429 }
      )
    }

    if (!res.ok) {
      const errBody = await res.text()
      console.error('RAWG API Error:', res.status, errBody)
      return NextResponse.json(
        { error: `Erro na API do RAWG (${res.status})` },
        { status: res.status }
      )
    }

    const data = await res.json()
    let rawItems = Array.isArray(data.results) ? data.results : []

    // If query has spaces (e.g. "Cyber punk 2077" -> "Cyberpunk 2077")
    // check if a compound-word variant surfaces better base game candidates
    const words = cleanQuery.split(/\s+/)
    if (words.length > 1) {
      try {
        const combinedFirstTwo = words.length >= 2 ? [words[0] + words[1], ...words.slice(2)].join(' ') : null
        const candidateQueries = [combinedFirstTwo].filter(Boolean).filter(q => q && q.toLowerCase() !== cleanQuery.toLowerCase()) as string[]

        for (const candidate of candidateQueries) {
          const varUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(candidate)}&page_size=8`
          const varRes = await fetch(varUrl, { headers: { Accept: 'application/json' } })
          if (varRes.ok) {
            const varData = await varRes.json()
            if (Array.isArray(varData.results) && varData.results.length > 0) {
              const existingIds = new Set(rawItems.map((r: any) => r.id))
              for (const item of varData.results) {
                if (!existingIds.has(item.id)) {
                  // If candidate has metacritic or background_image, prepend to surface base game
                  if (item.metacritic || item.background_image) {
                    rawItems.unshift(item)
                  } else {
                    rawItems.push(item)
                  }
                  existingIds.add(item.id)
                }
              }
            }
          }
        }
      } catch {
        // Fallback silently
      }
    }

    rawItems = rawItems.slice(0, 8)

    // Map list items directly (Zero extra calls - Lazy Fetching)
    const formatted = rawItems.map((item: any) => {
      const year = item.released ? item.released.split('-')[0] : null
      const platformList = Array.isArray(item.platforms)
        ? item.platforms.map((p: any) => p.platform?.name).filter(Boolean)
        : []
      const genreList = Array.isArray(item.genres)
        ? item.genres.map((g: any) => g.name).filter(Boolean)
        : []

      const metadataExtras: Record<string, any> = {
        platforms: platformList,
        genres: genreList,
        metacritic: item.metacritic || null,
        rating: item.rating || null,
        playtime: item.playtime || null,
        esrbRating: item.esrb_rating?.name || null,
      }

      return {
        id: `rawg-${item.id}`,
        title: item.name || 'Sem título',
        originalTitle: null,
        year,
        releaseYear: year,
        releaseDate: item.released || null,
        startDate: null,
        synopsis: null, // Loaded on-demand when user selects the item
        posterUrl: item.background_image || null,
        category: 'game',
        totalEpisodes: null,
        totalSeasons: null,
        maxEpisodes: null,
        maxSeasons: null,
        metadataExtras,
      }
    })

    return NextResponse.json({ results: formatted })
  } catch (error: any) {
    console.error('Unexpected error in RAWG games route:', error)
    return NextResponse.json({ error: 'Erro interno ao processar busca no RAWG' }, { status: 500 })
  }
}
