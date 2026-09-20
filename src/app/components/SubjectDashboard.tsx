import React, { useState, useEffect, useRef } from 'react';
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

interface FolderCrumb {
  id: string;
  name: string;
}

export default function SubjectDashboard({ subject, onBack }: Props) {
  const { session } = useAuth();
  
  // Left Side: Notes
  const allNotes = useLiveQuery(() => getStudyNotes()) || [];
  const notes = allNotes.filter(n => n.subjectId === subject.id);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [initialNoteData, setInitialNoteData] = useState<{ title?: string; content?: string } | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'notes' | 'scans'>('notes');

  // Right Side: Drive Scans & Subfolder Navigation
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');

  // Breadcrumbs Stack & In-Memory Cache (0ms instant transition on back/revisit)
  const [folderStack, setFolderStack] = useState<FolderCrumb[]>([]);
  const folderCacheRef = useRef<Record<string, DriveFile[]>>({});

  useEffect(() => {
    if (subject.driveFolderId) {
      setFolderStack([{ id: subject.driveFolderId, name: subject.name }]);
    } else {
      setFolderStack([]);
    }
  }, [subject.driveFolderId, subject.name]);

  const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;

  // Fetch files and subfolders
  const fetchFiles = async (folderId: string, forceRefresh = false) => {
    if (!session?.accessToken) return;

    if (!forceRefresh && folderCacheRef.current[folderId]) {
      setDriveFiles(folderCacheRef.current[folderId]);
      setDriveError('');
      return;
    }

    setLoadingDrive(true);
    setDriveError('');
    try {
      // 1. Validação explícita de permissão e existência da pasta (evita lista vazia silenciosa)
      const folderCheckUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,capabilities(canListChildren)&supportsAllDrives=true`;
      const folderRes = await fetch(folderCheckUrl, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      if (!folderRes.ok) {
        if (folderRes.status === 403) {
          throw new Error('Você não tem permissão para ler esta pasta. Verifique se ela foi compartilhada com você.');
        }
        if (folderRes.status === 404) {
          throw new Error('Pasta não encontrada ou privada. Verifique se o link está correto e se você tem acesso a ela.');
        }
        throw new Error('Falha ao verificar acesso à pasta do Drive.');
      }

      const folderMeta = await folderRes.json();
      if (folderMeta.capabilities && folderMeta.capabilities.canListChildren === false) {
        throw new Error('Você não tem permissão para visualizar o conteúdo desta pasta.');
      }

      // 2. Busca dos arquivos e subpastas
      const query = `'${folderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.folder') and trashed = false`;
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
      const files: DriveFile[] = data.files || [];

      // Sort: Folders first, then files
      files.sort((a, b) => {
        const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
        const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      folderCacheRef.current[folderId] = files;
      setDriveFiles(files);
    } catch (err: any) {
      setDriveError(err.message || 'Erro ao carregar arquivos da pasta vinculada.');
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    if (currentFolder?.id) {
      fetchFiles(currentFolder.id);
    } else {
      setDriveFiles([]);
    }
  }, [currentFolder?.id, session?.accessToken]);

  const handleOpenFolder = (folder: DriveFile) => {
    setFolderStack(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateToCrumb = (index: number) => {
    setFolderStack(prev => prev.slice(0, index + 1));
  };

  const handleRefreshFolder = () => {
    if (currentFolder?.id) {
      fetchFiles(currentFolder.id, true);
    }
  };

  // Lightbox Preview
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // Listener for open-pdf-lightbox from DriveAttachmentNode
  useEffect(() => {
    const handleOpenPdfLightbox = (e: Event) => {
      const customEvent = e as CustomEvent<DriveFile>;
      if (customEvent.detail) {
        setPreviewFile(customEvent.detail);
      }
    };
    window.addEventListener('open-pdf-lightbox', handleOpenPdfLightbox);
    return () => {
      window.removeEventListener('open-pdf-lightbox', handleOpenPdfLightbox);
    };
  }, []);

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedNote(null);
    setInitialNoteData(null);
    setActiveMobileTab('notes');
  };

  const handleEdit = (note: StudyNote) => {
    setSelectedNote(note);
    setIsCreating(false);
    setInitialNoteData(null);
    setActiveMobileTab('notes');
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
    setActiveMobileTab('notes');
  };

  const handleInjectIntoCurrentNote = (file: DriveFile) => {
    const fileUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
    window.dispatchEvent(new CustomEvent('inject-drive-image', {
      detail: {
        id: file.id,
        name: file.name,
        url: fileUrl,
        mimeType: file.mimeType,
        size: file.size,
      }
    }));
    setPreviewFile(null);
    setActiveMobileTab('notes');
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

      {/* Barra de Abas Mobile (Apenas telas <= 768px) */}
      <div className={styles.mobileTabBar}>
        <button
          type="button"
          className={`${styles.mobileTabBtn} ${activeMobileTab === 'notes' ? styles.mobileTabBtnActive : ''}`}
          onClick={() => setActiveMobileTab('notes')}
        >
          📝 Anotações {notes.length > 0 && `(${notes.length})`}
        </button>
        <button
          type="button"
          className={`${styles.mobileTabBtn} ${activeMobileTab === 'scans' ? styles.mobileTabBtnActive : ''}`}
          onClick={() => setActiveMobileTab('scans')}
        >
          ☁️ Scans {driveFiles.length > 0 && `(${driveFiles.length})`}
        </button>
      </div>

      <div className={styles.splitPane}>
        {/* Lado Esquerdo: Anotações ou Editor Embutido */}
        <div className={`${styles.paneLeft} ${activeMobileTab === 'notes' ? styles.paneActiveMobile : styles.paneHiddenMobile}`}>
          {(isCreating || selectedNote) ? (
            <StudyNoteEditor 
              note={selectedNote} 
              initialTitle={initialNoteData?.title}
              initialContent={initialNoteData?.content}
              driveFiles={driveFiles}
              onClose={closeEditor} 
              initialMode={isCreating ? 'edit' : 'view'}
              subjectId={subject.id}
              isEmbedded={true}
            />
          ) : (
            <>
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
                        <button onClick={(e) => handleDelete(note.id, e)} className={styles.deleteNoteBtn} title="Apagar nota">×</button>
                      </div>
                    ))}
                  </div>
                ))}
                {notes.length === 0 && <p className={styles.emptyText}>Nenhuma anotação nesta matéria.</p>}
              </div>
            </>
          )}
        </div>

        {/* Lado Direito: Scans */}
        <div className={`${styles.paneRight} ${activeMobileTab === 'scans' ? styles.paneActiveMobile : styles.paneHiddenMobile}`}>
          <div className={styles.paneHeader}>
            <h3>Scans da Nuvem {subject.driveFolderId ? '☁️' : '🚫'}</h3>
          </div>

          {/* Breadcrumbs de Navegação em Subpastas */}
          {folderStack.length > 0 && (
            <div className={styles.breadcrumbBar}>
              <div className={styles.breadcrumbPath}>
                {folderStack.map((crumb, idx) => {
                  const isLast = idx === folderStack.length - 1;
                  return (
                    <React.Fragment key={crumb.id + idx}>
                      <button
                        type="button"
                        className={`${styles.breadcrumbCrumb} ${isLast ? styles.breadcrumbCrumbActive : ''}`}
                        onClick={() => handleNavigateToCrumb(idx)}
                        disabled={isLast}
                        title={crumb.name}
                      >
                        {idx === 0 ? `📁 ${crumb.name}` : crumb.name}
                      </button>
                      {!isLast && <span className={styles.breadcrumbSeparator}>›</span>}
                    </React.Fragment>
                  );
                })}
              </div>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleRefreshFolder}
                title="Recarregar pasta atual"
              >
                ↻
              </button>
            </div>
          )}
          
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
            
            {!loadingDrive && !driveError && driveFiles.map(file => {
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

              if (isFolder) {
                return (
                  <div
                    key={file.id}
                    className={`${styles.scanCard} ${styles.folderCard}`}
                    onClick={() => handleOpenFolder(file)}
                    title={`Abrir subpasta: ${file.name}`}
                  >
                    <div className={styles.scanFallback}>📁</div>
                    <span className={styles.scanName}>{file.name}</span>
                    <span className={styles.folderBadge}>Pasta</span>
                  </div>
                );
              }

              return (
                <div
                  key={file.id}
                  className={styles.scanCard}
                  onClick={() => setPreviewFile(file)}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        id: file.id,
                        name: file.name,
                        mimeType: file.mimeType,
                        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
                        size: file.size,
                      })
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  title="Clique para pré-visualizar ou arraste para o editor"
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
              );
            })}
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
                type="button"
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
              {(isCreating || selectedNote) && (
                <button
                  type="button"
                  className={styles.actionBtnPrimary}
                  onClick={() => handleInjectIntoCurrentNote(previewFile)}
                  title="Insere este anexo no cursor da nota aberta"
                  style={{ background: 'var(--accent-hover)' }}
                >
                  📥 Inserir na nota aberta
                </button>
              )}
              <button
                type="button"
                className={styles.actionBtnPrimary}
                onClick={() => handleCreateNoteFromScan(previewFile)}
              >
                ➕ Criar Nova Nota com este anexo
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

