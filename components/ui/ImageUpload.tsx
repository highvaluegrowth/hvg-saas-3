'use client';

import { useState, useRef, useCallback } from 'react';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

interface ImageUploadProps {
    /** Firebase Storage path (without extension) — e.g. "tenants/abc/courses/xyz/slides/s1" */
    storagePath: string;
    /** Called with the public download URL once the upload completes */
    onUpload: (downloadUrl: string) => void;
    /** Pre-existing URL to show as the initial preview */
    currentUrl?: string;
    /** MIME accept string, defaults to "image/*" */
    accept?: string;
}

export function ImageUpload({ storagePath, onUpload, currentUrl, accept = 'image/*' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Keep a ref to any object URL so we can revoke it
    const objectUrlRef = useRef<string | null>(null);

    const handleFile = useCallback((file: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (PNG, JPG, GIF, WebP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be smaller than 10 MB.');
            return;
        }

        setError(null);
        setUploading(true);
        setProgress(0);

        // Show local preview immediately so the user has visual feedback
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const objUrl = URL.createObjectURL(file);
        objectUrlRef.current = objUrl;
        setPreview(objUrl);

        // Derive a safe filename from the storage path + original extension
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fullPath = `${storagePath}.${ext}`;
        const sRef = storageRef(storage, fullPath);
        const task = uploadBytesResumable(sRef, file, { contentType: file.type });

        task.on(
            'state_changed',
            (snap) => {
                setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
            },
            (err) => {
                console.error('ImageUpload error:', err);
                setError('Upload failed. Check your connection and try again.');
                setUploading(false);
                // Revert preview to current saved URL (or nothing)
                if (objectUrlRef.current) {
                    URL.revokeObjectURL(objectUrlRef.current);
                    objectUrlRef.current = null;
                }
                setPreview(currentUrl || null);
            },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                if (objectUrlRef.current) {
                    URL.revokeObjectURL(objectUrlRef.current);
                    objectUrlRef.current = null;
                }
                setPreview(url);
                setUploading(false);
                setProgress(100);
                onUpload(url);
            }
        );
    }, [storagePath, onUpload, currentUrl]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="space-y-2">
            {/* Drop zone / Preview area */}
            <div
                className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors cursor-pointer
                    ${uploading
                        ? 'border-primary/40 bg-primary/5 cursor-not-allowed'
                        : 'border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/30'
                    }`}
                style={{ minHeight: '120px' }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => {
                    if (!uploading) inputRef.current?.click();
                }}
            >
                {preview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={preview}
                        alt="Upload preview"
                        className="w-full max-h-56 object-contain"
                        onError={() => setPreview(null)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <svg className="h-10 w-10 text-white/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-white/60">
                            Drop image here or <span className="text-cyan-400 font-medium">browse files</span>
                        </p>
                        <p className="text-xs text-white/40 mt-1">PNG, JPG, GIF, WebP · max 10 MB</p>
                    </div>
                )}

                {/* Upload progress overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                        <div className="w-2/3 bg-white/30 rounded-full h-2.5">
                            <div
                                className="bg-white h-2.5 rounded-full transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-white text-sm font-semibold">{progress}% uploading…</p>
                    </div>
                )}
            </div>

            {/* "Change image" button when a preview is set */}
            {preview && !uploading && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                    }}
                    className="w-full text-xs text-white/60 hover:text-white border border-white/10 rounded-lg py-1.5 hover:bg-white/5 transition-colors"
                >
                    Change image
                </button>
            )}

            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    // Reset so the same file can be re-selected
                    e.target.value = '';
                }}
            />
        </div>
    );
}
