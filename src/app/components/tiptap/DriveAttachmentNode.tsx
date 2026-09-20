import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './DriveAttachmentNode.module.css';

export default function DriveAttachmentNode(props: NodeViewProps) {
  const { node, selected } = props;
  const driveId = node.attrs['data-drive-id'];
  const name = node.attrs['data-name'] || 'Anexo sem nome';
  const rawUrl = node.attrs['data-url'];
  const mimeType = node.attrs['data-mime'] || '';

  // Fallback URL to Google Drive preview/view if data-url is missing or generic
  const fileUrl = rawUrl || (driveId ? `https://drive.google.com/file/d/${driveId}/view` : '#');

  // Determine icon and label from MIME type or file extension
  const lowerName = name.toLowerCase();
  let icon = '📎';
  let typeLabel = 'Arquivo';

  const isPdf = mimeType.includes('pdf') || lowerName.endsWith('.pdf');

  if (isPdf) {
    icon = '📄';
    typeLabel = 'Documento PDF';
  } else if (mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) {
    icon = '🖼️';
    typeLabel = 'Imagem';
  } else if (mimeType.includes('presentation') || /\.(pptx?|key)$/i.test(lowerName)) {
    icon = '📽️';
    typeLabel = 'Apresentação';
  } else if (mimeType.includes('spreadsheet') || /\.(xlsx?|csv)$/i.test(lowerName)) {
    icon = '📊';
    typeLabel = 'Planilha';
  } else if (mimeType.includes('word') || mimeType.includes('document') || /\.(docx?|txt|md)$/i.test(lowerName)) {
    icon = '📝';
    typeLabel = 'Texto / Doc';
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPdf && driveId) {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('open-pdf-lightbox', {
          detail: {
            id: driveId,
            name: name,
            mimeType: mimeType || 'application/pdf',
            webViewLink: rawUrl || `https://drive.google.com/file/d/${driveId}/view`,
          },
        })
      );
    }
  };

  return (
    <NodeViewWrapper className={styles.cardWrapper}>
      <div className={`${styles.card} ${selected ? styles.cardSelected : ''}`} contentEditable={false}>
        <div className={styles.leftContent}>
          <div className={styles.iconContainer}>{icon}</div>
          <div className={styles.info}>
            <span className={styles.name} title={name}>
              {name}
            </span>
            <span className={styles.meta}>{typeLabel}</span>
          </div>
        </div>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionBtn}
          title={isPdf ? 'Visualizar PDF no aplicativo' : 'Abrir arquivo em uma nova aba'}
          onClick={handleOpen}
        >
          {isPdf ? 'Visualizar ↗' : 'Abrir ↗'}
        </a>
      </div>
    </NodeViewWrapper>
  );
}
