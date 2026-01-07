'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    selectedFile: File | null;
    accept?: string;
    maxSizeMB?: number;
    disabled?: boolean;
    error?: string | null;
}

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xltx', '.xltm', '.ods'];
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export function FileUploader({
    onFileSelect,
    onFileRemove,
    selectedFile,
    accept = '.xlsx,.xls,.xlsm',
    maxSizeMB = 10,
    disabled = false,
    error = null
}: FileUploaderProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): string | null => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            return `Extensión ${extension} no permitida. Use: ${ALLOWED_EXTENSIONS.join(', ')}`;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `Archivo muy grande (${sizeMB.toFixed(1)}MB). Máximo: ${maxSizeMB}MB`;
        }
        return null;
    }, [maxSizeMB]);

    const handleFile = useCallback((file: File) => {
        const error = validateFile(file);
        setValidationError(error);
        if (!error) {
            onFileSelect(file);
        }
    }, [validateFile, onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled) return;
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [disabled, handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleClick = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setValidationError(null);
        onFileRemove();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const displayError = error || validationError;

    return (
        <div className="space-y-2">
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    "hover:border-[#CD3529] hover:bg-red-50/30",
                    isDragOver && "border-[#CD3529] bg-red-50/50 scale-[1.02]",
                    disabled && "opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-transparent",
                    !!displayError && "border-red-400 bg-red-50/20",
                    !!(selectedFile && !displayError) && "border-green-400 bg-green-50/20"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled}
                />

                {selectedFile ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <FileSpreadsheet size={32} className="text-green-600" />
                            <CheckCircle2 size={20} className="text-green-600" />
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{selectedFile.name}</span>
                            <span className="text-sm text-gray-500">
                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button
                                onClick={handleRemove}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                aria-label="Remover archivo"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-green-600">Archivo listo para procesar</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Upload
                            size={40}
                            className={cn(
                                "mx-auto transition-colors",
                                isDragOver ? "text-[#CD3529]" : "text-gray-400"
                            )}
                        />
                        <div>
                            <p className="text-lg font-medium text-gray-700">
                                Arrastra tu archivo Excel aquí
                            </p>
                            <p className="text-sm text-gray-500">
                                o haz click para seleccionar
                            </p>
                        </div>
                        <p className="text-xs text-gray-400">
                            Formatos: .xlsx, .xls, .xlsm (máx {maxSizeMB}MB)
                        </p>
                    </div>
                )}
            </div>

            {displayError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{displayError}</span>
                </div>
            )}
        </div>
    );
}
