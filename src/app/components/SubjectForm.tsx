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
  const [driveInput, setDriveInput] = useState(subject?.driveFolderId || '');
  const [driveInputStatus, setDriveInputStatus] = useState<'idle' | 'valid' | 'invalid'>(subject?.driveFolderId ? 'valid' : 'idle');
  
  const { session } = useAuth();

  const { openPicker } = useGooglePicker({
    accessToken: session?.accessToken,
    viewType: 'folders',
    onPick: (file) => {
      setDriveFolderId(file.id);
      setDriveInput(file.id); // It's already the ID, so it's valid
      setDriveInputStatus('valid');
    }
  });

  const handleDriveInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDriveInput(val);
    
    if (!val.trim()) {
      setDriveFolderId('');
      setDriveInputStatus('idle');
      return;
    }

    // Check if it's already just an ID (alphanumeric with dashes/underscores, usually 25+ chars)
    // Drive IDs are typically 28 to 33 characters. We can just check length and regex.
    if (/^[a-zA-Z0-9_-]{25,}$/.test(val)) {
      setDriveFolderId(val);
      setDriveInputStatus('valid');
      return;
    }

    // Try to extract via Regex
    const urlMatch = val.match(/\/folders\/([a-zA-Z0-9_-]+)/) || val.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (urlMatch && urlMatch[1]) {
      setDriveFolderId(urlMatch[1]);
      setDriveInputStatus('valid');
    } else {
      setDriveFolderId('');
      setDriveInputStatus('invalid');
    }
  };

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
            <p className={styles.hint}>Vincule uma pasta do seu Drive colando o link abaixo ou escolhendo no Picker.</p>
            
            <div className={styles.driveHybrid}>
              <div className={`${styles.inputWrapper} ${styles[driveInputStatus]}`}>
                <input 
                  type="text" 
                  value={driveInput} 
                  onChange={handleDriveInputChange}
                  placeholder="Cole o link da pasta ou o ID..."
                  className={styles.driveInput}
                />
                {driveInputStatus === 'valid' && <span className={styles.statusIcon}>✅</span>}
                {driveInputStatus === 'invalid' && <span className={styles.statusIcon}>❌</span>}
              </div>
              
              <button type="button" onClick={openPicker} className={styles.pickerBtn}>
                📁 Buscar
              </button>
            </div>
            
            {driveInputStatus === 'invalid' && (
              <span className={styles.errorText}>URL do Drive não reconhecida.</span>
            )}
            {driveInputStatus === 'valid' && driveInput !== driveFolderId && (
              <span className={styles.successText}>ID extraído: {driveFolderId}</span>
            )}
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
