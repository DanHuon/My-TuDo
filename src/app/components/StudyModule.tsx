import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addStudyNote, deleteStudyNote, getStudyNotes } from '@/app/lib/db';
import { StudyNote } from '@/app/lib/types';
import StudyNoteEditor from './StudyNoteEditor';
import styles from './StudyModule.module.css';

export default function StudyModule() {
  const notes = useLiveQuery(() => getStudyNotes()) || [];
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    setIsCreating(true);
    setSelectedNote(null);
  };

  const handleEdit = (note: StudyNote) => {
    setSelectedNote(note);
    setIsCreating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente apagar esta nota?')) {
      await deleteStudyNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    }
  };

  const closeEditor = () => {
    setSelectedNote(null);
    setIsCreating(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>📚 Cadernos & Estudos</h2>
        <button onClick={handleCreateNew} className={styles.addBtn}>+ Nova Nota</button>
      </header>

      <div className={styles.grid}>
        {notes.length === 0 && !isCreating && !selectedNote && (
          <div className={styles.emptyState}>Nenhuma nota encontrada. Crie a sua primeira nota!</div>
        )}
        
        {!isCreating && !selectedNote && notes.map(note => (
          <div key={note.id} className={styles.noteCard} onClick={() => handleEdit(note)}>
            <div className={styles.cardHeader}>
              <h3 className={styles.noteTitle}>{note.title || 'Sem título'}</h3>
              <button onClick={(e) => handleDelete(note.id, e)} className={styles.deleteBtn}>×</button>
            </div>
            {note.subject && <span className={styles.subjectBadge}>{note.subject}</span>}
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '') }} />
            <div className={styles.date}>
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {(isCreating || selectedNote) && (
        <StudyNoteEditor 
          note={selectedNote} 
          onClose={closeEditor} 
          initialMode={isCreating ? 'edit' : 'view'}
        />
      )}
    </div>
  );
}
