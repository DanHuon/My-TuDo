import { useState, useEffect, useRef, useCallback } from 'react';
import { db, DBItem } from './db';

const SYNC_FILE_NAME = process.env.NEXT_PUBLIC_SYNC_FILE_NAME || 'sync.json';
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 5000; // 5 seconds

export function useSync(accessToken: string | undefined) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);

  // We need to access the latest sync function in our event listeners
  // but we can't depend on it in useEffect without re-subscribing.
  // We'll use a ref.
  const syncFuncRef = useRef<((isAuto?: boolean) => Promise<void>) | null>(null);

  const scheduleNextSync = useCallback(() => {
    if (periodicTimerRef.current) clearTimeout(periodicTimerRef.current);
    periodicTimerRef.current = setTimeout(() => {
      if (syncFuncRef.current) syncFuncRef.current(true);
    }, AUTO_SYNC_INTERVAL);
  }, []);

  const sync = useCallback(async (isAuto = false) => {
    if (!accessToken) return;
    if (isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    setIsSyncing(true);
    
    try {
      const cacheBuster = `&t=${Date.now()}`;
      // 1. Find sync.json in appDataFolder
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${SYNC_FILE_NAME}'&fields=files(id)${cacheBuster}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      const searchData = await searchRes.json();
      let fileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;
      
      let remoteItems: DBItem[] = [];
      
      // 2. Download remote items if file exists
      if (fileId) {
        const fileRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media${cacheBuster}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (fileRes.ok) {
          remoteItems = await fileRes.json();
        }
      }

      // 3. Get local items
      const localItems = await db.items.toArray();

      // 4. Merge (Last-Write-Wins)
      const mergedMap = new Map<string, DBItem>();
      
      for (const item of remoteItems) {
        mergedMap.set(item.id, item);
      }
      
      for (const local of localItems) {
        const remote = mergedMap.get(local.id);
        if (!remote) {
          mergedMap.set(local.id, local);
        } else {
          const localTime = new Date(local.updatedAt).getTime();
          const remoteTime = new Date(remote.updatedAt).getTime();
          if (localTime > remoteTime) {
            mergedMap.set(local.id, local);
          }
        }
      }
      
      const mergedItems = Array.from(mergedMap.values());

      // 5. Update local DB
      await db.items.bulkPut(mergedItems);

      // 6. Upload back to Drive
      const fileContent = JSON.stringify(mergedItems);

      if (!fileId) {
        // Create file metadata first
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: SYNC_FILE_NAME,
            parents: ['appDataFolder'],
          }),
        });
        const createData = await createRes.json();
        fileId = createData.id;
      }

      // Upload content
      if (fileId) {
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        });
      }

      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      // Restart the 5-minute timer so they don't overlap
      scheduleNextSync();
    }
  }, [accessToken, scheduleNextSync]);

  syncFuncRef.current = sync;

  // Setup auto-sync triggers
  useEffect(() => {
    if (!accessToken) return;

    // Trigger initial sync on mount
    sync(true);

    // 1. Sync on Window Focus
    const handleFocus = () => {
      sync(true);
    };
    window.addEventListener('focus', handleFocus);

    // 2. Flush Debounce on Visibility Change (Tab switch / Blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && syncTimeoutRef.current) {
        // We have a pending debounce, execute it immediately
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
        sync(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Debounced Sync on Local DB Change
    const handleDbChange = () => {
      if (isSyncingRef.current) return; // Ignore changes caused by sync itself
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncTimeoutRef.current = null;
        if (syncFuncRef.current) syncFuncRef.current(true);
      }, DEBOUNCE_DELAY);
    };

    window.addEventListener('dexie-local-change', handleDbChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('dexie-local-change', handleDbChange);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (periodicTimerRef.current) {
        clearTimeout(periodicTimerRef.current);
      }
    };
  }, [accessToken, sync]);

  return { sync, isSyncing, lastSync };
}
