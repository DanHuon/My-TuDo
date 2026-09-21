'use client'

import React from 'react'
import { Entertainment } from '@/app/lib/types'
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

  const hasProgress = ['series', 'anime', 'manga', 'book'].includes(item.category)
  const categoryInfo = getCategoryInfo(item.category)
  const statusInfo = getStatusInfo(item.watchStatus)
  const currentEp = item.progress?.currentEpisode ?? 0
  const totalEp = item.progress?.totalEpisodes

  React.useEffect(() => {
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
    if (onUpdateProgress) {
      onUpdateProgress(item.id, currentEp + 1)
    }
  }

  const handleDeleteClick = () => {
    onDelete(item.id)
  }

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

        {/* Layout Principal: Capa + Detalhes */}
        <div className={styles.mainLayout}>
          {/* Capa */}
          <div className={styles.posterWrapper}>
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={item.title}
                className={styles.posterImg}
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
            </div>

            {/* Título Principal */}
            <h2 className={styles.titleText}>{item.title}</h2>
            {item.originalTitle && (
              <span className={styles.originalTitle}>{item.originalTitle}</span>
            )}

            {/* Avaliação */}
            {item.rating?.overall !== null && item.rating?.overall !== undefined && (
              <div className={styles.ratingRow}>
                <span className={styles.ratingStars}>★ {item.rating.overall}</span>
                <span className={styles.ratingLabel}>/ 10 (Avaliação Pessoal)</span>
              </div>
            )}

            {/* Barra de Progresso */}
            {hasProgress && (
              <div className={styles.progressBox}>
                <div className={styles.progressText}>
                  {item.category === 'series' && item.progress?.currentSeason && (
                    <span className={styles.seasonLabel}>
                      Temporada {item.progress.currentSeason}
                      {item.progress.totalSeasons ? ` de ${item.progress.totalSeasons}` : ''}
                    </span>
                  )}
                  <span>
                    {getProgressUnit(item.category)}: <strong>{currentEp}</strong>
                    {totalEp ? ` / ${totalEp}` : ''}
                  </span>
                </div>
                {onUpdateProgress && (
                  <button
                    type="button"
                    className={styles.quickPlusBtn}
                    onClick={handleQuickIncrement}
                    title={`Adicionar +1 ${getProgressUnit(item.category)}`}
                  >
                    +1
                  </button>
                )}
              </div>
            )}

            {/* Datas */}
            {(item.startDate || item.endDate) && (
              <div className={styles.datesGrid}>
                <div className={styles.dateItem}>
                  <span className={styles.dateLabel}>Início</span>
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
