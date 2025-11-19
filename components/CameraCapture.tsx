import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { XIcon } from './icons/XIcon';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-stone-800 rounded-lg shadow-xl p-4 w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Take Photo</h3>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-stone-700">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="mt-4 flex justify-center">
            <button
                onClick={handleCapture}
                disabled={!stream}
                className="p-4 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:bg-stone-600 transition-colors"
                aria-label="Capture photo"
            >
                <CameraIcon className="w-8 h-8" />
            </button>
        </div>
      </div>
    </div>
  );
};
