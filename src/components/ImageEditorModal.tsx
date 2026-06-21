import React, { useState, useRef, useEffect } from 'react';
import { 
  X, RotateCw, ZoomIn, ZoomOut, Check, Sliders, 
  Sun, Contrast, Eye, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | 'free';
  onSave: (editedBase64: string) => void;
}

export default function ImageEditorModal({
  isOpen,
  onClose,
  imageUrl,
  title = "Edit & Crop Image",
  aspectRatio = '1:1',
  onSave
}: ImageEditorModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100); // 100%
  const [contrast, setContrast] = useState(100); // 100%
  const [activeTab, setActiveTab] = useState<'crop' | 'filters'>('crop');
  const [filter, setFilter] = useState<string>('none');

  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  const resetStates = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setFilter('none');
  };

  useEffect(() => {
    if (isOpen) {
      resetStates();
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  // Handle Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    startDrag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Touch Events for Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    const touch = e.touches[0];
    startDrag.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - startDrag.current.x,
      y: touch.clientY - startDrag.current.y
    });
  };

  const getFilterStyle = () => {
    let filterString = `brightness(${brightness}%) contrast(${contrast}%)`;
    switch (filter) {
      case 'grayscale':
        filterString += ' grayscale(100%)';
        break;
      case 'sepia':
        filterString += ' sepia(80%)';
        break;
      case 'warm':
        filterString += ' saturate(130%) sepia(20%)';
        break;
      case 'cool':
        filterString += ' hue-rotate(15deg) saturate(110%)';
        break;
      case 'vintage':
        filterString += ' contrast(120%) saturate(80%) sepia(30%)';
        break;
      case 'invert':
        filterString += ' invert(100%)';
        break;
      default:
        break;
    }
    return filterString;
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    // Create an offscreen canvas to perform final draw
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define export size based on aspect ratio
    let targetWidth = 600;
    let targetHeight = 600;

    if (aspectRatio === '16:9') {
      targetHeight = 338;
    } else if (aspectRatio === '4:3') {
      targetHeight = 450;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Fill white background for safety
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Apply CSS-like Filters to Canvas
    ctx.filter = getFilterStyle();

    // Calculate dimensions to map viewport visual coordinates onto the export high-res canvas
    const visualViewport = viewportRef.current;
    if (!visualViewport) return;

    const vWidth = visualViewport.clientWidth;
    const vHeight = visualViewport.clientHeight;

    // Center of canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Apply Rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Scaling conversion factor from viewport visual to target export canvas
    const scaleFactor = targetWidth / vWidth;

    // Apply Translated Pan
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

    // Draw the image
    // Find centered aspect fit/fill dimensions of image on viewport to replicate
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const imgRatio = imgW / imgH;
    const viewRatio = vWidth / vHeight;

    let drawW = vWidth;
    let drawH = vHeight;

    if (imgRatio > viewRatio) {
      // image is wider than container width limits, height is filled
      drawH = vHeight;
      drawW = vHeight * imgRatio;
    } else {
      drawW = vWidth;
      drawH = vWidth / imgRatio;
    }

    // Apply Zoom
    drawW = drawW * zoom * scaleFactor;
    drawH = drawH * zoom * scaleFactor;

    ctx.drawImage(
      img,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );

    // Export to jpeg base64
    const editedBase64 = canvas.toDataURL('image/jpeg', 0.85);
    onSave(editedBase64);
    onClose();
  };

  // Predefined Filters
  const filtersList = [
    { id: 'none', label: 'None', preview: '' },
    { id: 'grayscale', label: 'Mono', preview: 'grayscale(100%)' },
    { id: 'sepia', label: 'Sepia', preview: 'sepia(80%)' },
    { id: 'warm', label: 'Warm', preview: 'saturate(130%) sepia(20%)' },
    { id: 'cool', label: 'Cool', preview: 'hue-rotate(15deg) saturate(110%)' },
    { id: 'vintage', label: 'Vintage', preview: 'contrast(115%) sepia(25%)' },
    { id: 'invert', label: 'Negative', preview: 'invert(100%)' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col">
            {/* Viewport Editor Bounding Box */}
            <div className="relative flex-1 flex items-center justify-center bg-slate-950 p-2 rounded-3xl overflow-hidden min-h-[300px]">
              <div 
                ref={viewportRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
                className={cn(
                  "relative overflow-hidden cursor-move select-none shadow-2xl flex items-center justify-center",
                  aspectRatio === '1:1' ? "w-64 h-64 rounded-full" : 
                  aspectRatio === '16:9' ? "w-80 h-44 rounded-2xl" : 
                  aspectRatio === '4:3' ? "w-72.5 h-[218px] rounded-2xl" : "w-64 h-64 rounded-2xl"
                )}
                style={{
                  boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75)',
                  border: '2px solid rgba(255, 255, 255, 0.4)'
                }}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Raw upload"
                  draggable={false}
                  crossOrigin="anonymous"
                  className="max-w-none max-h-none select-none transition-transform pointer-events-none origin-center"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    filter: getFilterStyle(),
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              </div>

              {/* Viewport Guidelines Overlay */}
              <div className="absolute bottom-4 left-4 text-[10px] bg-black/60 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-widest pointer-events-none flex items-center gap-1">
                <Sliders className="w-3 h-3 text-indigo-400" />
                Drag to Reposition
              </div>
            </div>

            {/* Editing Category Tabs */}
            <div className="flex bg-gray-50 p-1 rounded-2xl gap-1 border border-gray-100">
              <button
                onClick={() => setActiveTab('crop')}
                className={cn(
                  "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'crop' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                Zoom & Rotation
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={cn(
                  "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'filters' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                Tone & Filters
              </button>
            </div>

            {/* Tab Inner Controls */}
            {activeTab === 'crop' ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Scale/Zoom Controls */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span>Magnification (Zoom)</span>
                    <span className="text-indigo-600 font-extrabold">{zoom.toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                      className="p-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors rounded-xl border border-gray-100"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3px"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <button 
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="p-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors rounded-xl border border-gray-100"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rotation control */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rotate Image</span>
                  <div className="flex items-center gap-2">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotation(deg)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-black rounded-lg transition-all border",
                          rotation === deg ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                        )}
                      >
                        {deg}°
                      </button>
                    ))}
                    <button
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      title="Rotate 90 Deg"
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors rounded-lg border border-indigo-100"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* Basic Adjustment Sliders (Brightness, Contrast) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" /> Bright</span>
                      <span className="text-gray-600 font-extrabold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Contrast className="w-3.5 h-3.5 text-purple-500" /> Contrast</span>
                      <span className="text-gray-600 font-extrabold">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="55"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Filter Presets</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {filtersList.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                          "flex-shrink-0 px-3 py-2 rounded-xl text-center border text-xs font-bold transition-all relative overflow-hidden",
                          filter === f.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                        )}
                      >
                        <div className="text-[10px] capitalize leading-none mb-1.5">{f.label}</div>
                        <div 
                          className="w-10 h-6 mx-auto rounded-md bg-gray-300 border border-black/10" 
                          style={{ filter: f.preview, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetStates}
              className="px-5 py-3 text-xs bg-white border border-gray-200 text-gray-500 rounded-2xl hover:text-gray-800 hover:bg-gray-100 transition-all font-bold"
            >
              Reset Settings
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 text-xs text-gray-500 hover:text-gray-800 transition-colors font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-3 text-xs bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                Done & Apply
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
