import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const type = searchParams.get('type') || 'movie'

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY não configurada no servidor (.env.local)' },
        { status: 500 }
      )
    }

    const endpoint = type === 'series' || type === 'tv'
      ? 'https://api.themoviedb.org/3/search/tv'
      : 'https://api.themoviedb.org/3/search/movie'

    const url = `${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(query.trim())}&language=pt-BR&page=1&include_adult=false`

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (res.status === 429) {
      return NextResponse.json(
        { error: 'RATE_LIMIT', message: 'Limite de buscas no TMDB atingido temporariamente.' },
        { status: 429 }
      )
    }

    if (!res.ok) {
      const errBody = await res.text()
      console.error('TMDB API Error:', res.status, errBody)
      return NextResponse.json(
        { error: `Erro na API do TMDB (${res.status})` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const rawItems = Array.isArray(data.results) ? data.results.slice(0, 5) : []

    const formatted = await Promise.all(
      rawItems.map(async (item: any) => {
        const isTv = type === 'series' || type === 'tv'
        const title = isTv ? (item.name || item.original_name) : (item.title || item.original_title)
        const originalTitle = isTv ? item.original_name : item.original_title
        const dateStr = isTv ? item.first_air_date : item.release_date
        const year = dateStr ? dateStr.split('-')[0] : null
        const posterUrl = item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null

        let metadataExtras: Record<string, any> = {}
        let totalEpisodes: number | null = null
        let totalSeasons: number | null = null

        try {
          const detailUrl = isTv
            ? `https://api.themoviedb.org/3/tv/${item.id}?api_key=${apiKey}&language=pt-BR&append_to_response=credits`
            : `https://api.themoviedb.org/3/movie/${item.id}?api_key=${apiKey}&language=pt-BR&append_to_response=credits`

          const detailRes = await fetch(detailUrl, { headers: { Accept: 'application/json' } })
          if (detailRes.ok) {
            const detailData = await detailRes.json()
            if (isTv) {
              totalEpisodes = detailData.number_of_episodes || null
              totalSeasons = detailData.number_of_seasons || null
              metadataExtras = {
                status: detailData.status, // "Returning Series", "Ended", etc.
                networks: Array.isArray(detailData.networks) ? detailData.networks.map((n: any) => n.name).join(', ') : null,
                createdBy: Array.isArray(detailData.created_by) ? detailData.created_by.map((c: any) => c.name).join(', ') : null,
                genres: Array.isArray(detailData.genres) ? detailData.genres.map((g: any) => g.name) : [],
                voteAverage: detailData.vote_average || null,
                totalEpisodes,
                totalSeasons,
              }
            } else {
              const directors = detailData.credits?.crew
                ? detailData.credits.crew.filter((c: any) => c.job === 'Director').map((c: any) => c.name).join(', ')
                : null
              metadataExtras = {
                runtime: detailData.runtime || null, // in minutes
                directors: directors || null,
                tagline: detailData.tagline || null,
                genres: Array.isArray(detailData.genres) ? detailData.genres.map((g: any) => g.name) : [],
                voteAverage: detailData.vote_average || null,
              }
            }
          }
        } catch {
          // Fallback if enrichment fails
        }

        return {
          id: `tmdb-${item.id}`,
          title: title || 'Sem título',
          originalTitle: originalTitle !== title ? originalTitle : null,
          year,
          releaseYear: year,
          releaseDate: dateStr || null,
          startDate: null,
          synopsis: item.overview || null,
          posterUrl,
          category: isTv ? 'series' : 'movie',
          totalEpisodes,
          totalSeasons,
          maxEpisodes: totalEpisodes,
          maxSeasons: totalSeasons,
          metadataExtras,
        }
      })
    )

    return NextResponse.json({ results: formatted })
  } catch (error: any) {
    console.error('Unexpected error in TMDB route:', error)
    return NextResponse.json({ error: 'Erro interno ao processar busca no TMDB' }, { status: 500 })
  }
}
