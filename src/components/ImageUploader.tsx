import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { deleteImageFromStorage, uploadImageToStorage, type StorageFolder } from '../services/storageService';
import { SafeImage } from './SafeImage';

interface ImageUploaderProps {
  folder: StorageFolder;
  images: string[];
  onChange: (nextImages: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export function ImageUploader({
  folder,
  images,
  onChange,
  multiple = false,
  maxImages = 8,
  label = 'Images',
  helperText,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const effectiveLimit = multiple ? maxImages : 1;

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    const remainingSlots = multiple ? Math.max(0, effectiveLimit - images.length) : 1;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setError(`Maximum of ${effectiveLimit} images reached. Remove an image to upload another.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const downloadUrl = await uploadImageToStorage(file, folder, (pct) => setProgress(pct));
        uploadedUrls.push(downloadUrl);
      }

      if (multiple) {
        onChange([...images, ...uploadedUrls].slice(0, effectiveLimit));
      } else {
        if (images[0]) {
          void deleteImageFromStorage(images[0]);
        }
        onChange([uploadedUrls[0]]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Storage upload failed. Switch to "Paste Image URL" to add an image link directly.'
      );
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    setError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const isValid =
      trimmed.startsWith('https://') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('/');
    if (!isValid) {
      setError('Enter a valid image URL starting with https://, http://, or /');
      return;
    }

    if (multiple) {
      if (images.length >= effectiveLimit) {
        setError(`Maximum of ${effectiveLimit} images allowed.`);
        return;
      }
      onChange([...images, trimmed]);
    } else {
      onChange([trimmed]);
    }
    setUrlInput('');
  };

  const handleRemove = (index: number) => {
    const target = images[index];
    const next = images.filter((_, idx) => idx !== index);
    onChange(next);
    if (target) {
      void deleteImageFromStorage(target);
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setError(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
              mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Firebase Storage
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('url');
              setError(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
              mode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            Direct URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            uploading
              ? 'border-orange-300 bg-orange-50/40 cursor-wait'
              : 'border-slate-300 bg-slate-50 hover:border-orange-400 hover:bg-orange-50/30 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple={multiple}
            onChange={handleFilesSelected}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <p className="text-sm font-medium text-slate-800 font-mono tabular-nums">
                Uploading to Firebase Storage... {progress}%
              </p>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-orange-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Click to upload {multiple ? 'product images' : 'an image'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JPG, PNG, WebP up to 5 MB · {images.length}/{effectiveLimit} added
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="https://example.com/shoe.jpg or /src/assets/images/..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors whitespace-nowrap"
          >
            Add URL
          </button>
        </div>
      )}

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className={`grid gap-3 pt-1 ${multiple ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 max-w-sm'}`}>
          {images.map((imgUrl, index) => (
            <div
              key={`${imgUrl}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <div className="aspect-[4/3] w-full">
                <SafeImage
                  src={imgUrl}
                  alt={`Uploaded image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-slate-200 bg-white px-2 py-1.5">
                <span className="text-[11px] font-semibold text-slate-500 font-mono tabular-nums">
                  {index === 0 ? 'Primary' : `#${index + 1}`}
                </span>
                <div className="flex items-center gap-1">
                  {multiple && images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        aria-label="Move image left"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === images.length - 1}
                        aria-label="Move image right"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label="Remove image"
                    className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
