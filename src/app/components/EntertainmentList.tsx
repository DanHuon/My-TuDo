'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getEntertainments, editEntertainment } from '@/app/lib/db'
import { Entertainment } from '@/app/lib/types'
import EntertainmentForm from './EntertainmentForm'
import styles from './EntertainmentList.module.css'

type Tab = 'all' | 'series' | 'movie' | 'book' | 'game' | 'anime' | 'manga'
type StatusTab = 'all' | 'plan' | 'in_progress' | 'completed' | 'dropped'
type SortOption = 'alphaAsc' | 'alphaDesc' | 'createdDesc' | 'createdAsc' | 'updatedDesc' | 'updatedAsc' | 'ratingDesc' | 'ratingAsc' | 'startDesc' | 'startAsc' | 'endDesc' | 'endAsc'

export default function EntertainmentList() {
  const items = useLiveQuery(() => getEntertainments()) || []
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updatedDesc')
  
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Entertainment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleIncrement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Crucial for not triggering the card double click
    const item = items.find(i => i.id === id)
    if (!item) return
    const current = item.progress.currentEpisode || 0
    await editEntertainment(id, {
      progress: {
        ...item.progress,
        currentEpisode: current + 1
      }
    })
  }

  const handleCardDoubleClick = (item: Entertainment) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const getProgressLabel = (category: string) => {
    if (category === 'book') return 'Pág'
    if (category === 'manga') return 'Cap'
    return 'Ep'
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'plan': return 'Plan'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'dropped': return 'Dropped'
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

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className={styles.tabs} style={{ flex: 1, paddingTop: '0' }}>
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
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          style={{
            padding: '0.4rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--ink)',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            outline: 'none'
          }}
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

      {showForm && (
        <EntertainmentForm 
          itemToEdit={editingItem}
          onClose={() => { setShowForm(false); setEditingItem(null) }} 
          onAdded={() => { setShowForm(false); setEditingItem(null) }} 
        />
      )}

      <div className={styles.grid}>
        {filteredAndSortedItems.map(item => (
          <div 
            key={item.id} 
            className={styles.card} 
            onDoubleClick={() => handleCardDoubleClick(item)}
            title="Dê um duplo clique para editar"
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(item.watchStatus) }}>
              {getStatusLabel(item.watchStatus)}
            </div>
            
            {item.posterUrl ? (
              <img src={item.posterUrl} alt={item.title} className={styles.coverImage} loading="lazy" />
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
                  {hasQuickAction(item.category) && (
                    <>
                      {getProgressLabel(item.category)}: {item.progress.currentEpisode || 0}
                      {item.progress.totalEpisodes ? ` / ${item.progress.totalEpisodes}` : ''}
                    </>
                  )}
                </span>
                {hasQuickAction(item.category) && (
                  <button 
                    className={styles.plusBtn} 
                    onClick={(e) => handleIncrement(item.id, e)}
                    title={`Adicionar +1 ${getProgressLabel(item.category)}`}
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
