import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RAWG_API_KEY não configurada no servidor (.env.local)' },
        { status: 500 }
      )
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

    const formatted = rawItems.map((item: any) => {
      const year = item.released ? item.released.split('-')[0] : null
      const genres = Array.isArray(item.genres) ? item.genres.map((g: any) => g.name).join(', ') : ''
      const platforms = Array.isArray(item.platforms)
        ? item.platforms.map((p: any) => p.platform?.name).filter(Boolean).slice(0, 4).join(', ')
        : ''

      let synopsisParts: string[] = []
      if (genres) synopsisParts.push(`Gênero: ${genres}`)
      if (platforms) synopsisParts.push(`Plataformas: ${platforms}`)
      if (item.rating) synopsisParts.push(`Nota RAWG: ${item.rating}/5`)

      return {
        id: `rawg-${item.id}`,
        title: item.name || 'Sem título',
        originalTitle: null,
        year,
        startDate: item.released || null,
        synopsis: synopsisParts.length > 0 ? synopsisParts.join(' | ') : null,
        posterUrl: item.background_image || null,
        category: 'game',
        totalEpisodes: null,
        totalSeasons: null,
      }
    })

    return NextResponse.json({ results: formatted })
  } catch (error: any) {
    console.error('Unexpected error in RAWG games route:', error)
    return NextResponse.json({ error: 'Erro interno ao processar busca no RAWG' }, { status: 500 })
  }
}
