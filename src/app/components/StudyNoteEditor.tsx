import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { StudyNote } from '@/app/lib/types';
import { addStudyNote, editStudyNote } from '@/app/lib/db';
import styles from './StudyNoteEditor.module.css';
import { useAuth } from '@/app/lib/AuthContext';
import { useGooglePicker } from '@/app/hooks/useGooglePicker';
import { DriveImageExtension } from './tiptap/DriveImageExtension';
import { DriveAttachmentExtension } from './tiptap/DriveAttachmentExtension';
import { DriveFile } from './SubjectDashboard';

interface Props {
  note: StudyNote | null;
  onClose: () => void;
  initialMode?: 'view' | 'edit';
  subjectId: string;
  initialTitle?: string;
  initialContent?: string;
  driveFiles?: DriveFile[];
}

export default function StudyNoteEditor({
  note,
  onClose,
  initialMode = 'edit',
  subjectId,
  initialTitle = '',
  initialContent = '',
  driveFiles = [],
}: Props) {
  const [title, setTitle] = useState(note?.title || initialTitle || '');
  const [topic, setTopic] = useState(note?.topic || '');
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');
  const { session } = useAuth();

  // Attachment Modal State
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachTab, setAttachTab] = useState<'link' | 'scans' | 'picker'>('link');
  const [insertMode, setInsertMode] = useState<'embed' | 'card'>('embed');

  // Tab 1 (Link) States
  const [urlInput, setUrlInput] = useState('');
  const [linkName, setLinkName] = useState('');
  const [extractedDriveId, setExtractedDriveId] = useState<string | null>(null);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Tab 2 (Scans) States
  const [selectedScan, setSelectedScan] = useState<DriveFile | null>(null);

  // Tab 3 (Picker) States
  const [pickerSelectedFile, setPickerSelectedFile] = useState<{
    id: string;
    name: string;
    url: string;
    mimeType?: string;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      DriveImageExtension,
      DriveAttachmentExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: note?.content || initialContent || '',
    editable: isEditing,
    editorProps: {
      attributes: {
        class: styles.tiptapEditor,
      },
    },
  });

  const { openPicker } = useGooglePicker({
    accessToken: session?.accessToken,
    viewType: 'files',
    onPick: (file) => {
      setPickerSelectedFile(file);
      if (file.mimeType?.startsWith('image/')) {
        setInsertMode('embed');
      } else {
        setInsertMode('card');
      }
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (editor && note) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content);
      }
    } else if (editor && initialContent && !note) {
      if (editor.getHTML() !== initialContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [note, initialContent, editor]);

  // Listener for inject-drive-image from SubjectDashboard
  useEffect(() => {
    const handleInject = (e: CustomEvent) => {
      if (editor && isEditing) {
        editor.chain().focus().setDriveImage({ driveId: e.detail.id, url: '' }).run();
      }
    };
    window.addEventListener('inject-drive-image', handleInject as EventListener);
    return () => {
      window.removeEventListener('inject-drive-image', handleInject as EventListener);
    };
  }, [editor, isEditing]);

  // URL Regex parser for Google Drive URLs
  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    const trimmed = val.trim();

    if (!trimmed) {
      setExtractedDriveId(null);
      setIsUrlValid(false);
      setUrlError('');
      return;
    }

    // Google Drive URL Regex patterns
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i,
      /docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/i,
    ];

    let matchedId: string | null = null;
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        matchedId = match[1];
        break;
      }
    }

    if (matchedId) {
      setExtractedDriveId(matchedId);
      setIsUrlValid(true);
      setUrlError('');
      if (!linkName) {
        setLinkName('Arquivo do Google Drive');
      }
    } else {
      setExtractedDriveId(null);
      setIsUrlValid(false);
      setUrlError('URL do Drive não reconhecida. Cole um link válido de arquivo ou pasta.');
    }
  };

  const handleInsertAttachment = () => {
    if (!editor) return;

    if (attachTab === 'link') {
      if (!extractedDriveId) return;
      if (insertMode === 'embed') {
        editor.chain().focus().setDriveImage({ driveId: extractedDriveId, url: urlInput }).run();
      } else {
        editor.chain().focus().setDriveAttachment({
          driveId: extractedDriveId,
          name: linkName.trim() || 'Arquivo do Drive',
          url: urlInput.trim(),
          mimeType: 'drive',
        }).run();
      }
    } else if (attachTab === 'scans') {
      if (!selectedScan) return;
      if (insertMode === 'embed') {
        editor.chain().focus().setDriveImage({ driveId: selectedScan.id, url: selectedScan.webViewLink }).run();
      } else {
        const fileUrl = selectedScan.webViewLink || `https://drive.google.com/file/d/${selectedScan.id}/view`;
        editor.chain().focus().setDriveAttachment({
          driveId: selectedScan.id,
          name: selectedScan.name,
          url: fileUrl,
          mimeType: selectedScan.mimeType,
          size: selectedScan.size,
        }).run();
      }
    } else if (attachTab === 'picker') {
      if (!pickerSelectedFile) return;
      if (insertMode === 'embed') {
        editor.chain().focus().setDriveImage({ driveId: pickerSelectedFile.id, url: pickerSelectedFile.url }).run();
      } else {
        editor.chain().focus().setDriveAttachment({
          driveId: pickerSelectedFile.id,
          name: pickerSelectedFile.name,
          url: pickerSelectedFile.url,
          mimeType: pickerSelectedFile.mimeType,
        }).run();
      }
    }

    // Reset and close modal
    setShowAttachModal(false);
    setUrlInput('');
    setLinkName('');
    setExtractedDriveId(null);
    setSelectedScan(null);
    setPickerSelectedFile(null);
  };

  const handleSave = async () => {
    if (!editor) return;
    const content = editor.getHTML();
    
    if (note) {
      await editStudyNote(note.id, title, content, subjectId, topic, note.tags);
    } else {
      await addStudyNote(title, content, subjectId, topic, []);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <input 
            type="text" 
            placeholder="Título da Nota" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            readOnly={!isEditing}
          />
          {!isEditing && (
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>Editar</button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {isEditing && (
          <div className={styles.toolbarRow}>
            <input 
              type="text" 
              placeholder="Assunto (ex: Semana 1, Anatomia)" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              className={styles.subjectInput}
            />
          </div>
        )}

        {isEditing && (
          <div className={styles.toolbar}>
            <button onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? styles.active : ''}>B</button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? styles.active : ''}>I</button>
            <button onClick={() => editor?.chain().focus().toggleStrike().run()} className={editor?.isActive('strike') ? styles.active : ''}>S</button>
            <div className={styles.divider} />
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={editor?.isActive('heading', { level: 1 }) ? styles.active : ''}>H1</button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? styles.active : ''}>H2</button>
            <div className={styles.divider} />
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? styles.active : ''}>• Lista</button>
            <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? styles.active : ''}>1. Lista</button>
            <div className={styles.divider} />
            <button onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Tabela</button>
            <button onClick={() => setShowAttachModal(true)} title="Adicionar Imagem ou Anexo">📎 Anexo / Imagem</button>

            <div className={styles.divider} />
            <button onClick={() => editor?.chain().focus().addRowAfter().run()} disabled={!editor?.can().addRowAfter()}>+ Linha</button>
            <button onClick={() => editor?.chain().focus().deleteRow().run()} disabled={!editor?.can().deleteRow()}>- Linha</button>
            <button onClick={() => editor?.chain().focus().addColumnAfter().run()} disabled={!editor?.can().addColumnAfter()}>+ Col</button>
            <button onClick={() => editor?.chain().focus().deleteColumn().run()} disabled={!editor?.can().deleteColumn()}>- Col</button>
            <button onClick={() => editor?.chain().focus().deleteTable().run()} disabled={!editor?.can().deleteTable()} style={{ color: editor?.can().deleteTable() ? 'var(--red)' : 'inherit' }}>Apagar Tabela</button>
          </div>
        )}

        <div className={styles.editorContainer} onClick={(e) => { 
          if (isEditing && editor) {
            const target = e.target as HTMLElement;
            if (target.classList.contains(styles.editorContainer) || target.classList.contains(styles.editorContentWrapper)) {
              editor.commands.focus('end');
            }
          }
        }}>
          <EditorContent editor={editor} className={styles.editorContentWrapper} />
        </div>

        {isEditing && (
          <div className={styles.footer}>
            <button onClick={handleSave} className={styles.saveBtn}>Salvar Nota</button>
          </div>
        )}
      </div>

      {/* Modal Híbrido de Inserção de Anexo */}
      {showAttachModal && (
        <div className={styles.attachModalOverlay} onClick={() => setShowAttachModal(false)}>
          <div className={styles.attachModalContent} onClick={e => e.stopPropagation()}>
            <header className={styles.attachHeader}>
              <h3 className={styles.attachTitle}>Adicionar Imagem ou Anexo</h3>
              <button className={styles.closeBtn} onClick={() => setShowAttachModal(false)}>×</button>
            </header>

            <nav className={styles.attachTabs}>
              <button
                className={`${styles.attachTabBtn} ${attachTab === 'link' ? styles.attachTabBtnActive : ''}`}
                onClick={() => setAttachTab('link')}
              >
                🔗 Colar Link
              </button>
              <button
                className={`${styles.attachTabBtn} ${attachTab === 'scans' ? styles.attachTabBtnActive : ''}`}
                onClick={() => setAttachTab('scans')}
              >
                📁 Scans da Matéria {driveFiles.length > 0 ? `(${driveFiles.length})` : ''}
              </button>
              <button
                className={`${styles.attachTabBtn} ${attachTab === 'picker' ? styles.attachTabBtnActive : ''}`}
                onClick={() => setAttachTab('picker')}
              >
                ☁️ Google Drive
              </button>
            </nav>

            <div className={styles.attachBody}>
              {/* ABA 1: Colar Link */}
              {attachTab === 'link' && (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>URL do Google Drive</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ex: https://drive.google.com/file/d/1aBcD.../view"
                      value={urlInput}
                      onChange={e => handleUrlChange(e.target.value)}
                      autoFocus
                    />
                    {isUrlValid && extractedDriveId && (
                      <div className={styles.feedbackSuccess}>
                        <span>✓ ID detectado:</span>
                        <code>{extractedDriveId}</code>
                      </div>
                    )}
                    {urlError && (
                      <div className={styles.feedbackError}>
                        <span>⚠️</span>
                        <span>{urlError}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Nome de Exibição (Opcional)</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ex: Resumo da Aula 01"
                      value={linkName}
                      onChange={e => setLinkName(e.target.value)}
                    />
                  </div>

                  <div className={styles.modeSelector}>
                    <label className={styles.inputLabel}>Como deseja exibir?</label>
                    <div className={styles.modeOptions}>
                      <button
                        type="button"
                        className={`${styles.modeBtn} ${insertMode === 'embed' ? styles.modeBtnActive : ''}`}
                        onClick={() => setInsertMode('embed')}
                      >
                        🖼️ Incorporar no texto
                      </button>
                      <button
                        type="button"
                        className={`${styles.modeBtn} ${insertMode === 'card' ? styles.modeBtnActive : ''}`}
                        onClick={() => setInsertMode('card')}
                      >
                        📎 Linkar como anexo
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ABA 2: Scans da Matéria */}
              {attachTab === 'scans' && (
                <>
                  <label className={styles.inputLabel}>
                    Selecione um arquivo carregado da pasta desta matéria:
                  </label>
                  {driveFiles.length === 0 ? (
                    <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                      Nenhum scan encontrado na pasta desta matéria.
                    </p>
                  ) : (
                    <div className={styles.scansMiniGrid}>
                      {driveFiles.map(file => {
                        const isSelected = selectedScan?.id === file.id;
                        return (
                          <div
                            key={file.id}
                            className={`${styles.scanMiniCard} ${isSelected ? styles.scanMiniCardSelected : ''}`}
                            onClick={() => {
                              setSelectedScan(file);
                              if (file.mimeType.startsWith('image/')) {
                                setInsertMode('embed');
                              } else {
                                setInsertMode('card');
                              }
                            }}
                          >
                            {file.thumbnailLink ? (
                              <img src={file.thumbnailLink} alt={file.name} className={styles.scanMiniThumb} />
                            ) : (
                              <div className={styles.scanMiniFallback}>
                                {file.mimeType.includes('pdf') ? '📄' : '📁'}
                              </div>
                            )}
                            <span className={styles.scanMiniName} title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedScan && (
                    <div className={styles.modeSelector}>
                      <label className={styles.inputLabel}>Exibir como:</label>
                      <div className={styles.modeOptions}>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${insertMode === 'embed' ? styles.modeBtnActive : ''}`}
                          onClick={() => setInsertMode('embed')}
                        >
                          🖼️ Incorporar no texto
                        </button>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${insertMode === 'card' ? styles.modeBtnActive : ''}`}
                          onClick={() => setInsertMode('card')}
                        >
                          📎 Linkar como anexo
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ABA 3: Google Drive Picker */}
              {attachTab === 'picker' && (
                <div className={styles.pickerPromo}>
                  <div className={styles.pickerIcon}>☁️</div>
                  <p className={styles.pickerDesc}>
                    Navegue por todas as pastas do seu Google Drive ou pelos itens compartilhados com você.
                  </p>
                  <button type="button" className={styles.pickerTriggerBtn} onClick={openPicker}>
                    Abrir Seletor do Drive ↗
                  </button>

                  {pickerSelectedFile && (
                    <div style={{ width: '100%', marginTop: '1rem' }}>
                      <div className={styles.feedbackSuccess}>
                        <span>✓ Arquivo selecionado:</span>
                        <strong>{pickerSelectedFile.name}</strong>
                      </div>

                      <div className={styles.modeSelector} style={{ marginTop: '0.8rem' }}>
                        <label className={styles.inputLabel}>Exibir como:</label>
                        <div className={styles.modeOptions}>
                          <button
                            type="button"
                            className={`${styles.modeBtn} ${insertMode === 'embed' ? styles.modeBtnActive : ''}`}
                            onClick={() => setInsertMode('embed')}
                          >
                            🖼️ Incorporar no texto
                          </button>
                          <button
                            type="button"
                            className={`${styles.modeBtn} ${insertMode === 'card' ? styles.modeBtnActive : ''}`}
                            onClick={() => setInsertMode('card')}
                          >
                            📎 Linkar como anexo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className={styles.attachFooter}>
              <button
                type="button"
                className={styles.attachCancelBtn}
                onClick={() => setShowAttachModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.attachInsertBtn}
                onClick={handleInsertAttachment}
                disabled={
                  (attachTab === 'link' && !isUrlValid) ||
                  (attachTab === 'scans' && !selectedScan) ||
                  (attachTab === 'picker' && !pickerSelectedFile)
                }
              >
                Inserir na Nota
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

