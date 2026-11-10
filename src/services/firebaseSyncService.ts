import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, storage, handleFirestoreError, OperationType, uploadUserBinaryFile, uploadUserDataUrl } from './firebase';
import { OSSettings, FileItem, CalendarEvent } from '../types/os';

export { db, auth, storage };
export type SyncStatus = 'idle' | 'saving' | 'synced' | 'error';

class FirebaseSyncService {
  private syncStatusListeners: ((status: SyncStatus) => void)[] = [];
  private currentStatus: SyncStatus = 'synced';
  private debounceTimers: { [key: string]: ReturnType<typeof setTimeout> } = {};

  public onSyncStatusChange(cb: (status: SyncStatus) => void) {
    this.syncStatusListeners.push(cb);
    cb(this.currentStatus);
    return () => {
      this.syncStatusListeners = this.syncStatusListeners.filter(l => l !== cb);
    };
  }

  private setStatus(status: SyncStatus) {
    this.currentStatus = status;
    this.syncStatusListeners.forEach(l => l(status));
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  // Load complete user desktop from Firestore
  public async loadUserData(userId: string): Promise<{
    settings?: OSSettings;
    iconPositions?: Record<string, { x: number; y: number }>;
    desktopSortBy?: 'name' | 'type' | 'date';
    files?: FileItem[];
    calendarEvents?: CalendarEvent[];
  } | null> {
    try {
      this.setStatus('saving');

      // 1. Settings
      const settingsRef = doc(db, 'users', userId, 'settings', 'current');
      const settingsSnap = await getDoc(settingsRef);
      const settingsData = settingsSnap.exists() ? (settingsSnap.data() as OSSettings) : undefined;

      // 2. Desktop Layout
      const desktopRef = doc(db, 'users', userId, 'desktop', 'layout');
      const desktopSnap = await getDoc(desktopRef);
      let iconPositions: Record<string, { x: number; y: number }> | undefined;
      let desktopSortBy: 'name' | 'type' | 'date' | undefined;
      if (desktopSnap.exists()) {
        const dData = desktopSnap.data();
        iconPositions = dData.iconPositions;
        desktopSortBy = dData.desktopSortBy;
      }

      // 3. Files
      const filesColRef = collection(db, 'users', userId, 'files');
      const filesSnap = await getDocs(filesColRef);
      const files: FileItem[] = [];
      filesSnap.forEach(d => {
        files.push(d.data() as FileItem);
      });

      // 4. Calendar Events
      const calColRef = collection(db, 'users', userId, 'calendar');
      const calSnap = await getDocs(calColRef);
      const calendarEvents: CalendarEvent[] = [];
      calSnap.forEach(d => {
        calendarEvents.push(d.data() as CalendarEvent);
      });

      this.setStatus('synced');

      return {
        settings: settingsData,
        iconPositions,
        desktopSortBy,
        files: files.length > 0 ? files : undefined,
        calendarEvents: calendarEvents.length > 0 ? calendarEvents : undefined,
      };
    } catch (err) {
      console.error('Error loading user data from Firestore:', err);
      this.setStatus('error');
      return null;
    }
  }

  // Save Settings with Debounce
  public saveSettings(userId: string, settings: OSSettings) {
    if (!userId) return;
    if (this.debounceTimers['settings']) {
      clearTimeout(this.debounceTimers['settings']);
    }

    this.setStatus('saving');
    this.debounceTimers['settings'] = setTimeout(async () => {
      try {
        const settingsRef = doc(db, 'users', userId, 'settings', 'current');
        await setDoc(settingsRef, {
          ...settings,
          userId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        this.setStatus('synced');
      } catch (e) {
        console.error('Failed to save settings to Firestore:', e);
        this.setStatus('error');
      }
    }, 800);
  }

  // Save Desktop Layout
  public saveDesktopLayout(
    userId: string,
    iconPositions: Record<string, { x: number; y: number }>,
    desktopSortBy: 'name' | 'type' | 'date'
  ) {
    if (!userId) return;
    if (this.debounceTimers['desktop']) {
      clearTimeout(this.debounceTimers['desktop']);
    }

    this.setStatus('saving');
    this.debounceTimers['desktop'] = setTimeout(async () => {
      try {
        const desktopRef = doc(db, 'users', userId, 'desktop', 'layout');
        await setDoc(desktopRef, {
          userId,
          iconPositions,
          desktopSortBy,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        this.setStatus('synced');
      } catch (e) {
        console.error('Failed to save desktop layout to Firestore:', e);
        this.setStatus('error');
      }
    }, 800);
  }

  // Save Single Virtual File
  public async saveFile(userId: string, file: FileItem): Promise<void> {
    if (!userId) return;
    this.setStatus('saving');
    try {
      const fileRef = doc(db, 'users', userId, 'files', file.id);
      await setDoc(fileRef, {
        ...file,
        userId,
      }, { merge: true });
      this.setStatus('synced');
    } catch (e) {
      console.error('Failed to save file to Firestore:', e);
      this.setStatus('error');
    }
  }

  // Delete Virtual File
  public async deleteFile(userId: string, fileId: string): Promise<void> {
    if (!userId) return;
    this.setStatus('saving');
    try {
      const fileRef = doc(db, 'users', userId, 'files', fileId);
      await deleteDoc(fileRef);
      this.setStatus('synced');
    } catch (e) {
      console.error('Failed to delete file from Firestore:', e);
      this.setStatus('error');
    }
  }

  // Batch Save all Files (useful on first cloud migration)
  public async saveAllFiles(userId: string, files: FileItem[]): Promise<void> {
    if (!userId || files.length === 0) return;
    this.setStatus('saving');
    try {
      const batch = writeBatch(db);
      files.forEach(f => {
        const fileRef = doc(db, 'users', userId, 'files', f.id);
        batch.set(fileRef, { ...f, userId }, { merge: true });
      });
      await batch.commit();
      this.setStatus('synced');
    } catch (e) {
      console.error('Failed to batch save files to Firestore:', e);
      this.setStatus('error');
    }
  }

  // Save Single Calendar Event
  public async saveCalendarEvent(userId: string, event: CalendarEvent): Promise<void> {
    if (!userId) return;
    this.setStatus('saving');
    try {
      const eventRef = doc(db, 'users', userId, 'calendar', event.id);
      await setDoc(eventRef, {
        ...event,
        userId,
      }, { merge: true });
      this.setStatus('synced');
    } catch (e) {
      console.error('Failed to save calendar event to Firestore:', e);
      this.setStatus('error');
    }
  }

  // Delete Calendar Event
  public async deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
    if (!userId) return;
    this.setStatus('saving');
    try {
      const eventRef = doc(db, 'users', userId, 'calendar', eventId);
      await deleteDoc(eventRef);
      this.setStatus('synced');
    } catch (e) {
      console.error('Failed to delete calendar event from Firestore:', e);
      this.setStatus('error');
    }
  }

  // Upload Binary to Firebase Storage & return URL
  public async uploadBinary(userId: string, path: string, blob: Blob): Promise<string> {
    this.setStatus('saving');
    try {
      const url = await uploadUserBinaryFile(userId, path, blob);
      this.setStatus('synced');
      return url;
    } catch (e) {
      console.error('Failed to upload binary to Firebase Storage:', e);
      this.setStatus('error');
      throw e;
    }
  }

  // Upload DataURL (e.g. Paint drawing or custom wallpaper) to Storage
  public async uploadDataUrl(userId: string, path: string, dataUrl: string): Promise<string> {
    this.setStatus('saving');
    try {
      const url = await uploadUserDataUrl(userId, path, dataUrl);
      this.setStatus('synced');
      return url;
    } catch (e) {
      console.error('Failed to upload dataUrl to Firebase Storage:', e);
      this.setStatus('error');
      throw e;
    }
  }
}

export const syncService = new FirebaseSyncService();
