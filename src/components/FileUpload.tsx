import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

export function FileUpload({ onFileSelect, isProcessing, selectedFile, onClear }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    e.target.value = '';
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className={cn(
              "p-4 rounded-full mb-4 transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}>
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <p className="mb-2 text-lg font-medium text-foreground">
              {isDragging ? "Solte o arquivo aqui" : "Arraste e solte seu arquivo KML"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique para selecionar
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-muted font-mono">.kml</span>
              <span>•</span>
              <span>Máximo 25 MB</span>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".kml"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            disabled={isProcessing}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
}
