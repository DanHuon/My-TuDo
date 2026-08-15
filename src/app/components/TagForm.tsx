'use client'

import { useState, useRef } from 'react'
import styles from './TaskForm.module.css'

interface Props {
  onAdd: (name: string, description: string) => Promise<void>
}

export default function TagForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || submitting) return

    setSubmitting(true)
    try {
      await onAdd(name.trim(), description.trim())
      setName('')
      setDescription('')
      setShowDesc(false)
      nameRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome da tag por ia.."
          className={styles.titleInput}
          maxLength={30}
          autoComplete="off"
          disabled={submitting}
        />
        <div className={styles.inputLine} />
      </div>

      {showDesc ? (
        <div className={styles.descGroup}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição da tag (opcional)"
            className={styles.descInput}
            rows={2}
            maxLength={300}
            disabled={submitting}
          />
          <div className={styles.inputLine} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDesc(true)}
          className={styles.addDescBtn}
        >
          + descrição
        </button>
      )}

      <button
        type="submit"
        disabled={!name.trim() || submitting}
        className={styles.submitBtn}
      >
        {submitting ? (
          <span className={styles.submitSpinner} />
        ) : (
          <>
            <span className={styles.submitIcon}>◄</span>
            Criar Tag
          </>
        )}
      </button>
    </form>
  )
}
