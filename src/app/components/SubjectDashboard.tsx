import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getStudyNotes, deleteStudyNote } from '@/app/lib/db';
import { Subject, StudyNote } from '@/app/lib/types';
import { useAuth } from '@/app/lib/AuthContext';
import StudyNoteEditor from './StudyNoteEditor';
import styles from './SubjectDashboard.module.css';

interface Props {
  subject: Subject;
  onBack: () => void;
}

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink: string;
  mimeType: string;
}

export default function SubjectDashboard({ subject, onBack }: Props) {
  const { session } = useAuth();
  
  // Left Side: Notes
  const allNotes = useLiveQuery(() => getStudyNotes()) || [];
  const notes = allNotes.filter(n => n.subjectId === subject.id);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Right Side: Drive Scans
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');

  useEffect(() => {
    if (!subject.driveFolderId || !session?.accessToken) return;

    const fetchFiles = async () => {
      setLoadingDrive(true);
      setDriveError('');
      try {
        const query = `'${subject.driveFolderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/pdf') and trashed = false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,thumbnailLink,mimeType)&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Você não tem permissão para ler esta pasta. Verifique se ela foi compartilhada com você.');
          }
          if (res.status === 404) {
            throw new Error('Pasta não encontrada. Verifique se o link está correto ou se a pasta foi apagada.');
          }
          throw new Error('Falha ao carregar scans do Drive');
        }
        
        const data = await res.json();
        setDriveFiles(data.files || []);
      } catch (err: any) {
        setDriveError(err.message);
      } finally {
        setLoadingDrive(false);
      }
    };

    fetchFiles();
  }, [subject.driveFolderId, session?.accessToken]);

  const handleCreateNew = () => {
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

  // Group notes by topic
  const groupedNotes = notes.reduce((acc, note) => {
    const topic = note.topic || 'Geral';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(note);
    return acc;
  }, {} as Record<string, StudyNote[]>);

  // Drag and Drop (Injection into TipTap is complex, we will handle click-to-inject in a moment)
  // For now, if we click an image and the editor is open, we can dispatch an event to the editor.
  const handleInjectImage = (file: DriveFile) => {
    if (!isCreating && !selectedNote) {
      alert('Abra ou crie uma nota primeiro para injetar a imagem.');
      return;
    }
    // Dispatch a custom event that StudyNoteEditor can listen to
    window.dispatchEvent(new CustomEvent('inject-drive-image', { detail: { id: file.id } }));
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header} style={{ borderBottomColor: subject.color }}>
        <div className={styles.headerLeft}>
          <button onClick={onBack} className={styles.backBtn}>← Voltar</button>
          <h2 className={styles.title} style={{ color: subject.color }}>{subject.name}</h2>
        </div>
      </header>

      <div className={styles.splitPane}>
        {/* Lado Esquerdo: Anotações */}
        <div className={styles.paneLeft}>
          <div className={styles.paneHeader}>
            <h3>Anotações</h3>
            <button onClick={handleCreateNew} className={styles.addBtn}>+ Nova Nota</button>
          </div>

          <div className={styles.notesList}>
            {Object.keys(groupedNotes).map(topic => (
              <div key={topic} className={styles.topicGroup}>
                <h4 className={styles.topicTitle}>{topic}</h4>
                {groupedNotes[topic].map(note => (
                  <div key={note.id} className={styles.noteItem} onClick={() => handleEdit(note)}>
                    <span className={styles.noteTitle}>{note.title || 'Sem título'}</span>
                    <button onClick={(e) => handleDelete(note.id, e)} className={styles.deleteNoteBtn}>×</button>
                  </div>
                ))}
              </div>
            ))}
            {notes.length === 0 && <p className={styles.emptyText}>Nenhuma anotação nesta matéria.</p>}
          </div>
        </div>

        {/* Lado Direito: Scans */}
        <div className={styles.paneRight}>
          <div className={styles.paneHeader}>
            <h3>Scans da Nuvem {subject.driveFolderId ? '☁️' : '🚫'}</h3>
          </div>
          
          <div className={styles.gallery}>
            {!subject.driveFolderId && (
              <p className={styles.emptyText}>Nenhuma pasta do Drive vinculada. Edite a matéria para vincular.</p>
            )}
            
            {loadingDrive && <p className={styles.emptyText}>Carregando scans...</p>}
            {driveError && <p className={styles.errorText}>{driveError}</p>}
            
            {!loadingDrive && !driveError && driveFiles.map(file => (
              <div key={file.id} className={styles.scanCard} onClick={() => handleInjectImage(file)} title="Clique para injetar na anotação aberta">
                {file.thumbnailLink ? (
                  <img src={file.thumbnailLink} alt={file.name} className={styles.scanImg} />
                ) : (
                  <div className={styles.scanFallback}>📄</div>
                )}
                <span className={styles.scanName}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(isCreating || selectedNote) && (
        <div className={styles.editorOverlay}>
          <StudyNoteEditor 
            note={selectedNote} 
            onClose={closeEditor} 
            initialMode={isCreating ? 'edit' : 'view'}
            subjectId={subject.id} // We need to pass subjectId down to auto-link
          />
        </div>
      )}
    </div>
  );
}
