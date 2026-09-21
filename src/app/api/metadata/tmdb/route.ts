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

    const formatted = rawItems.map((item: any) => {
      const isTv = type === 'series' || type === 'tv'
      const title = isTv ? (item.name || item.original_name) : (item.title || item.original_title)
      const originalTitle = isTv ? item.original_name : item.original_title
      const dateStr = isTv ? item.first_air_date : item.release_date
      const year = dateStr ? dateStr.split('-')[0] : null
      const posterUrl = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null

      return {
        id: `tmdb-${item.id}`,
        title: title || 'Sem título',
        originalTitle: originalTitle !== title ? originalTitle : null,
        year,
        startDate: dateStr || null,
        synopsis: item.overview || null,
        posterUrl,
        category: isTv ? 'series' : 'movie',
        totalEpisodes: null,
        totalSeasons: null,
      }
    })

    return NextResponse.json({ results: formatted })
  } catch (error: any) {
    console.error('Unexpected error in TMDB route:', error)
    return NextResponse.json({ error: 'Erro interno ao processar busca no TMDB' }, { status: 500 })
  }
}
