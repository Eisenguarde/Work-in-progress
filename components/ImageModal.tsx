import React, { useEffect } from 'react';
import { XIcon } from './icons/XIcon';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={imageUrl} alt="Journal entry full size" className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
          aria-label="Close image view"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
