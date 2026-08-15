'use client';
import { useState } from 'react';
import { autoTagTask } from '@/app/lib/db';

export function AutoTagButton({ taskId, onTagsUpdated }: any) {
  const [loading, setLoading] = useState(false);

  const handleAutoTag = async () => {
    setLoading(true);
    try {
      const success = await autoTagTask(taskId);
      if (success) {
        if (onTagsUpdated) onTagsUpdated();
      } else {
        alert('Nenhuma tag compatível encontrada.');
      }
    } catch (error) {
      alert('Erro na IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAutoTag} 
      disabled={loading}
      style={{
        background: 'none',
        border: '1px solid var(--border-dark)',
        color: 'var(--ink-muted)',
        padding: '0.35rem 0.7rem',
        borderRadius: '3px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem',
        transition: 'all 0.3s ease',
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.05em'
      }}
    >
      {loading ? 'Analisando...' : 'Sugestão de Tags (IA)'}
    </button>
  );
}
