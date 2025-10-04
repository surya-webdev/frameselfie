import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Download, Loader2, Frame, X, Trash2 } from 'lucide-react';


function Frame7() {
  const [images, setImages] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState('classic');
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const streamRef = useRef(null);

  const frames = {
    classic: {
      name: 'Classic Gold',
      image: '/framesam.png',
      // 'https://images.pexels.com/photos/1579708/pexels-photo-1579708.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
      border: 20,
    },
    // modern: {
    //   name: 'Modern Black',
    //   image: 'https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
    //   border: 15,
    // },
    // elegant: {
    //   name: 'Elegant Silver',
    //   image: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
    //   border: 18,
    // },
    // vintage: {
    //   name: 'Vintage Wood',
    //   image: 'https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
    //   border: 25,
    // },
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
        video: { facingMode: 'user', width: 1280, height: 720 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setShowCamera(true);
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Failed to access camera. Please allow camera permissions.');
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = cameraCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      closeCamera();
      addImageAndProcess(imageDataUrl);
    }
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result;
        addImageAndProcess(imageData);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addImageAndProcess = (imageData) => {
    const newImage = {
      id: Date.now().toString() + Math.random(),
      original: imageData,
      processed: null,
      isProcessing: true,
      error: null,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };

    setImages(prev => [...prev, newImage]);
    removeBackground(newImage.id, imageData);
  };

  const removeBackground = async (imageId, imageData) => {
    const apiKey = "74VA8pxq78Qe95gFaXaVq7Rp";
    if (!apiKey) {
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, isProcessing: false, error: 'API key not configured' }
          : img
      ));
      return;
    }

    try {
      const base64Data = imageData.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

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

      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, processed: resultUrl, isProcessing: false }
          : img
      ));
    } catch (err) {
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, isProcessing: false, error: err instanceof Error ? err.message : 'Failed to process' }
          : img
      ));
    }
  };

  const updateImageScale = (imageId, scale) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, scale } : img
    ));
  };

  const updateImageOffset = (imageId, offsetX, offsetY) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, offsetX, offsetY } : img
    ));
  };

  const resetImagePosition = (imageId) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, scale: 1, offsetX: 0, offsetY: 0 } : img
    ));
  };

  const deleteImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const downloadImage = async (image) => {
    if (!image.processed) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameStyle = frames[selectedFrame];
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';

    frameImg.onload = () => {
      const selfieImg = new Image();
      selfieImg.crossOrigin = 'anonymous';

      selfieImg.onload = () => {
        // target download size
        const targetWidth = 412;
        const targetHeight = 917;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // draw the frame background stretched to canvas size
        ctx.drawImage(frameImg, 0, 0, targetWidth, targetHeight);

        // calculate border scaling relative to smaller dimension
        const frameBorderPx = (frameStyle.border / 800) * Math.min(targetWidth, targetHeight);
        const innerWidth = targetWidth - (frameBorderPx * 2);
        const innerHeight = targetHeight - (frameBorderPx * 2);

        // scale selfie to fit inside inner rect
        const baseScale = Math.min(innerWidth / selfieImg.width, innerHeight / selfieImg.height) * 0.65;
        const finalScale = baseScale * image.scale;
        const scaledWidth = selfieImg.width * finalScale;
        const scaledHeight = selfieImg.height * finalScale;

        const centerX = targetWidth / 2;
        const centerY = targetHeight / 2;

        const offsetXScaled = (image.offsetX / 50) * (innerWidth / 4);
        const offsetYScaled = (image.offsetY / 50) * (innerHeight / 4);

        const x = centerX - scaledWidth / 2 + offsetXScaled;
        const y = centerY - scaledHeight / 2 + offsetYScaled;

        ctx.drawImage(selfieImg, x, y, scaledWidth, scaledHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `framed-selfie-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };

      // ✅ only set once
      selfieImg.src = image.processed;
    };

    frameImg.src = frameStyle.image;
  };


  const downloadAll = async () => {
    const processedImages = images.filter(img => img.processed);
    for (const image of processedImages) {
      await downloadImage(image);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const deleteAll = () => {
    if (confirm('Delete all images?')) {
      setImages([]);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Frame className="w-8 h-8 sm:w-10 sm:h-10 text-slate-700" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">Selfie Frame Studio</h1>
            </div>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg px-4">Capture or upload selfies, remove backgrounds, and frame them beautifully</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Upload or Capture</h2>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={openCamera}
                  className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {images.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No images uploaded yet. Start by capturing or uploading images.</p>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Choose Frame Style</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(frames).map(([key, frame]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFrame(key)}
                      className={`px-3 py-3 rounded-lg border-2 transition-all font-medium text-xs sm:text-sm ${selectedFrame === key
                        ? 'border-slate-800 bg-slate-50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                    >
                      {frame.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                    Processed Images ({images.filter(img => img.processed).length}/{images.length})
                  </h2>
                  <div className="flex gap-2">
                    {images.filter(img => img.processed).length > 0 && (
                      <button
                        onClick={downloadAll}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                    )}
                    <button
                      onClick={deleteAll}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="relative w-[412px] h-[917px] mb-3 rounded-lg overflow-hidden bg-slate-50">
                        {image.isProcessing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-600 mb-2" />
                            <span className="text-sm text-slate-600">Processing...</span>
                          </div>
                        ) : image.error ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <span className="text-sm text-red-600 text-center">{image.error}</span>
                          </div>
                        ) : image.processed ? (
                          <>
                            <img
                              src={frames[selectedFrame].image}
                              alt="Frame"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                              <img
                                src={image.processed}
                                alt="Processed"
                                className="object-contain"
                                style={{
                                  maxWidth: '65%',
                                  maxHeight: '65%',
                                  transform: `translate(${image.offsetX}px, ${image.offsetY}px) scale(${image.scale})`,
                                }}
                              />
                            </div>
                          </>
                        ) : null}
                      </div>

                      {image.processed && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-700 w-16">Scale:</label>
                            <input
                              type="range"
                              min="0.3"
                              max="3"
                              step="0.1"
                              value={image.scale}
                              onChange={(e) => updateImageScale(image.id, parseFloat(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-xs text-slate-600 w-12 text-right">{Math.round(image.scale * 100)}%</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-700 w-16">X Pos:</label>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={image.offsetX}
                              onChange={(e) => updateImageOffset(image.id, parseFloat(e.target.value), image.offsetY)}
                              className="flex-1"
                            />
                            <span className="text-xs text-slate-600 w-12 text-right">{image.offsetX}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-700 w-16">Y Pos:</label>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={image.offsetY}
                              onChange={(e) => updateImageOffset(image.id, image.offsetX, parseFloat(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-xs text-slate-600 w-12 text-right">{image.offsetY}</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => resetImagePosition(image.id)}
                              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 rounded text-xs transition-all"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => downloadImage(image)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded text-xs transition-all flex items-center justify-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                            <button
                              onClick={() => deleteImage(image.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded text-xs transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <canvas ref={cameraCanvasRef} className="hidden" />
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl">
            <button
              onClick={closeCamera}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-all z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
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

export default Frame7;
