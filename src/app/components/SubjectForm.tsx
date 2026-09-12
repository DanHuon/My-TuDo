import React, { useState } from 'react';
import { Subject } from '@/app/lib/types';
import { addSubject, editSubject } from '@/app/lib/db';
import { useAuth } from '@/app/lib/AuthContext';
import { useGooglePicker } from '@/app/hooks/useGooglePicker';
import styles from './SubjectForm.module.css';

interface Props {
  subject?: Subject | null;
  onClose: () => void;
}

export default function SubjectForm({ subject, onClose }: Props) {
  const [name, setName] = useState(subject?.name || '');
  const [color, setColor] = useState(subject?.color || '#c8442f');
  const [driveFolderId, setDriveFolderId] = useState(subject?.driveFolderId || '');
  const [folderName, setFolderName] = useState(subject?.driveFolderId ? 'Pasta Vinculada' : '');
  
  const { session } = useAuth();

  const { openPicker } = useGooglePicker({
    accessToken: session?.accessToken,
    viewType: 'folders',
    onPick: (file) => {
      setDriveFolderId(file.id);
      setFolderName(file.name);
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (subject) {
      await editSubject(subject.id, name, color, driveFolderId || undefined);
    } else {
      await addSubject(name, color, driveFolderId || undefined);
    }
    onClose();
  };

  const PRESET_COLORS = [
    '#c8442f', '#4a7c59', '#e56b58', '#67a67b', '#4a2822', '#1a1714', '#b8b2aa', '#4285F4', '#FBBC05'
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>{subject ? 'Editar Matéria' : 'Nova Matéria'}</h2>
        
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.field}>
            <label>Nome da Matéria</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: Anatomia, Cálculo I"
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label>Cor de Identificação</label>
            <div className={styles.colorPicker}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorBtn} ${color === c ? styles.selectedColor : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Google Drive (Opcional)</label>
            <p className={styles.hint}>Vincule uma pasta do seu Drive para ver os scans e PDFs diretamente no Dashboard da matéria.</p>
            <div className={styles.driveRow}>
              <button type="button" onClick={openPicker} className={styles.pickerBtn}>
                📁 {driveFolderId ? 'Trocar Pasta' : 'Vincular Pasta'}
              </button>
              {folderName && <span className={styles.folderName}>{folderName}</span>}
              {driveFolderId && (
                <button type="button" onClick={() => { setDriveFolderId(''); setFolderName(''); }} className={styles.clearBtn}>
                  ×
                </button>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
            <button type="submit" className={styles.saveBtn}>Salvar Matéria</button>
          </div>
        </form>
      </div>
    </div>
  );
}
