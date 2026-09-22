import { useState, useEffect, useCallback } from 'react'
import { searchMetadata, MetadataItem } from '@/app/lib/metadataService'
import styles from './MetadataSearchModal.module.css'

interface Props {
  isOpen: boolean
  category: 'movie' | 'series' | 'anime' | 'manga' | 'book' | 'game'
  initialQuery: string
  onSelect: (item: MetadataItem) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Filme',
  series: 'Série',
  anime: 'Anime',
  manga: 'Mangá',
  book: 'Livro',
  game: 'Jogo',
}

const CATEGORY_ICONS: Record<string, string> = {
  movie: '🎬',
  series: '📺',
  anime: '🍙',
  manga: '📖',
  book: '📚',
  game: '🎮',
}

export default function MetadataSearchModal({
  isOpen,
  category,
  initialQuery,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [items, setItems] = useState<MetadataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})

  const [lastSearchedQuery, setLastSearchedQuery] = useState('')

  const performSearch = useCallback(
    async (searchTerm: string) => {
      const clean = searchTerm.trim()
      if (!clean) return

      setIsLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        const result = await searchMetadata(clean, category)
        if (result.error) {
          setError(result.error)
          setItems([])
        } else {
          setItems(result.items)
          setIsFromCache(result.fromCache)
        }
      } catch (err: any) {
        setError('Erro de conexão ao buscar dados.')
        setItems([])
      } finally {
        setIsLoading(false)
      }
    },
    [category]
  )

  // Trigger search when modal opens with initialQuery
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setLastSearchedQuery(initialQuery.trim())
      setBrokenImages({})
      if (initialQuery.trim()) {
        performSearch(initialQuery)
      } else {
        setItems([])
        setHasSearched(false)
        setError(null)
      }
    }
  }, [isOpen, initialQuery, performSearch])

  // Debounce search while user is actively typing (850ms debounce)
  useEffect(() => {
    if (!isOpen) return
    const clean = query.trim()
    if (!clean) {
      setItems([])
      setHasSearched(false)
      setError(null)
      return
    }

    if (clean === lastSearchedQuery) return

    const timer = setTimeout(() => {
      setLastSearchedQuery(clean)
      performSearch(clean)
    }, 850)

    return () => clearTimeout(timer)
  }, [query, isOpen, lastSearchedQuery, performSearch])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = query.trim()
    if (!clean) return
    setLastSearchedQuery(clean)
    performSearch(clean)
  }

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span style={{ fontSize: '1.3rem' }}>{CATEGORY_ICONS[category] || '🔍'}</span>
            <h3 className={styles.headerTitle}>Buscar Metadados</h3>
            <span className={styles.categoryBadge}>{CATEGORY_LABELS[category] || category}</span>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} title="Fechar (ESC)">
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className={styles.searchBarContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={`Buscar ${CATEGORY_LABELS[category]?.toLowerCase() || ''}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className={styles.searchSubmitBtn}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Body */}
        <div className={styles.body}>
          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className={styles.statusMessage}>
              <div className={styles.spinner} />
              <span>Consultando bases de dados...</span>
            </div>
          )}

          {!isLoading && hasSearched && items.length === 0 && !error && (
            <div className={styles.statusMessage}>
              <span style={{ fontSize: '2rem' }}>🔍</span>
              <span>Nenhum resultado encontrado para &quot;{query.trim()}&quot;.</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Tente ajustar o termo de busca acima.
              </span>
            </div>
          )}

          {!isLoading && isFromCache && items.length > 0 && (
            <div className={styles.cachedIndicator}>⚡ Resultado carregado do cache local</div>
          )}

          {!isLoading && items.length > 0 && (
            items.map((item) => {
              const hasPoster = item.posterUrl && !brokenImages[item.id]

              return (
                <div
                  key={item.id}
                  className={styles.resultCard}
                  onClick={() => onSelect(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelect(item)
                    }
                  }}
                >
                  {/* Poster */}
                  <div className={styles.posterWrapper}>
                    {hasPoster ? (
                      <img
                        src={item.posterUrl!}
                        alt={item.title}
                        className={styles.posterImg}
                        onError={() => handleImageError(item.id)}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.posterFallback}>
                        {CATEGORY_ICONS[category] || '🎬'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.cardDetails}>
                    <div className={styles.cardTitleRow}>
                      <h4 className={styles.itemTitle} title={item.title}>
                        {item.title}
                      </h4>
                      {item.year && <span className={styles.itemYear}>{item.year}</span>}
                    </div>

                    {item.originalTitle && (
                      <span className={styles.itemOriginalTitle} title={item.originalTitle}>
                        {item.originalTitle}
                      </span>
                    )}

                    {item.synopsis && (
                      <p className={styles.itemSynopsis} title={item.synopsis}>
                        {item.synopsis}
                      </p>
                    )}

                    <div className={styles.metaPills}>
                      {item.totalSeasons ? (
                        <span className={styles.pill}>{item.totalSeasons} Temporadas</span>
                      ) : null}
                      {item.totalEpisodes ? (
                        <span className={styles.pill}>
                          {category === 'book'
                            ? `${item.totalEpisodes} páginas`
                            : category === 'manga'
                            ? `${item.totalEpisodes} capítulos`
                            : `${item.totalEpisodes} eps`}
                        </span>
                      ) : null}
                      {item.startDate && !item.year ? (
                        <span className={styles.pill}>{item.startDate}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Select button */}
                  <div className={styles.selectIndicator}>Selecionar</div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
