import React, { useEffect, useState, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useAuth } from '@/app/lib/AuthContext';
import styles from './DriveImageNode.module.css';

export default function DriveImageNode(props: NodeViewProps) {
  const { node, updateAttributes, selected } = props;
  const driveId = node.attrs['data-drive-id'];
  const width = node.attrs.width;
  
  const { session } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!driveId) {
      setLoading(false);
      setError('ID não fornecido');
      return;
    }

    if (!session?.accessToken) {
      setLoading(false);
      setError('Acesso negado (Faça login novamente)');
      return;
    }

    let isMounted = true;
    let url: string | null = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        // We use alt=media to download the file content
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Falha ao carregar imagem do Drive');
        }

        const blob = await res.blob();
        if (isMounted) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(!navigator.onLine ? 'Anexo Offline' : 'Erro ao carregar');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [driveId, session?.accessToken]);

  // Resizing logic
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = imgRef.current?.clientWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(100, startWidth + (moveEvent.pageX - startX));
      updateAttributes({ width: newWidth });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper className={`${styles.container} ${selected ? styles.selected : ''}`} style={{ width: width ? `${width}px` : 'auto' }}>
      {loading && (
        <div className={styles.skeleton}>
          <div className={styles.spinner} />
          <span>Carregando do Drive...</span>
        </div>
      )}
      
      {error && (
        <div className={styles.skeleton}>
          <span style={{ fontSize: '1.5rem' }}>☁️</span>
          <span className={styles.error}>{error}</span>
        </div>
      )}

      {blobUrl && !loading && !error && (
        <>
          <img 
            ref={imgRef}
            src={blobUrl} 
            alt="Drive Attachment" 
            className={styles.image} 
            style={{ width: '100%' }}
          />
          {selected && (
            <div className={styles.resizeHandle} onMouseDown={startResize} />
          )}
        </>
      )}
    </NodeViewWrapper>
  );
}
