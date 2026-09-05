import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { StudyNote } from '@/app/lib/types';
import { addStudyNote, editStudyNote } from '@/app/lib/db';
import styles from './StudyNoteEditor.module.css';

interface Props {
  note: StudyNote | null;
  onClose: () => void;
  initialMode?: 'view' | 'edit';
}

export default function StudyNoteEditor({ note, onClose, initialMode = 'edit' }: Props) {
  const [title, setTitle] = useState(note?.title || '');
  const [subject, setSubject] = useState(note?.subject || '');
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
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

  const setLinkOrImage = () => {
    const url = window.prompt('URL da Imagem:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
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
            <button onClick={setLinkOrImage}>🖼️ Imagem</button>

            {editor?.isActive('table') && (
              <>
                <div className={styles.divider} />
                <button onClick={() => editor.chain().focus().addRowAfter().run()}>+ Linha</button>
                <button onClick={() => editor.chain().focus().deleteRow().run()}>- Linha</button>
                <button onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col</button>
                <button onClick={() => editor.chain().focus().deleteColumn().run()}>- Col</button>
                <button onClick={() => editor.chain().focus().deleteTable().run()} style={{ color: 'var(--red)' }}>Apagar Tabela</button>
              </>
            )}
          </div>
        )}

        <div className={styles.editorContainer} onClick={() => { if (isEditing && editor) editor.commands.focus('end') }}>
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
