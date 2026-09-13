import { useEffect, useState, useCallback } from 'react';

// Extend window interface for Google Picker
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface UseGooglePickerProps {
  onPick: (file: { id: string, name: string, url: string, mimeType?: string }) => void;
  accessToken?: string;
  viewType?: 'images' | 'folders';
}

export function useGooglePicker({ onPick, accessToken, viewType = 'images' }: UseGooglePickerProps) {
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load the Google API script if not already present
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setIsPickerLoaded(true);
        });
      };
      document.body.appendChild(script);
    } else {
      // If already loaded, ensure picker is loaded
      if (window.gapi && window.google?.picker) {
        setIsPickerLoaded(true);
      } else if (window.gapi) {
        window.gapi.load('picker', () => {
          setIsPickerLoaded(true);
        });
      }
    }
  }, []);

  const openPicker = useCallback(() => {
    if (!isPickerLoaded || !window.google || !window.google.picker) {
      console.error('Google Picker API not loaded yet.');
      return;
    }

    if (!accessToken) {
      console.error('No access token provided to Google Picker.');
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_API_KEY is missing.');
      return;
    }

    const pickerCallback = (data: any) => {
      if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
        const doc = data[window.google.picker.Response.DOCUMENTS][0];
        onPick({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          mimeType: doc.mimeType,
        });
      }
    };

    let builder = new window.google.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback(pickerCallback)
      .setLocale('pt-BR');

    if (viewType === 'folders') {
      const myDriveView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS);
      myDriveView.setIncludeFolders(true);
      myDriveView.setSelectFolderEnabled(true);
      myDriveView.setMimeTypes('application/vnd.google-apps.folder');
      myDriveView.setParent('root');
      
      const sharedView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS);
      sharedView.setIncludeFolders(true);
      sharedView.setSelectFolderEnabled(true);
      sharedView.setMimeTypes('application/vnd.google-apps.folder');
      sharedView.setOwnedByMe(false);

      builder = builder.addView(myDriveView).addView(sharedView);
    } else {
      const imgView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES);
      imgView.setIncludeFolders(true);
      imgView.setParent('root');
      builder = builder.addView(imgView);
    }

    const picker = builder.build();

    picker.setVisible(true);
  }, [isPickerLoaded, accessToken, onPick, viewType]);

  return { openPicker, isPickerLoaded };
}
