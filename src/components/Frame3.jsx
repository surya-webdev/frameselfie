import { useState, useRef } from 'react';
import { Upload, Download, Loader2, Frame } from 'lucide-react';

function Frame3() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState('classic');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const frames = {
    classic: {
      name: 'Frame 1',
      image: './frame2.png',
      border: '20px solid #d4af37',
      shadow: '0 10px 40px rgba(212, 175, 55, 0.4)',
    },
    modern: {
      name: 'Frame 2',
      image: 'https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
      border: '15px solid #1a1a1a',
      shadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
    },
    elegant: {
      name: 'Frame 3',
      image: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
      border: '18px solid #c0c0c0',
      shadow: '0 10px 40px rgba(192, 192, 192, 0.5)',
    },
    vintage: {
      name: 'Frame 4',
      image: 'https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=800&h=800',
      border: '25px solid #8b4513',
      shadow: '0 10px 40px rgba(139, 69, 19, 0.4)',
    },
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result);
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = async () => {
    if (!selectedImage) return;

    const apiKey = "74VA8pxq78Qe95gFaXaVq7Rp";
    if (!apiKey) {
      setError('Remove.bg API key not configured. Please add VITE_REMOVE_BG_API_KEY to your .env file.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = selectedImage.split(',')[1];
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
      setProcessedImage(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
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
        const canvasWidth = 1800;
        const canvasHeight = 1800;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);

        const frameBorderWidth = parseInt(frameStyle.border.split(' ')[0]);
        const innerWidth = canvasWidth - (frameBorderWidth * 2);
        const innerHeight = canvasHeight - (frameBorderWidth * 2);

        const scale = Math.min(innerWidth / selfieImg.width, innerHeight / selfieImg.height) * 0.85;
        const scaledWidth = selfieImg.width * scale;
        const scaledHeight = selfieImg.height * scale;

        const x = frameBorderWidth + (innerWidth - scaledWidth) / 2;
        const y = frameBorderWidth + (innerHeight - scaledHeight) / 2;

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

      selfieImg.src = processedImage;
    };

    frameImg.src = frameStyle.image;
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Frame className="w-10 h-10 text-slate-700" />
              <h1 className="text-4xl font-bold text-slate-800">Selfie Frame Studio</h1>
            </div>
            <p className="text-slate-600 text-lg">Upload your selfie, remove the background, and frame it beautifully</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Upload & Process</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-3 border-dashed border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-slate-700"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">Click to upload selfie</span>
                  <span className="text-sm">JPG, PNG up to 10MB</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-full h-64 object-contain rounded-lg bg-slate-50"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white px-4 py-2 rounded-lg shadow-md text-sm font-medium text-slate-700 transition-all"
                    >
                      Change
                    </button>
                  </div>

                  <button
                    onClick={removeBackground}
                    disabled={isProcessing}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Remove Background</>
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Preview & Download</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Choose Frame</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(frames).map(([key, frame]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFrame(key)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${selectedFrame === key
                        ? 'border-slate-800 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 text-slate-200'
                        }`}
                    >
                      {frame.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                {processedImage ? (
                  <div className="relative w-[540px]  h-[540px] rounded-lg overflow-hidden shadow-xl">
                    <img
                      src={frames[selectedFrame].image}
                      alt="Frame"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="max-w-[100%] max-h-[100%] object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    {selectedImage ? 'Click "Remove Background" to preview' : 'Upload an image to start'}
                  </div>
                )}
              </div>

              <button
                onClick={downloadComposedImage}
                disabled={!processedImage}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Framed Image
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}

export default Frame3;
