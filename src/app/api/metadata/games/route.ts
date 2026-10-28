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

    // 2. Search Query (Returns top 5 candidates with 1 single RAWG request)
    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query.trim())}&page_size=5`

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
    const rawItems = Array.isArray(data.results) ? data.results.slice(0, 5) : []

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
