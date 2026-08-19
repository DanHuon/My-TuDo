import { useState } from 'react'
import { addMemory, editMemory, deleteMemory } from '@/app/lib/db'
import { Memory } from '@/app/lib/types'
import styles from './MemoryList.module.css'

interface Props {
  onClose: () => void
  onAdded: () => void
  initialContent?: string
  initialTitle?: string
  itemToEdit?: Memory | null
}

export default function MemoryForm({ onClose, onAdded, initialContent = '', initialTitle = '', itemToEdit }: Props) {
  const isEditing = !!itemToEdit

  const [title, setTitle] = useState(itemToEdit?.title || initialTitle)
  const [content, setContent] = useState(itemToEdit?.content || initialContent)
  const [useMarkdown, setUseMarkdown] = useState(itemToEdit ? itemToEdit.useMarkdown : false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !title.trim()) return

    if (isEditing && itemToEdit) {
      await editMemory(itemToEdit.id, title.trim(), content.trim(), itemToEdit.tags, useMarkdown)
    } else {
      await addMemory(title.trim(), content.trim(), [], useMarkdown)
    }
    onAdded()
  }

  const handleDelete = async () => {
    if (!itemToEdit) return
    if (confirm('Deletar esta memória para sempre?')) {
      await deleteMemory(itemToEdit.id)
      onAdded()
    }
  }

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.formHeader}>
              <input 
                className={styles.input} 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Título (Opcional)"
              />
              <button type="button" onClick={onClose} className={styles.iconBtn}>✕</button>
            </div>

            <textarea 
              className={styles.textarea} 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="O que está na sua mente?"
              required
            />

            <div className={styles.formControls}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={useMarkdown} 
                  onChange={(e) => setUseMarkdown(e.target.checked)} 
                />
                Usar formatação Markdown
                <span 
                  className={styles.helpBtn}
                  onClick={(e) => { e.preventDefault(); setShowHelpModal(true); }}
                  title="Ver documentação completa"
                >
                  ?
                </span>
              </label>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.addBtn} disabled={!content.trim() && !title.trim()} style={{ flex: 1 }}>
                {isEditing ? 'Salvar Edições' : 'Salvar Memória'}
              </button>
              {isEditing && (
                <button type="button" onClick={handleDelete} className={styles.addBtn} style={{ background: 'var(--accent)', flex: '0 0 auto' }}>
                  Deletar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowHelpModal(false)} style={{ zIndex: 2000 }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.formHeader} style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: 'var(--ink)' }}>Guia Markdown (`react-markdown` + `remark-gfm`)</h3>
              <button onClick={() => setShowHelpModal(false)} className={styles.iconBtn}>✕</button>
            </div>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: '1.6', overflowY: 'auto' }}>
              <p>O aplicativo suporta Markdown e a extensão GFM (GitHub Flavored Markdown). Aqui estão os principais comandos:</p>
              
              <h4 style={{ marginTop: '1rem', color: 'var(--ink)' }}>Títulos (Cabeçalhos)</h4>
              <code># Título H1</code><br/>
              <code>## Título H2</code><br/>
              <code>### Título H3</code><br/>

              <h4 style={{ marginTop: '1rem', color: 'var(--ink)' }}>Estilos de Texto</h4>
              <code>**Texto em negrito**</code><br/>
              <code>*Texto em itálico*</code><br/>
              <code>~~Texto tachado~~</code><br/>

              <h4 style={{ marginTop: '1rem', color: 'var(--ink)' }}>Listas</h4>
              <code>- Item de lista não ordenada</code><br/>
              <code>* Outro item não ordenado</code><br/>
              <code>1. Item de lista ordenada</code><br/>
              <code>2. Segundo item</code><br/>
              <code>- [ ] Tarefa não concluída</code><br/>
              <code>- [x] Tarefa concluída</code><br/>

              <h4 style={{ marginTop: '1rem', color: 'var(--ink)' }}>Links e Imagens</h4>
              <code>[Texto do Link](https://exemplo.com)</code><br/>
              <code>![Texto alternativo da imagem](https://exemplo.com/imagem.png)</code><br/>

              <h4 style={{ marginTop: '1rem', color: 'var(--ink)' }}>Citações e Código</h4>
              <code>&gt; Isto é uma citação (Blockquote)</code><br/>
              <code>`código inline`</code><br/>
              <code>```linguagem<br/>
                bloco de código<br/>
              ```</code><br/>

              <h4 style={{ marginTop: '1rem', color: 'var(--ink)' }}>Tabelas</h4>
              <code>| Coluna 1 | Coluna 2 |</code><br/>
              <code>| -------- | -------- |</code><br/>
              <code>| Célula 1 | Célula 2 |</code><br/>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
