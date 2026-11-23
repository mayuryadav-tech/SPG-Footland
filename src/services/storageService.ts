import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

export type StorageFolder = 'products' | 'categories' | 'banners' | 'branding';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export function isFirebaseStorageUrl(url: string): boolean {
  return (
    url.startsWith('https://firebasestorage.googleapis.com/') ||
    url.startsWith('gs://') ||
    url.includes('.firebasestorage.app')
  );
}

export function uploadImageToStorage(
  file: File,
  folder: StorageFolder,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Unsupported image format. Use JPG, PNG, WebP, GIF, or SVG.'));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(new Error('Image exceeds the 5 MB limit. Please compress the file first.'));
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => {
        const message =
          error.code === 'storage/unauthorized'
            ? 'Storage upload unauthorized. Verify Storage rules or use the Direct Image URL option.'
            : error.code === 'storage/unknown' || error.code === 'storage/bucket-not-found'
              ? 'Firebase Storage is not enabled yet on this project. You can paste a direct image URL instead.'
              : error.message || 'Image upload failed. Try pasting an image URL instead.';
        reject(new Error(message));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to obtain uploaded image URL.'));
        }
      }
    );
  });
}

export async function deleteImageFromStorage(url: string): Promise<void> {
  if (!url || !isFirebaseStorageUrl(url)) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Could not remove image from Firebase Storage (it may already be removed):', error);
  }
}
