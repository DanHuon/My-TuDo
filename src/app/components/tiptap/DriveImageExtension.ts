import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DriveImageNode from './DriveImageNode';

export interface DriveImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    driveImage: {
      setDriveImage: (options: { driveId: string, url?: string }) => ReturnType;
    }
  }
}

export const DriveImageExtension = Node.create<DriveImageOptions>({
  name: 'driveImage',
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
      width: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'drive-image',
      },
      {
        tag: 'img[data-drive-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['drive-image', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DriveImageNode);
  },

  addCommands() {
    return {
      setDriveImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            'data-drive-id': options.driveId,
          },
        });
      },
    };
  },
});
