'use client';
import { useState } from 'react';
import { autoTagTask } from '@/app/lib/db';

export function AutoTagButton({ taskId, onTagsUpdated }: any) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAutoTag = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const success = await autoTagTask(taskId);
      if (success) {
        setFeedback('Tags aplicadas');
        if (onTagsUpdated) onTagsUpdated();
      } else {
        setFeedback('Sem tags afins');
      }
    } catch (error) {
      setFeedback('Falha na IA');
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <button 
      onClick={handleAutoTag} 
      disabled={loading}
      style={{
        background: 'none',
        border: '1px solid var(--border-dark)',
        color: feedback ? 'var(--accent)' : 'var(--ink-muted)',
        padding: '0.35rem 0.7rem',
        borderRadius: '3px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem',
        transition: 'all 0.3s ease',
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.05em'
      }}
    >
      {loading ? 'Analisando...' : feedback || 'Sugestão de Tags (IA)'}
    </button>
  );
}
