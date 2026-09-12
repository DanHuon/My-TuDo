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

interface Props {
  note: StudyNote | null;
  onClose: () => void;
  initialMode?: 'view' | 'edit';
}

export default function StudyNoteEditor({ note, onClose, initialMode = 'edit' }: Props) {
  const [title, setTitle] = useState(note?.title || '');
  const [subject, setSubject] = useState(note?.subject || '');
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');
  const { session } = useAuth();

  const editor = useEditor({
    extensions: [
      StarterKit,
      DriveImageExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: note?.content || '',
    editable: isEditing,
    editorProps: {
      attributes: {
        class: styles.tiptapEditor,
      },
    },
  });

  const { openPicker } = useGooglePicker({
    accessToken: session?.accessToken,
    onPick: (file) => {
      if (editor) {
        editor.chain().focus().setDriveImage({ driveId: file.id, url: file.url }).run();
      }
    }
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
    }
  }, [note, editor]);

  const handleSave = async () => {
    if (!editor) return;
    const content = editor.getHTML();
    
    if (note) {
      await editStudyNote(note.id, title, content, subject, note.tags);
    } else {
      await addStudyNote(title, content, subject, []);
    }
    onClose();
  };

  const handleInsertImage = () => {
    openPicker();
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
        
        <input 
          type="text" 
          placeholder="Matéria / Assunto (Ex: React, UX Design)" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)}
          className={styles.subjectInput}
          readOnly={!isEditing}
        />

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
            <button onClick={handleInsertImage}>🖼️ Imagem</button>

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
    </div>
  );
}
