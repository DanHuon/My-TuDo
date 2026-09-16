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

export interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
  mimeType: string;
}

export default function SubjectDashboard({ subject, onBack }: Props) {
  const { session } = useAuth();
  
  // Left Side: Notes
  const allNotes = useLiveQuery(() => getStudyNotes()) || [];
  const notes = allNotes.filter(n => n.subjectId === subject.id);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialNoteData, setInitialNoteData] = useState<{ title?: string; content?: string } | null>(null);

  // Right Side: Drive Scans
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');

  // Lightbox Preview
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!subject.driveFolderId || !session?.accessToken) return;

    const fetchFiles = async () => {
      setLoadingDrive(true);
      setDriveError('');
      try {
        const query = `'${subject.driveFolderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/pdf') and trashed = false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,thumbnailLink,webViewLink,iconLink,size,mimeType)&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        
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
        setDriveError(err.message || 'Erro ao carregar arquivos da pasta vinculada.');
      } finally {
        setLoadingDrive(false);
      }
    };

    fetchFiles();
  }, [subject.driveFolderId, session?.accessToken]);

  // Load high-resolution preview blob when an image is clicked
  useEffect(() => {
    if (!previewFile || !session?.accessToken) {
      setPreviewBlobUrl(null);
      return;
    }
    if (!previewFile.mimeType.startsWith('image/')) {
      setPreviewBlobUrl(null);
      return;
    }

    let isMounted = true;
    setPreviewLoading(true);
    fetch(`https://www.googleapis.com/drive/v3/files/${previewFile.id}?alt=media`, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Falha ao carregar imagem');
        return r.blob();
      })
      .then(blob => {
        if (isMounted) {
          setPreviewBlobUrl(URL.createObjectURL(blob));
          setPreviewLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setPreviewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [previewFile, session?.accessToken]);

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedNote(null);
    setInitialNoteData(null);
  };

  const handleEdit = (note: StudyNote) => {
    setSelectedNote(note);
    setIsCreating(false);
    setInitialNoteData(null);
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
    setInitialNoteData(null);
  };

  // Group notes by topic
  const groupedNotes = notes.reduce((acc, note) => {
    const topic = note.topic || 'Geral';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(note);
    return acc;
  }, {} as Record<string, StudyNote[]>);

  const handleCreateNoteFromScan = (file: DriveFile) => {
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    let initialContent = '';
    if (file.mimeType.startsWith('image/')) {
      initialContent = `<drive-image data-drive-id="${file.id}"></drive-image><p></p>`;
    } else {
      const fileUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
      initialContent = `<drive-attachment data-drive-id="${file.id}" data-name="${file.name}" data-url="${fileUrl}" data-mime="${file.mimeType}"></drive-attachment><p></p>`;
    }

    setInitialNoteData({
      title: cleanTitle,
      content: initialContent,
    });
    setSelectedNote(null);
    setIsCreating(true);
    setPreviewFile(null);
  };

  const handleCopyLink = (file: DriveFile) => {
    const url = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
            {driveError && (
              <div className={styles.errorContainer}>
                <span className={styles.errorIcon}>⚠️</span>
                <p className={styles.errorText}>{driveError}</p>
              </div>
            )}
            
            {!loadingDrive && !driveError && driveFiles.map(file => (
              <div
                key={file.id}
                className={styles.scanCard}
                onClick={() => setPreviewFile(file)}
                title="Clique para pré-visualizar e anexar"
              >
                {file.thumbnailLink ? (
                  <img src={file.thumbnailLink} alt={file.name} className={styles.scanImg} />
                ) : (
                  <div className={styles.scanFallback}>
                    {file.mimeType.includes('pdf') ? '📄' : '📁'}
                  </div>
                )}
                <span className={styles.scanName}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Pré-visualização (Lightbox) */}
      {previewFile && (
        <div className={styles.lightboxOverlay} onClick={() => setPreviewFile(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <header className={styles.lightboxHeader}>
              <h3 className={styles.lightboxTitle}>{previewFile.name}</h3>
              <button
                className={styles.lightboxCloseBtn}
                onClick={() => setPreviewFile(null)}
                title="Fechar"
              >
                ×
              </button>
            </header>

            <div className={styles.lightboxBody}>
              {previewFile.mimeType.startsWith('image/') ? (
                previewLoading ? (
                  <p className={styles.lightboxLoading}>Carregando imagem em alta resolução...</p>
                ) : previewBlobUrl ? (
                  <img src={previewBlobUrl} alt={previewFile.name} className={styles.lightboxImg} />
                ) : previewFile.thumbnailLink ? (
                  <img src={previewFile.thumbnailLink} alt={previewFile.name} className={styles.lightboxImg} />
                ) : (
                  <p className={styles.lightboxLoading}>Pré-visualização indisponível</p>
                )
              ) : previewFile.mimeType.includes('pdf') ? (
                <iframe
                  src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                  className={styles.pdfIframe}
                  title={previewFile.name}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <span style={{ fontSize: '3rem' }}>📄</span>
                  <p style={{ color: 'var(--ink-muted)', marginTop: '1rem' }}>
                    Visualização direta não suportada para este tipo de arquivo.
                  </p>
                </div>
              )}
            </div>

            <footer className={styles.lightboxActions}>
              <button
                className={styles.actionBtnSecondary}
                onClick={() => handleCopyLink(previewFile)}
              >
                {copiedLink ? '✓ Copiado!' : '📋 Copiar Link'}
              </button>
              <a
                href={previewFile.webViewLink || `https://drive.google.com/file/d/${previewFile.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionBtnSecondary}
              >
                Abrir no Drive ↗
              </a>
              <button
                className={styles.actionBtnPrimary}
                onClick={() => handleCreateNoteFromScan(previewFile)}
              >
                ➕ Criar Nova Nota com este anexo
              </button>
            </footer>
          </div>
        </div>
      )}

      {(isCreating || selectedNote) && (
        <div className={styles.editorOverlay}>
          <StudyNoteEditor 
            note={selectedNote} 
            initialTitle={initialNoteData?.title}
            initialContent={initialNoteData?.content}
            driveFiles={driveFiles}
            onClose={closeEditor} 
            initialMode={isCreating ? 'edit' : 'view'}
            subjectId={subject.id}
          />
        </div>
      )}
    </div>
  );
}

