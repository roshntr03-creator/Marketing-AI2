import React, { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  previewSrc: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  label: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ previewSrc, onFileSelect, onClear, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, []);

  const onClick = () => {
    fileInputRef.current?.click();
  };
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      handleFile(file);
  };

  const onRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the click from triggering the file input
    onClear();
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const baseClasses = "relative flex justify-center items-center w-full h-48 rounded-lg border-2 border-dashed transition-all duration-300 cursor-pointer";
  const idleClasses = "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-700";
  const draggingClasses = "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/50";

  return (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <div
        className={`${baseClasses} ${isDragging ? draggingClasses : idleClasses}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        >
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
        />

        {previewSrc ? (
            <>
            <img src={previewSrc} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                <button
                    onClick={onRemoveImage}
                    className="absolute top-2 right-2 rtl:right-auto rtl:left-2 bg-black bg-opacity-60 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-opacity-80"
                    aria-label="Remove image"
                >
                    <i className="fa-solid fa-times"></i>
                </button>
            </div>
            </>
        ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            <i className="fa-solid fa-cloud-arrow-up text-4xl mb-2"></i>
            <p className="font-semibold">Drag & drop an image here</p>
            <p className="text-sm">or click to select</p>
            </div>
        )}
        </div>
    </div>
  );
};

export default ImageUpload;