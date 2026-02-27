'use client';

import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { Button } from './Button';

interface FileUploaderProps {
    applicationId: string;
    field: 'gov_id' | 'business_doc';
    onUploadSuccess: (url: string) => void;
    accept?: string;
    label?: string;
}

export function FileUploader({ applicationId, field, onUploadSuccess, accept = '.pdf,.jpg,.jpeg,.png', label = 'Upload File' }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const fileExtension = file.name.split('.').pop();
        const fileName = `${field}_${Date.now()}.${fileExtension}`;
        const fileRef = ref(storage, `applications/${applicationId}/${fileName}`);

        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(p);
            },
            (err) => {
                setError(err.message);
                setUploading(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onUploadSuccess(downloadURL);
                    setUploading(false);
                    setProgress(0);
                    setFile(null); // Clear selection after success
                } catch (err: unknown) {
                    setError((err as Error).message);
                    setUploading(false);
                }
            }
        );
    };

    return (
        <div className="flex flex-col space-y-2 mb-4">
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <div className="flex items-center space-x-4">
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    variant="secondary"
                    className="whitespace-nowrap"
                >
                    {uploading ? `Uploading ${Math.round(progress)}%` : 'Upload'}
                </Button>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
}
