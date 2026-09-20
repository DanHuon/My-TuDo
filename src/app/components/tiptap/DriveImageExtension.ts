import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DriveImageNode from './DriveImageNode';

export interface DriveImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    driveImage: {
      setDriveImage: (options: { driveId: string, url?: string, alignment?: 'left' | 'center' | 'right' }) => ReturnType;
      setImageAlignment: (alignment: 'left' | 'center' | 'right') => ReturnType;
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
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment || 'center',
        }),
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
    return ReactNodeViewRenderer(DriveImageNode, {
      attrs: ({ node }) => {
        const alignment = node.attrs.alignment || 'center';
        return {
          'data-alignment': alignment,
          class: `node-driveImage align-${alignment}`,
        };
      },
    });
  },

  addCommands() {
    return {
      setDriveImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            'data-drive-id': options.driveId,
            alignment: options.alignment || 'center',
          },
        });
      },
      setImageAlignment: (alignment) => ({ commands }) => {
        return commands.updateAttributes(this.name, { alignment });
      },
    };
  },
});
