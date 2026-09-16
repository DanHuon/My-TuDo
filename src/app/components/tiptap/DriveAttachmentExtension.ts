import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DriveAttachmentNode from './DriveAttachmentNode';

export interface DriveAttachmentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    driveAttachment: {
      setDriveAttachment: (options: {
        driveId?: string;
        name: string;
        url: string;
        mimeType?: string;
        size?: string;
      }) => ReturnType;
    };
  }
}

export const DriveAttachmentExtension = Node.create<DriveAttachmentOptions>({
  name: 'driveAttachment',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-drive-id': {
        default: null,
      },
      'data-name': {
        default: 'Anexo',
      },
      'data-url': {
        default: '',
      },
      'data-mime': {
        default: '',
      },
      'data-size': {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'drive-attachment',
      },
      {
        tag: 'div[data-type="drive-attachment"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['drive-attachment', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DriveAttachmentNode);
  },

  addCommands() {
    return {
      setDriveAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              'data-drive-id': options.driveId || null,
              'data-name': options.name,
              'data-url': options.url,
              'data-mime': options.mimeType || '',
              'data-size': options.size || '',
            },
          });
        },
    };
  },
});
