import { useEffect, useState, useCallback } from 'react';

// Extend window interface for Google Picker
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface UseGooglePickerProps {
  onPick: (file: { id: string, name: string, url: string }) => void;
  accessToken?: string;
}

export function useGooglePicker({ onPick, accessToken }: UseGooglePickerProps) {
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
        });
      }
    };

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES);
    view.setIncludeFolders(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback(pickerCallback)
      .setLocale('pt-BR')
      .build();

    picker.setVisible(true);
  }, [isPickerLoaded, accessToken, onPick]);

  return { openPicker, isPickerLoaded };
}
