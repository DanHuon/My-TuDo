'use client'

import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getEntertainments, editEntertainment, deleteEntertainment } from '@/app/lib/db'
import { Entertainment } from '@/app/lib/types'
import EntertainmentForm from './EntertainmentForm'
import EntertainmentViewModal from './EntertainmentViewModal'
import styles from './EntertainmentList.module.css'

type Tab = 'all' | 'series' | 'movie' | 'book' | 'game' | 'anime' | 'manga'
type StatusTab = 'all' | 'plan' | 'in_progress' | 'completed' | 'dropped'
type SortOption = 'alphaAsc' | 'alphaDesc' | 'createdDesc' | 'createdAsc' | 'updatedDesc' | 'updatedAsc' | 'ratingDesc' | 'ratingAsc' | 'startDesc' | 'startAsc' | 'endDesc' | 'endAsc'
type ViewMode = 'grid' | 'compact' | 'list'

export default function EntertainmentList() {
  const items = useLiveQuery(() => getEntertainments()) || []
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updatedDesc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Entertainment | null>(null)
  const [viewingItem, setViewingItem] = useState<Entertainment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const savedMode = localStorage.getItem('mytudo_entertainment_view_mode')
    if (savedMode === 'grid' || savedMode === 'compact' || savedMode === 'list') {
      setViewMode(savedMode)
    }
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('mytudo_entertainment_view_mode', mode)
  }

  const filteredAndSortedItems = items.filter(item => {
    // 1. Tab Filter
    let tabMatch = false
    if (activeTab === 'all') tabMatch = true
    else tabMatch = item.category === activeTab

    // 2. Status Filter
    let statusMatch = false
    if (statusTab === 'all') statusMatch = true
    else statusMatch = item.watchStatus === statusTab

    // 3. Search Filter
    let searchMatch = true
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(q)
      const synMatch = item.synopsis?.toLowerCase().includes(q) || false
      searchMatch = titleMatch || synMatch
    }

    return tabMatch && statusMatch && searchMatch
  }).sort((a, b) => {
    switch (sortBy) {
      case 'alphaAsc': return a.title.localeCompare(b.title)
      case 'alphaDesc': return b.title.localeCompare(a.title)
      case 'createdDesc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'createdAsc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'updatedDesc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'updatedAsc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      case 'ratingDesc': return (b.rating.overall || 0) - (a.rating.overall || 0)
      case 'ratingAsc': return (a.rating.overall || 0) - (b.rating.overall || 0)
      case 'startDesc': return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
      case 'startAsc': return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime()
      case 'endDesc': return new Date(b.endDate || 0).getTime() - new Date(a.endDate || 0).getTime()
      case 'endAsc': return new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime()
      default: return 0
    }
  })

  const getItemProgressState = (item: Entertainment) => {
    const isSeriesOrAnime = ['series', 'anime'].includes(item.category)
    const currentSeason = item.progress?.currentSeason || 1
    const maxSeasons = item.maxSeasons ?? item.progress?.totalSeasons ?? null
    const seasonMap = item.metadataExtras?.seasonEpisodes
    const seasonCeiling = (item.category === 'series' && seasonMap)
      ? (seasonMap[currentSeason] ?? seasonMap[String(currentSeason)] ?? null)
      : null
    const epCeiling = seasonCeiling ?? item.maxEpisodes ?? item.progress?.totalEpisodes ?? null
    const curEp = item.progress?.currentEpisode || 0
    const hasNextSeason = isSeriesOrAnime && maxSeasons !== null && currentSeason < maxSeasons
    const isAtCurrentCeiling = epCeiling !== null && curEp >= epCeiling
    const isTrulyMaxed = isAtCurrentCeiling && !hasNextSeason

    return {
      isSeriesOrAnime,
      currentSeason,
      maxSeasons,
      seasonMap,
      epCeiling,
      curEp,
      hasNextSeason,
      isAtCurrentCeiling,
      isTrulyMaxed,
    }
  }

  const handleIncrement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Crucial for not triggering the card double click
    const item = items.find(i => i.id === id)
    if (!item) return
    const state = getItemProgressState(item)
    if (state.isTrulyMaxed) return

    if (state.isAtCurrentCeiling && state.hasNextSeason) {
      const nextSeason = state.currentSeason + 1
      const nextSeasonCeiling = state.seasonMap
        ? (state.seasonMap[nextSeason] ?? state.seasonMap[String(nextSeason)] ?? null)
        : null

      await editEntertainment(id, {
        maxEpisodes: nextSeasonCeiling ?? item.maxEpisodes,
        progress: {
          ...item.progress,
          currentSeason: nextSeason,
          currentEpisode: 1,
          totalEpisodes: nextSeasonCeiling ?? item.progress?.totalEpisodes ?? null,
        }
      })
    } else {
      await editEntertainment(id, {
        progress: {
          ...item.progress,
          currentEpisode: state.curEp + 1,
        }
      })
    }
  }

  const handleCardDoubleClick = (item: Entertainment) => {
    setViewingItem(item)
  }

  const getProgressLabel = (category: string) => {
    if (category === 'book') return 'Pág'
    if (category === 'manga') return 'Cap'
    return 'Ep'
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'plan': return 'Planejado'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluído'
      case 'dropped': return 'Dropado'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'plan': return '#9CA3AF'
      case 'in_progress': return '#F59E0B'
      case 'completed': return '#10B981'
      case 'dropped': return '#EF4444'
      default: return '#9CA3AF'
    }
  }

  const hasQuickAction = (cat: string) => ['series', 'anime', 'manga', 'book'].includes(cat)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Estante</h2>
        <input 
          type="search" 
          className={styles.searchBar} 
          placeholder="Pesquisar por título ou descrição..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={() => { setEditingItem(null); setShowForm(true) }} className={styles.addBtn}>
          + Adicionar
        </button>
      </div>

      <div className={styles.tabsScrollContainer}>
        <div className={styles.tabs} style={{ paddingBottom: '0' }}>
          {(['all', 'series', 'movie', 'book', 'game', 'anime', 'manga'] as Tab[]).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? 'Tudo' : 
               tab === 'series' ? '📺 Séries' :
               tab === 'movie' ? '🎬 Filmes' :
               tab === 'book' ? '📚 Livros' :
               tab === 'game' ? '🎮 Jogos' : 
               tab === 'anime' ? '🎌 Animes' : '📖 Mangás'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.statusTabsWrapper}>
          <div className={styles.tabsScrollContainer}>
            <div className={styles.tabs} style={{ paddingTop: '0' }}>
              {(['all', 'plan', 'in_progress', 'completed', 'dropped'] as StatusTab[]).map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${statusTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setStatusTab(tab)}
                  style={{ fontSize: '0.65rem', padding: '0.3rem 0.8rem' }}
                >
                  {tab === 'all' ? 'Todos os Status' : getStatusLabel(tab)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Alternador de Visualização Estilo Windows Explorer e Ordenação */}
        <div className={styles.viewControlsGroup}>
          <div className={styles.viewModeSwitcher} role="group" aria-label="Modo de visualização">
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'grid' ? styles.viewModeBtnActive : ''}`}
              onClick={() => handleViewModeChange('grid')}
              title="Cards Grandes"
              aria-label="Cards Grandes"
            >
              ⊞ Cards
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'compact' ? styles.viewModeBtnActive : ''}`}
              onClick={() => handleViewModeChange('compact')}
              title="Ícones Médios / Compactos"
              aria-label="Ícones Médios / Compactos"
            >
              㗊 Compacto
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.viewModeBtnActive : ''}`}
              onClick={() => handleViewModeChange('list')}
              title="Lista / Detalhes"
              aria-label="Lista / Detalhes"
            >
              ☰ Lista
            </button>
          </div>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={styles.sortSelect}
          >
            <option value="updatedDesc">Atualizado (Mais Recente)</option>
            <option value="updatedAsc">Atualizado (Mais Antigo)</option>
            <option value="createdDesc">Criado (Mais Recente)</option>
            <option value="createdAsc">Criado (Mais Antigo)</option>
            <option value="alphaAsc">Ordem Alfabética (A-Z)</option>
            <option value="alphaDesc">Ordem Alfabética (Z-A)</option>
            <option value="ratingDesc">Melhor Nota (10-1)</option>
            <option value="ratingAsc">Pior Nota (1-10)</option>
            <option value="startDesc">Data de Início (Mais Recente)</option>
            <option value="startAsc">Data de Início (Mais Antigo)</option>
            <option value="endDesc">Data de Fim (Mais Recente)</option>
            <option value="endAsc">Data de Fim (Mais Antigo)</option>
          </select>
        </div>
      </div>

      {viewingItem && (
        <EntertainmentViewModal
          item={items.find(i => i.id === viewingItem.id) || viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={(item) => {
            setViewingItem(null)
            setEditingItem(item)
            setShowForm(true)
          }}
          onDelete={async (id) => {
            if (confirm('Tem certeza que deseja apagar este item?')) {
              await deleteEntertainment(id)
              setViewingItem(null)
            }
          }}
          onUpdateProgress={async (id, newEpisode) => {
            const item = items.find(i => i.id === id)
            if (!item) return
            await editEntertainment(id, {
              progress: {
                ...item.progress,
                currentEpisode: newEpisode,
              },
            })
            setViewingItem({
              ...item,
              progress: {
                ...item.progress,
                currentEpisode: newEpisode,
              },
            })
          }}
        />
      )}

      {showForm && (
        <EntertainmentForm 
          itemToEdit={editingItem}
          onClose={() => { setShowForm(false); setEditingItem(null) }} 
          onAdded={() => { setShowForm(false); setEditingItem(null) }} 
        />
      )}

      {/* 1. MODO CARDS GRANDES */}
      {viewMode === 'grid' && (
        <div className={styles.grid}>
          {filteredAndSortedItems.map(item => (
            <div 
              key={item.id} 
              className={styles.card} 
              onDoubleClick={() => handleCardDoubleClick(item)}
              title="Dê um duplo clique para visualizar"
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(item.watchStatus) }}>
                {getStatusLabel(item.watchStatus)}
              </div>
              
              {item.posterUrl ? (
                <div className={styles.coverContainer}>
                  <img
                    src={item.posterUrl}
                    alt=""
                    aria-hidden="true"
                    className={styles.coverBlurBg}
                  />
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className={styles.coverImage}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className={styles.coverPlaceholder}>Sem Capa</div>
              )}

              <div className={styles.info}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 className={styles.cardTitle} style={{ flex: 1 }}>{item.title}</h4>
                  {item.rating?.overall !== null && item.rating?.overall !== undefined && (
                    <span style={{ 
                      fontFamily: "'DM Mono', monospace", 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold', 
                      color: 'var(--accent)',
                      marginLeft: '0.5rem'
                    }}>
                      ★ {item.rating.overall}
                    </span>
                  )}
                </div>
                <span className={styles.category}>{item.category}</span>
                
                <div className={styles.footer}>
                  <span className={styles.progress}>
                    {hasQuickAction(item.category) && (() => {
                      const state = getItemProgressState(item)
                      return (
                        <>
                          {state.isSeriesOrAnime && item.progress.currentSeason ? (
                            <>T: {item.progress.currentSeason} | </>
                          ) : null}
                          {getProgressLabel(item.category)}: {state.curEp}
                          {state.epCeiling ? ` / ${state.epCeiling}` : ''}
                        </>
                      )
                    })()}
                  </span>
                  {hasQuickAction(item.category) && (() => {
                    const state = getItemProgressState(item)
                    const titleText = state.isTrulyMaxed
                      ? 'Teto máximo atingido'
                      : state.isAtCurrentCeiling && state.hasNextSeason
                      ? `Concluir temporada e avançar para Temporada ${state.currentSeason + 1}`
                      : `Adicionar +1 ${getProgressLabel(item.category)}`

                    return (
                      <button 
                        className={styles.plusBtn} 
                        onClick={(e) => handleIncrement(item.id, e)}
                        disabled={state.isTrulyMaxed}
                        style={state.isTrulyMaxed ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                        title={titleText}
                      >
                        +1
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. MODO ÍCONES MÉDIOS / COMPACTOS */}
      {viewMode === 'compact' && (
        <div className={styles.compactGrid}>
          {filteredAndSortedItems.map(item => (
            <div 
              key={item.id} 
              className={styles.compactCard} 
              onDoubleClick={() => handleCardDoubleClick(item)}
              title="Dê um duplo clique para visualizar"
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(item.watchStatus), fontSize: '0.55rem', padding: '2px 4px' }}>
                {getStatusLabel(item.watchStatus)}
              </div>
              
              {item.posterUrl ? (
                <div className={styles.compactCoverContainer}>
                  <img
                    src={item.posterUrl}
                    alt=""
                    aria-hidden="true"
                    className={styles.coverBlurBg}
                  />
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className={styles.coverImage}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className={styles.compactCoverPlaceholder}>Sem Capa</div>
              )}

              <div className={styles.compactInfo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 className={styles.compactCardTitle} title={item.title}>{item.title}</h4>
                  {item.rating?.overall !== null && item.rating?.overall !== undefined && (
                    <span style={{ 
                      fontFamily: "'DM Mono', monospace", 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      color: 'var(--accent)',
                      marginLeft: '0.25rem'
                    }}>
                      ★{item.rating.overall}
                    </span>
                  )}
                </div>
                <span className={styles.category}>{item.category}</span>
                
                <div className={styles.footer} style={{ paddingTop: '0.35rem' }}>
                  <span className={styles.progress} style={{ fontSize: '0.7rem' }}>
                    {hasQuickAction(item.category) && (() => {
                      const state = getItemProgressState(item)
                      return (
                        <>
                          {state.curEp}{state.epCeiling ? `/${state.epCeiling}` : ''}
                        </>
                      )
                    })()}
                  </span>
                  {hasQuickAction(item.category) && (() => {
                    const state = getItemProgressState(item)
                    const titleText = state.isTrulyMaxed
                      ? 'Teto máximo atingido'
                      : state.isAtCurrentCeiling && state.hasNextSeason
                      ? `Concluir temporada e avançar para Temporada ${state.currentSeason + 1}`
                      : `Adicionar +1 ${getProgressLabel(item.category)}`

                    return (
                      <button 
                        className={styles.plusBtn} 
                        onClick={(e) => handleIncrement(item.id, e)}
                        disabled={state.isTrulyMaxed}
                        style={{ width: '20px', height: '20px', fontSize: '0.7rem', ...(state.isTrulyMaxed ? { opacity: 0.35, cursor: 'not-allowed' } : {}) }}
                        title={titleText}
                      >
                        +1
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. MODO LISTA / DETALHES */}
      {viewMode === 'list' && (
        <div className={styles.listView}>
          {filteredAndSortedItems.map(item => (
            <div 
              key={item.id} 
              className={styles.listRow} 
              onDoubleClick={() => handleCardDoubleClick(item)}
              title="Dê um duplo clique para visualizar detalhes"
            >
              <div className={styles.listThumb}>
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt={item.title} className={styles.listThumbImg} loading="lazy" />
                ) : (
                  <span className={styles.listThumbFallback}>🎬</span>
                )}
              </div>

              <div className={styles.listMainInfo}>
                <div className={styles.listTitleRow}>
                  <span className={styles.listTitle}>{item.title}</span>
                  {item.rating?.overall !== null && item.rating?.overall !== undefined && (
                    <span className={styles.listRating}>★ {item.rating.overall}</span>
                  )}
                </div>
                <div className={styles.listSubRow}>
                  <span className={styles.listCategory}>{item.category}</span>
                  {(item.releaseYear || item.releaseDate) && (
                    <span className={styles.listYear}>• {item.releaseYear || item.releaseDate?.split('-')[0]}</span>
                  )}
                </div>
              </div>

              <div className={styles.listStatusBadge} style={{ backgroundColor: getStatusColor(item.watchStatus) }}>
                {getStatusLabel(item.watchStatus)}
              </div>

              <div className={styles.listProgressSection}>
                {hasQuickAction(item.category) && (() => {
                  const state = getItemProgressState(item)
                  const titleText = state.isTrulyMaxed
                    ? 'Teto máximo atingido'
                    : state.isAtCurrentCeiling && state.hasNextSeason
                    ? `Concluir temporada e avançar para Temporada ${state.currentSeason + 1}`
                    : `Adicionar +1 ${getProgressLabel(item.category)}`

                  return (
                    <div className={styles.listProgressRow}>
                      <span className={styles.listProgressText}>
                        {state.isSeriesOrAnime && item.progress.currentSeason ? (
                          `T${item.progress.currentSeason} · `
                        ) : ''}
                        {getProgressLabel(item.category)}: {state.curEp}{state.epCeiling ? ` / ${state.epCeiling}` : ''}
                      </span>
                      <button 
                        className={styles.plusBtn} 
                        onClick={(e) => handleIncrement(item.id, e)}
                        disabled={state.isTrulyMaxed}
                        style={state.isTrulyMaxed ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                        title={titleText}
                      >
                        +1
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
