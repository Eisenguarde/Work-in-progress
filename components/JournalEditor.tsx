import React, { useState, useRef, useEffect } from 'react';
import { analyzeImageForText } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';
import { CameraCapture } from './CameraCapture';
import type { JournalEntry } from '../types';

interface JournalEditorProps {
  onAddEntry: (payload: { content: string, ticketNumber?: string, imageUrl?: string }) => void;
  entryToDuplicate: JournalEntry | null;
  onDuplicationDone: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const formatTicketNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
        return '';
    }
    const reversed = digitsOnly.split('').reverse().join('');
    const grouped = reversed.match(/.{1,3}/g)?.join(' ') || '';
    const result = grouped.split('').reverse().join('');
    return result;
};


export const JournalEditor: React.FC<JournalEditorProps> = ({ onAddEntry, entryToDuplicate, onDuplicationDone }) => {
  const [content, setContent] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entryToDuplicate) {
      const originalDate = new Date(entryToDuplicate.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      
      const newContent = `--- Copied from entry on ${originalDate} ---\n${entryToDuplicate.content}\n\n--- Notes for ${todayDate} ---\n`;
      setContent(newContent);
      setTicketNumber(entryToDuplicate.ticketNumber || '');
      
      if (entryToDuplicate.imageUrl) {
        setImageUrl(entryToDuplicate.imageUrl);
        fetch(entryToDuplicate.imageUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "duplicated_image.jpg", { type: blob.type });
                setImageFile(file);
            });
      }
    }
  }, [entryToDuplicate]);

  const handleFile = async (file: File) => {
      if (file && file.type.startsWith('image/')) {
        setImageFile(file);
        const base64 = await fileToBase64(file);
        setImageUrl(base64);
      }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setImageUrl(imageDataUrl);
    // Create a mock file for analysis
    fetch(imageDataUrl).then(res => res.blob()).then(blob => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setImageFile(file);
    });
    setIsCameraOpen(false);
  };
  
  const handleAnalyzeImage = async () => {
    if (!imageUrl || !imageFile) return;
    setIsAnalyzing(true);
    try {
      const extractedText = await analyzeImageForText(imageUrl, imageFile.type);
      setContent(prev => `${prev}\n\n--- AI Analysis ---\n${extractedText}`.trim());
    } catch (error) {
      console.error("Analysis failed:", error);
      setContent(prev => `${prev}\n\n--- AI Analysis Failed ---`.trim());
    }
    setIsAnalyzing(false);
  };

  const clearImage = () => {
    setImageUrl(undefined);
    setImageFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const resetForm = () => {
    setContent('');
    setTicketNumber('');
    clearImage();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({ content, ticketNumber, imageUrl });
    resetForm();
    if(entryToDuplicate) {
        onDuplicationDone();
    }
  };
  
  const handleCancelDuplication = () => {
    resetForm();
    onDuplicationDone();
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        handleFile(file);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700">
      <form onSubmit={handleSubmit}>
        {entryToDuplicate && (
            <div className="p-2 mb-3 bg-amber-50 dark:bg-amber-900/20 rounded-md flex justify-between items-center text-sm">
                <p className="text-amber-800 dark:text-amber-200 font-medium">Duplicating entry. Edit below and save as new.</p>
                <button type="button" onClick={handleCancelDuplication} className="font-semibold text-stone-600 dark:text-stone-300 hover:underline px-2 py-1">Cancel</button>
            </div>
        )}
        <h2 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">New Entry</h2>
        
        <div className="mb-2">
            <label htmlFor="ticket-number" className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Ticket Number (optional)</label>
            <input 
                type="text"
                id="ticket-number"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(formatTicketNumber(e.target.value))}
                placeholder="e.g., 2 382 182"
                className="w-full p-2 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your journal entry..."
          className="w-full h-32 p-3 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
          aria-label="New journal entry content"
        />
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Supports basic Markdown: **bold**, *italics*, and lists.</p>

        <div className="mt-3">
          {!imageUrl ? (
            <div 
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative flex items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200 ${
                isDragging
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500'
              }`}
            >
              <div className="flex flex-col items-center">
                <p className="mb-2 text-sm text-stone-500 dark:text-stone-400">
                  Drag & drop an image here, or
                </p>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 text-sm font-semibold py-2 px-4 rounded-md border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                    <UploadIcon className="w-4 h-4"/> Upload
                  </button>
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="flex-1 text-sm font-semibold py-2 px-4 rounded-md border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                    <CameraIcon className="w-4 h-4"/> Camera
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <img src={imageUrl} alt="Preview" className="w-full rounded-md object-cover max-h-48" />
              <button onClick={clearImage} type="button" className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                <XIcon className="w-4 h-4"/>
              </button>
              <button onClick={handleAnalyzeImage} disabled={isAnalyzing} type="button" className="absolute bottom-2 left-2 flex items-center gap-2 text-sm font-semibold py-1.5 px-3 rounded-full bg-amber-500/90 text-white hover:bg-amber-600 transition-colors disabled:bg-stone-500">
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4"/> Analyze Nameplate
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={!content.trim() && !imageUrl}
            className="px-4 py-2 font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:bg-stone-400 dark:disabled:bg-stone-600 disabled:text-stone-100 dark:disabled:text-stone-400 transition-colors"
          >
            {entryToDuplicate ? 'Save as New Entry' : 'Add Entry'}
          </button>
        </div>
      </form>
      {isCameraOpen && <CameraCapture onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};