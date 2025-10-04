import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Download, Loader2, Frame, X, ZoomIn, ZoomOut, Move } from 'lucide-react';

function Frame4() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState('classic');
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const streamRef = useRef(null);

  const frames = {
    classic: {
      name: 'Classic Gold',
      image: './frame2.png',
      // [https://images.pexels.com/photos/1579708/pexels-photo-1579708.jpeg?auto=compress&cs=tinysrgb&w=800&h=800](https://images.pexels.com/photos/1579708/pexels-photo-1579708.jpeg?auto=compress&cs=tinysrgb&w=800&h=800)',
      border: '20px solid #d4af37',
      shadow: '0 10px 40px rgba(212, 175, 55, 0.4)',
    },
    modern: {
      name: 'Modern Black',
      image: '[https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auto=compress&cs=tinysrgb&w=800&h=800](https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auto=compress&cs=tinysrgb&w=800&h=800)',
      border: '15px solid #1a1a1a',
      shadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
    },
    elegant: {
      name: 'Elegant Silver',
      image: '[https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=800&h=800](https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=800&h=800)',
      border: '18px solid #c0c0c0',
      shadow: '0 10px 40px rgba(192, 192, 192, 0.5)',
    },
    vintage: {
      name: 'Vintage Wood',
      image: '[https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=800&h=800](https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=800&h=800)',
      border: '25px solid #8b4513',
      shadow: '0 10px 40px rgba(139, 69, 19, 0.4)',
    },
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        setIsCameraReady(true);
      }
    } catch (err) {
      setError('Failed to access camera. Please allow camera permissions.', err);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraCanvasRef.current) return;

    ```
const video = videoRef.current;
const canvas = cameraCanvasRef.current;
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

const ctx = canvas.getContext('2d');
if (ctx) {
  ctx.drawImage(video, 0, 0);
  const imageDataUrl = canvas.toDataURL('image/jpeg');
  setSelectedImage(imageDataUrl);
  closeCamera();
  removeBackgroundAuto(imageDataUrl);
}
```

  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result;
        setSelectedImage(imageData);
        setProcessedImage(null);
        setError(null);
        removeBackgroundAuto(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundAuto = async (imageData) => {
    const apiKey = "74VA8pxq78Qe95gFaXaVq7Rp";
    if (!apiKey) {
      setError('Remove.bg API key not configured. Please add VITE_REMOVE_BG_API_KEY to your .env file.');
      return;
    }


    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = imageData.split(',')[1];
      const blob = await fetch(`data: image / jpeg; base64, ${base64Data} `).then(res => res.blob());

      const formData = new FormData();
      formData.append('image_file', blob);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove background');
    } finally {
      setIsProcessing(false);
    }

  };

  const handleMouseDown = (e) => {
    if (!processedImage) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!processedImage) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const resetPosition = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const downloadComposedImage = () => {
    if (!processedImage || !canvasRef.current) return;


    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameStyle = frames[selectedFrame];
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';

    frameImg.onload = () => {
      const selfieImg = new Image();
      selfieImg.crossOrigin = 'anonymous';

      selfieImg.onload = () => {
        const canvasWidth = 800;
        const canvasHeight = 800;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);

        const frameBorderWidth = parseInt(frameStyle.border.split(' ')[0]);
        const innerWidth = canvasWidth - (frameBorderWidth * 2);
        const innerHeight = canvasHeight - (frameBorderWidth * 2);

        const baseScale = Math.min(innerWidth / selfieImg.width, innerHeight / selfieImg.height) * 0.85;
        const finalScale = baseScale * scale;
        const scaledWidth = selfieImg.width * finalScale;
        const scaledHeight = selfieImg.height * finalScale;

        const normalizedX = (position.x / 300) * innerWidth;
        const normalizedY = (position.y / 300) * innerHeight;

        const x = frameBorderWidth + (innerWidth - scaledWidth) / 2 + normalizedX;
        const y = frameBorderWidth + (innerHeight - scaledHeight) / 2 + normalizedY;

        ctx.drawImage(selfieImg, x, y, scaledWidth, scaledHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `framed - selfie - ${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };

      selfieImg.src = processedImage;
    };

    frameImg.src = frameStyle.image;

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Frame className="w-8 h-8 sm:w-10 sm:h-10 text-slate-700" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">Selfie Frame Studio</h1>
            </div>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg px-4">Take or upload a selfie, and frame it beautifully</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Capture or Upload</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedImage ? (
                <div className="space-y-3">
                  <button
                    onClick={openCamera}
                    className="w-full h-48 sm:h-56 border-3 border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-slate-700 group"
                  >
                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
                    <span className="text-base sm:text-lg font-medium">Open Camera</span>
                    <span className="text-xs sm:text-sm">Take a selfie</span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">or</span>
                    </div>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 sm:h-40 border-3 border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-700 group"
                  >
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base font-medium">Upload from device</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-full h-48 sm:h-56 md:h-64 object-contain bg-slate-50"
                    />
                  </div>

                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Removing background...</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={openCamera}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      Retake
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      Upload
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-xs sm:text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Frame & Adjust</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Choose Frame</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(frames).map(([key, frame]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFrame(key)}
                      className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-all font-medium text-xs sm:text-sm ${selectedFrame === key
                        ? 'border-slate-800 bg-slate-50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                    >
                      {frame.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                {processedImage ? (
                  <>
                    <div
                      className="relative w-full h-64 sm:h-72 md:h-80 rounded-lg overflow-hidden shadow-xl cursor-move touch-none"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img
                        src={frames[selectedFrame].image}
                        alt="Frame"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <img
                          src={processedImage}
                          alt="Processed"
                          className="object-contain pointer-events-none select-none"
                          style={{
                            maxWidth: '70%',
                            maxHeight: '70%',
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                          }}
                        />
                      </div>
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Move className="w-3 h-3" />
                        <span className="hidden sm:inline">Drag to move</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={zoomOut}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <span className="text-sm text-slate-600 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
                      <button
                        onClick={zoomIn}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={resetPosition}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs sm:text-sm font-medium transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-64 sm:h-72 md:h-80 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm sm:text-base px-4 text-center">
                    {selectedImage ? 'Processing...' : 'Capture or upload an image to start'}
                  </div>
                )}
              </div>

              <button
                onClick={downloadComposedImage}
                disabled={!processedImage}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                Download Framed Image
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={cameraCanvasRef} className="hidden" />
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={closeCamera}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-all"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />

              {isCameraReady && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <button
                    onClick={capturePhoto}
                    className="w-full max-w-xs mx-auto block bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-6 rounded-full transition-all text-lg"
                  >
                    Capture Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Frame4;
