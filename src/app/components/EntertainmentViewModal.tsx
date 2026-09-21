'use client'

import React, { useState, useEffect } from 'react'
import { Entertainment } from '@/app/lib/types'
import { fetchLatestCeiling } from '@/app/lib/metadataService'
import { editEntertainment } from '@/app/lib/db'
import styles from './EntertainmentViewModal.module.css'

interface Props {
  item: Entertainment
  onClose: () => void
  onEdit: (item: Entertainment) => void
  onDelete: (id: string) => Promise<void>
  onUpdateProgress?: (id: string, newEpisode: number) => Promise<void>
}

export default function EntertainmentViewModal({
  item,
  onClose,
  onEdit,
  onDelete,
  onUpdateProgress,
}: Props) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'movie':
        return { icon: '🎬', label: 'Filme' }
      case 'series':
        return { icon: '📺', label: 'Série' }
      case 'anime':
        return { icon: '🎌', label: 'Anime' }
      case 'manga':
        return { icon: '📖', label: 'Mangá' }
      case 'book':
        return { icon: '📚', label: 'Livro' }
      case 'game':
        return { icon: '🎮', label: 'Jogo' }
      default:
        return { icon: '🍿', label: category }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'plan':
        return { label: 'Planejado', color: '#9CA3AF' }
      case 'in_progress':
        return { label: 'Em Andamento', color: '#F59E0B' }
      case 'completed':
        return { label: 'Concluído', color: '#10B981' }
      case 'dropped':
        return { label: 'Pausado / Dropado', color: '#EF4444' }
      default:
        return { label: status, color: '#9CA3AF' }
    }
  }

  const getProgressUnit = (category: string) => {
    if (category === 'book') return 'Página'
    if (category === 'manga') return 'Capítulo'
    return 'Episódio'
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      const [year, month, day] = dateStr.split('-')
      if (year && month && day) {
        return `${day}/${month}/${year}`
      }
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  const formatRuntime = (mins?: number | null) => {
    if (!mins) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const getMetacriticBg = (score: number) => {
    if (score >= 75) return '#10B981'
    if (score >= 50) return '#F59E0B'
    return '#EF4444'
  }

  const formatAnimeStatus = (status?: string | null) => {
    if (!status) return null
    switch (status.toUpperCase()) {
      case 'RELEASING': return 'Em Lançamento'
      case 'FINISHED': return 'Concluído'
      case 'NOT_YET_RELEASED': return 'Em Breve'
      case 'CANCELLED': return 'Cancelado'
      case 'HIATUS': return 'Em Hiato'
      default: return status
    }
  }

  const formatAnimeFormat = (format?: string | null) => {
    if (!format) return null
    switch (format.toUpperCase()) {
      case 'TV': return 'TV Anime'
      case 'TV_SHORT': return 'TV Curta'
      case 'MOVIE': return 'Filme'
      case 'SPECIAL': return 'Especial'
      case 'OVA': return 'OVA'
      case 'ONA': return 'ONA'
      case 'MANGA': return 'Mangá'
      case 'NOVEL': return 'Light Novel'
      case 'ONE_SHOT': return 'One Shot'
      default: return format
    }
  }

  const formatSeriesStatus = (status?: string | null) => {
    if (!status) return null
    switch (status.toLowerCase()) {
      case 'returning series': return 'Em Exibição'
      case 'ended': return 'Finalizada'
      case 'canceled': return 'Cancelada'
      case 'in production': return 'Em Produção'
      default: return status
    }
  }

  const hasProgress = ['series', 'anime', 'manga', 'book'].includes(item.category)
  const categoryInfo = getCategoryInfo(item.category)
  const statusInfo = getStatusInfo(item.watchStatus)
  const currentEp = item.progress?.currentEpisode ?? 0
  const ceiling = item.maxEpisodes ?? item.progress?.totalEpisodes ?? null
  const totalEp = ceiling
  const isAtCeiling = ceiling !== null && currentEp >= ceiling
  const maxSeasons = item.maxSeasons ?? item.progress?.totalSeasons ?? null

  const extras = item.metadataExtras || {}

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleQuickIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAtCeiling) return
    if (onUpdateProgress) {
      onUpdateProgress(item.id, currentEp + 1)
    }
  }

  const handleSyncCeiling = async () => {
    if (isSyncing) return
    if (!['series', 'anime', 'manga'].includes(item.category)) return

    setIsSyncing(true)
    setToastMessage(null)
    try {
      const res = await fetchLatestCeiling(
        item.category as 'series' | 'anime' | 'manga',
        item.title,
        item.externalProviderId
      )
      if (res && (res.maxEpisodes || res.maxSeasons)) {
        await editEntertainment(item.id, {
          maxEpisodes: res.maxEpisodes ?? item.maxEpisodes,
          maxSeasons: res.maxSeasons ?? item.maxSeasons,
          progress: {
            ...item.progress,
            totalEpisodes: res.maxEpisodes ?? item.progress?.totalEpisodes ?? null,
            totalSeasons: res.maxSeasons ?? item.progress?.totalSeasons ?? null,
          },
        })
        const unit = getProgressUnit(item.category).toLowerCase()
        const msg = res.maxEpisodes
          ? `Teto atualizado com sucesso: ${res.maxEpisodes} ${unit}s!`
          : 'Informações de teto atualizadas!'
        setToastMessage(msg)
      } else {
        setToastMessage('Nenhum novo episódio ou capítulo detectado na API.')
      }
    } catch (err) {
      console.error('Erro ao sincronizar tetos:', err)
      setToastMessage('Falha ao conectar com o serviço de metadados.')
    } finally {
      setIsSyncing(false)
      setTimeout(() => {
        setToastMessage(null)
      }, 4000)
    }
  }

  const handleDeleteClick = () => {
    onDelete(item.id)
  }

  // Detecta se existem extras ou elenco para renderizar a seção de DNA
  const hasGameExtras = item.category === 'game' && (
    extras.metacritic || (extras.platforms && extras.platforms.length > 0) || extras.playtime || extras.esrbRating || extras.genres
  )
  const hasMovieExtras = item.category === 'movie' && (
    extras.runtime || extras.directors || extras.voteAverage || (item.cast && item.cast.length > 0)
  )
  const hasSeriesExtras = item.category === 'series' && (
    extras.createdBy || extras.networks || extras.status || extras.voteAverage || (item.cast && item.cast.length > 0)
  )
  const hasAnimeMangaExtras = ['anime', 'manga'].includes(item.category) && (
    extras.studios || extras.format || extras.status || extras.averageScore || extras.chapters || extras.volumes || extras.genres
  )
  const hasBookExtras = item.category === 'book' && (
    extras.authors || extras.publisher || extras.pageCount || extras.isbn || extras.categories
  )

  const hasAnyExtras = hasGameExtras || hasMovieExtras || hasSeriesExtras || hasAnimeMangaExtras || hasBookExtras

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <header className={styles.header}>
          <span className={styles.headerTitle}>Visualização de Entretenimento</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Fechar (Esc)">
            ✕
          </button>
        </header>

        {/* Micro-Toast de Notificação */}
        {toastMessage && (
          <div className={styles.toastBanner}>
            <span>ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Corpo Principal */}
        <div className={styles.body}>
          {/* Coluna da Capa */}
          <div className={styles.coverCol}>
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={item.title}
                className={styles.posterImage}
                loading="lazy"
              />
            ) : (
              <div className={styles.posterPlaceholder}>
                <span className={styles.placeholderIcon}>{categoryInfo.icon}</span>
                <span>Sem Capa</span>
              </div>
            )}
          </div>

          {/* Coluna de Informações */}
          <div className={styles.detailsCol}>
            {/* Badges de Categoria e Status */}
            <div className={styles.badgeRow}>
              <span className={styles.categoryBadge}>
                {categoryInfo.icon} {categoryInfo.label}
              </span>
              <span
                className={styles.statusBadge}
                style={{ backgroundColor: statusInfo.color }}
              >
                ● {statusInfo.label}
              </span>
              {(item.releaseYear || item.releaseDate) && (
                <span className={styles.categoryBadge} style={{ color: 'var(--ink)' }}>
                  📅 {item.releaseYear || item.releaseDate}
                </span>
              )}
            </div>

            {/* Título Principal */}
            <h2 className={styles.titleText}>{item.title}</h2>
            {item.originalTitle && (
              <span className={styles.originalTitle}>{item.originalTitle}</span>
            )}
            {extras.tagline && (
              <span className={styles.taglineText}>&ldquo;{extras.tagline}&rdquo;</span>
            )}

            {/* Avaliação Pessoal */}
            {item.rating?.overall !== null && item.rating?.overall !== undefined && (
              <div className={styles.ratingRow}>
                <span className={styles.ratingStars}>★ {item.rating.overall}</span>
                <span className={styles.ratingLabel}>/ 10 (Avaliação Pessoal)</span>
              </div>
            )}

            {/* Barra de Progresso com Teto e Botão de Sync */}
            {hasProgress && (
              <div className={styles.progressBox}>
                <div className={styles.progressText}>
                  {item.category === 'series' && item.progress?.currentSeason && (
                    <span className={styles.seasonLabel}>
                      Temporada {item.progress.currentSeason}
                      {maxSeasons ? ` de ${maxSeasons}` : ''}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span>
                      {getProgressUnit(item.category)}: <strong>{currentEp}</strong>
                      {totalEp ? ` / ${totalEp}` : ''}
                      {isAtCeiling && (
                        <span style={{ marginLeft: '0.4rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
                          (Teto atingido)
                        </span>
                      )}
                    </span>
                    {['series', 'anime', 'manga'].includes(item.category) && (
                      <button
                        type="button"
                        className={styles.syncBtn}
                        onClick={handleSyncCeiling}
                        disabled={isSyncing}
                        title="Buscar episódios/capítulos mais recentes na API externa"
                      >
                        <span className={isSyncing ? styles.spinning : ''}>🔄</span>
                        <span>{isSyncing ? 'Buscando...' : 'Sincronizar Tetos'}</span>
                      </button>
                    )}
                  </div>
                </div>
                {onUpdateProgress && (
                  <button
                    type="button"
                    className={styles.quickPlusBtn}
                    onClick={handleQuickIncrement}
                    disabled={isAtCeiling}
                    style={isAtCeiling ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                    title={isAtCeiling ? 'Teto máximo atingido' : `Adicionar +1 ${getProgressUnit(item.category)}`}
                  >
                    +1
                  </button>
                )}
              </div>
            )}

            {/* Datas Pessoais de Consumo */}
            {(item.startDate || item.endDate) && (
              <div className={styles.datesGrid}>
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>Início (Consumo)</span>
                  <span className={styles.dateValue}>
                    {formatDate(item.startDate) || 'Não definido'}
                  </span>
                </div>
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>Conclusão</span>
                  <span className={styles.dateValue}>
                    {formatDate(item.endDate) || 'Em andamento'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção DNA / Informações Específicas da Mídia (metadataExtras) */}
        {hasAnyExtras && (
          <div className={styles.extrasContainer}>
            <div className={styles.extrasGrid}>
              {/* JOGOS */}
              {item.category === 'game' && (
                <>
                  {extras.metacritic !== undefined && extras.metacritic !== null && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Metacritic</span>
                      <span
                        className={styles.metacriticBadge}
                        style={{ backgroundColor: getMetacriticBg(Number(extras.metacritic)) }}
                      >
                        {extras.metacritic}
                      </span>
                    </div>
                  )}
                  {extras.playtime ? (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Tempo Médio</span>
                      <span className={styles.extraValue}>~{extras.playtime} horas</span>
                    </div>
                  ) : null}
                  {extras.esrbRating && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Classificação</span>
                      <span className={styles.extraValue}>{extras.esrbRating}</span>
                    </div>
                  )}
                  {extras.genres && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Gêneros</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.genres) ? extras.genres.join(', ') : extras.genres}
                      </span>
                    </div>
                  )}
                  {extras.platforms && extras.platforms.length > 0 && (
                    <div className={styles.extraItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.extraLabel}>Plataformas</span>
                      <div className={styles.pillGroup}>
                        {extras.platforms.map((p: string, idx: number) => (
                          <span key={idx} className={styles.platformPill}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* FILMES */}
              {item.category === 'movie' && (
                <>
                  {extras.runtime ? (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Duração</span>
                      <span className={styles.extraValue}>
                        {formatRuntime(extras.runtime)} ({extras.runtime} min)
                      </span>
                    </div>
                  ) : null}
                  {extras.directors && extras.directors.length > 0 && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Direção</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.directors) ? extras.directors.join(', ') : extras.directors}
                      </span>
                    </div>
                  )}
                  {extras.voteAverage ? (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Média TMDB</span>
                      <span className={styles.extraValue} style={{ color: '#F59E0B', fontWeight: 600 }}>
                        ★ {Number(extras.voteAverage).toFixed(1)} / 10
                      </span>
                    </div>
                  ) : null}
                  {item.cast && item.cast.length > 0 && (
                    <div className={styles.extraItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.extraLabel}>Elenco Principal</span>
                      <span className={styles.extraValue}>
                        {item.cast.slice(0, 5).join(', ')}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* SÉRIES */}
              {item.category === 'series' && (
                <>
                  {extras.createdBy && extras.createdBy.length > 0 && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Criado por</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.createdBy) ? extras.createdBy.join(', ') : extras.createdBy}
                      </span>
                    </div>
                  )}
                  {extras.networks && extras.networks.length > 0 && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Emissora / Rede</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.networks) ? extras.networks.join(', ') : extras.networks}
                      </span>
                    </div>
                  )}
                  {extras.status && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Status da Produção</span>
                      <span className={styles.extraValue}>
                        {formatSeriesStatus(extras.status)}
                      </span>
                    </div>
                  )}
                  {extras.voteAverage ? (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Média TMDB</span>
                      <span className={styles.extraValue} style={{ color: '#F59E0B', fontWeight: 600 }}>
                        ★ {Number(extras.voteAverage).toFixed(1)} / 10
                      </span>
                    </div>
                  ) : null}
                  {item.cast && item.cast.length > 0 && (
                    <div className={styles.extraItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.extraLabel}>Elenco Principal</span>
                      <span className={styles.extraValue}>
                        {item.cast.slice(0, 5).join(', ')}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* ANIME & MANGÁ */}
              {['anime', 'manga'].includes(item.category) && (
                <>
                  {extras.studios && extras.studios.length > 0 && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>
                        {item.category === 'anime' ? 'Estúdio' : 'Autor / Estúdio'}
                      </span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.studios) ? extras.studios.join(', ') : extras.studios}
                      </span>
                    </div>
                  )}
                  {extras.format && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Formato</span>
                      <span className={styles.extraValue}>
                        {formatAnimeFormat(extras.format)}
                      </span>
                    </div>
                  )}
                  {extras.status && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Status da Obra</span>
                      <span className={styles.extraValue}>
                        {formatAnimeStatus(extras.status)}
                      </span>
                    </div>
                  )}
                  {extras.averageScore ? (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Média AniList</span>
                      <span className={styles.extraValue} style={{ color: '#10B981', fontWeight: 600 }}>
                        {extras.averageScore}%
                      </span>
                    </div>
                  ) : null}
                  {(extras.chapters || extras.volumes) && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Extensão</span>
                      <span className={styles.extraValue}>
                        {extras.chapters ? `${extras.chapters} capítulos` : ''}
                        {extras.chapters && extras.volumes ? ' • ' : ''}
                        {extras.volumes ? `${extras.volumes} volumes` : ''}
                      </span>
                    </div>
                  )}
                  {extras.genres && extras.genres.length > 0 && (
                    <div className={styles.extraItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.extraLabel}>Gêneros</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.genres) ? extras.genres.join(', ') : extras.genres}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* LIVROS */}
              {item.category === 'book' && (
                <>
                  {extras.authors && extras.authors.length > 0 && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Autor(es)</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.authors) ? extras.authors.join(', ') : extras.authors}
                      </span>
                    </div>
                  )}
                  {extras.publisher && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Editora</span>
                      <span className={styles.extraValue}>{extras.publisher}</span>
                    </div>
                  )}
                  {extras.pageCount && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>Total de Páginas</span>
                      <span className={styles.extraValue}>{extras.pageCount} páginas</span>
                    </div>
                  )}
                  {extras.isbn && (
                    <div className={styles.extraItem}>
                      <span className={styles.extraLabel}>ISBN</span>
                      <span className={styles.extraValue}>{extras.isbn}</span>
                    </div>
                  )}
                  {extras.categories && extras.categories.length > 0 && (
                    <div className={styles.extraItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.extraLabel}>Categorias</span>
                      <span className={styles.extraValue}>
                        {Array.isArray(extras.categories) ? extras.categories.join(', ') : extras.categories}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Sinopse */}
        <div className={styles.synopsisSection}>
          <span className={styles.synopsisLabel}>Sinopse</span>
          {item.synopsis ? (
            <p className={styles.synopsisText}>{item.synopsis}</p>
          ) : (
            <p className={styles.synopsisEmpty}>Nenhuma sinopse cadastrada para este item.</p>
          )}
        </div>

        {/* Rodapé de Ações */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDeleteClick}
            title="Excluir este item"
          >
            🗑️ Excluir
          </button>
          <div className={styles.footerRightActions}>
            <button
              type="button"
              className={styles.closeActionBtn}
              onClick={onClose}
            >
              Fechar
            </button>
            <button
              type="button"
              className={styles.editActionBtn}
              onClick={() => onEdit(item)}
            >
              ✏️ Editar
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
