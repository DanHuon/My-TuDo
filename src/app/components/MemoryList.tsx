'use client'

import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getMemories } from '@/app/lib/db'
import { formatDate } from '@/app/lib/formatDate'
import MemoryForm from './MemoryForm'
import styles from './MemoryList.module.css'
import { Memory } from '@/app/lib/types'

export default function MemoryList() {
  const memories = useLiveQuery(() => getMemories()) || []
  
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Memory | null>(null)
  
  const [importedContent, setImportedContent] = useState('')
  const [importedTitle, setImportedTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredMemories = memories.filter(memory => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return memory.title.toLowerCase().includes(q) || memory.content.toLowerCase().includes(q)
  })

  const handleExport = (memory: Memory, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `${memory.title ? memory.title + '\n\n' : ''}${memory.content}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Sanitização do nome do arquivo
    const safeTitle = memory.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'Memoria_Sem_Titulo'
    a.download = `${safeTitle}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      // Tenta extrair o nome do arquivo sem extensão
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      
      setImportedContent(content)
      setImportedTitle(fileNameWithoutExt)
      setEditingItem(null)
      setShowForm(true)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleCardDoubleClick = (memory: Memory) => {
    setEditingItem(memory)
    setShowForm(true)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Memórias</h2>
        <input 
          type="search" 
          className={styles.searchBar} 
          placeholder="Pesquisar memórias..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={styles.headerActions}>
          <input 
            type="file" 
            accept=".txt" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          <button onClick={handleImportClick} className={styles.actionBtn}>
            📥 Importar .txt
          </button>
          <button 
            onClick={() => { setEditingItem(null); setImportedContent(''); setImportedTitle(''); setShowForm(true) }} 
            className={styles.addBtn}
          >
            + Nova Memória
          </button>
        </div>
      </div>

      {showForm && (
        <MemoryForm 
          itemToEdit={editingItem}
          initialContent={importedContent}
          initialTitle={importedTitle}
          onClose={() => { setShowForm(false); setEditingItem(null); setImportedContent(''); setImportedTitle(''); }} 
          onAdded={() => { setShowForm(false); setEditingItem(null); setImportedContent(''); setImportedTitle(''); }}
        />
      )}

      <div className={styles.masonry}>
        {filteredMemories.map(memory => {
          // Checagem de edição: considerar Editado se diferença de tempo > 2 segundos
          const isEdited = new Date(memory.updatedAt).getTime() - new Date(memory.createdAt).getTime() > 2000

          return (
            <div 
              key={memory.id} 
              className={styles.card}
              onDoubleClick={() => handleCardDoubleClick(memory)}
              title="Dê um duplo clique para editar"
            >
              <div className={styles.cardHeader}>
                {memory.title && <h4 className={styles.cardTitle}>{memory.title}</h4>}
                <div className={styles.cardDate}>
                  <span>{formatDate(memory.createdAt, 'display')}</span>
                  {isEdited && <span style={{ fontSize: '0.6rem', fontStyle: 'italic', color: 'var(--ink-faint)' }}>Editado: {formatDate(memory.updatedAt, 'display')}</span>}
                </div>
              </div>
              
              <div className={styles.cardContentWrapper}>
                <div className={styles.cardContent}>
                  {memory.useMarkdown ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {memory.content}
                    </ReactMarkdown>
                  ) : (
                    memory.content
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.iconBtn} 
                  onClick={(e) => handleExport(memory, e)}
                  title="Exportar como .txt"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
