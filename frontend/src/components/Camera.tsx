import { useRef, useEffect, useState } from 'react';
import { uploadService } from '../services/api';

interface CameraProps {
  userId: string;
  onCaptureSuccess: () => void;
  onClose?: () => void;
}

export function Camera({ userId, onCaptureSuccess, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Start camera when component mounts
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }, // Front-facing camera
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    startCamera();

    // Cleanup: stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture photo');
        return;
      }

      setIsCapturing(true);
      setIsUploading(true);

      try {
        // Convert blob to File
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });

        // Upload using existing upload service
        await uploadService.uploadPhoto(userId, file);
        
        // Call success callback
        onCaptureSuccess();
        
        // Reset state
        setIsCapturing(false);
        setIsUploading(false);
      } catch (err) {
        console.error('Error uploading photo:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload photo');
        setIsCapturing(false);
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.95);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
      {/* Camera Preview */}
      <div className="relative w-full max-w-2xl aspect-[4/3] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay grid (optional, for better framing) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-3 grid-rows-3 h-full w-full">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        {/* Capture Button */}
        <button
          onClick={capturePhoto}
          disabled={isUploading || !stream}
          className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg"
          title="Capture Photo"
        >
          <div className="w-full h-full rounded-full bg-white"></div>
        </button>
        
        {/* Upload Status */}
        {isUploading && (
          <div className="text-white text-sm flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {/* Close/Back Button */}
      <button
        onClick={() => {
          stopCamera();
          if (onClose) onClose();
        }}
        className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        title="Close Camera"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

