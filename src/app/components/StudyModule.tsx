import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteSubject, getSubjects } from '@/app/lib/db';
import { Subject } from '@/app/lib/types';
import SubjectForm from './SubjectForm';
import SubjectDashboard from './SubjectDashboard';
import styles from './StudyModule.module.css';

export default function StudyModule() {
  const subjects = useLiveQuery(() => getSubjects()) || [];
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const handleCreateNew = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, subject: Subject) => {
    e.stopPropagation();
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente apagar esta Matéria e desvincular as anotações?')) {
      await deleteSubject(id);
    }
  };

  if (selectedSubject) {
    return <SubjectDashboard subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>📚 Faculdade & Estudos</h2>
        <button onClick={handleCreateNew} className={styles.addBtn}>+ Nova Matéria</button>
      </header>

      <div className={styles.grid}>
        {subjects.length === 0 && (
          <div className={styles.emptyState}>Nenhuma matéria encontrada. Crie sua primeira matéria!</div>
        )}
        
        {subjects.map(subject => (
          <div key={subject.id} className={styles.subjectCard} onClick={() => setSelectedSubject(subject)}>
            <div className={styles.colorStrip} style={{ backgroundColor: subject.color }} />
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h3 className={styles.subjectTitle}>{subject.name}</h3>
                <div>
                  <button onClick={(e) => handleEdit(e, subject)} className={styles.deleteBtn} style={{ fontSize: '1rem', marginRight: '5px' }}>✏️</button>
                  <button onClick={(e) => handleDelete(subject.id, e)} className={styles.deleteBtn}>×</button>
                </div>
              </div>
              <div className={styles.metaInfo}>
                {subject.driveFolderId && <span className={styles.driveIcon}>📁 Pasta Vinculada</span>}
                {!subject.driveFolderId && <span style={{ opacity: 0.5 }}>Sem pasta</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <SubjectForm 
          subject={editingSubject} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
