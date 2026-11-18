import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import {
  Check,
  FlipHorizontal2,
  ImagePlus,
  Link2,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface ImagePresetOption {
  label: string;
  url: string;
}

type AspectKey = '4:3' | '1:1' | '16:9';

const ASPECT_DIMENSIONS: Record<AspectKey, { width: number; height: number; label: string }> = {
  '4:3': { width: 960, height: 720, label: '4:3 (Produk)' },
  '1:1': { width: 800, height: 800, label: '1:1 (Persegi)' },
  '16:9': { width: 1280, height: 720, label: '16:9 (Banner)' },
};

const FILTER_PRESETS = [
  { label: 'Normal', brightness: 100, contrast: 100, saturation: 100 },
  { label: 'Hangat Roti', brightness: 106, contrast: 108, saturation: 122 },
  { label: 'Cerah Segar', brightness: 114, contrast: 104, saturation: 112 },
  { label: 'Kontras Tajam', brightness: 102, contrast: 122, saturation: 115 },
];

interface ImageUploadEditorProps {
  id: string;
  label: string;
  value: string;
  defaultAspect?: AspectKey;
  presets: ImagePresetOption[];
  onChange: (nextUrl: string) => void;
}

export function ImageUploadEditor({
  id,
  label,
  value,
  defaultAspect = '4:3',
  presets,
  onChange,
}: ImageUploadEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [sourceMode, setSourceMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modal editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorSource, setEditorSource] = useState<string | null>(null);
  const [imageReadyTick, setImageReadyTick] = useState(0);
  const [aspect, setAspect] = useState<AspectKey>(defaultAspect);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Pointer drag state for panning
  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originPanX: 0,
    originPanY: 0,
  });

  useEffect(() => {
    setUrlInput(value);
  }, [value]);

  function resetEditorControls() {
    setAspect(defaultAspect);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  }

  function openEditorWithSource(src: string) {
    setUploadError(null);
    resetEditorControls();
    setEditorSource(src);
    setIsEditorOpen(true);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file foto maksimal 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        openEditorWithSource(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file foto dari perangkat Anda.');
    };
    reader.readAsDataURL(file);
  }

  // Load image into memory when editor opens
  useEffect(() => {
    if (!isEditorOpen || !editorSource) return;

    const img = new Image();
    if (!editorSource.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      loadedImageRef.current = img;
      setImageReadyTick((t) => t + 1);
    };
    img.onerror = () => {
      loadedImageRef.current = null;
      setUploadError('Gagal memuat foto untuk diedit. Pastikan file atau URL gambar valid.');
    };
    img.src = editorSource;
  }, [isEditorOpen, editorSource]);

  // Draw live WYSIWYG preview on canvas
  useEffect(() => {
    if (!isEditorOpen) return;
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;

    const { width: W, height: H } = ASPECT_DIMENSIONS[aspect];
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = '#FAF5EC';
    ctx.fillRect(0, 0, W, H);

    const isRotated90 = Math.abs(rotation) % 180 === 90;
    const effW = isRotated90 ? img.naturalHeight : img.naturalWidth;
    const effH = isRotated90 ? img.naturalWidth : img.naturalHeight;
    const baseScale = Math.max(W / effW, H / effH);
    const scale = baseScale * zoom;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.translate(W / 2 + panX, H / 2 + panY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [
    isEditorOpen,
    imageReadyTick,
    aspect,
    zoom,
    panX,
    panY,
    rotation,
    flipH,
    brightness,
    contrast,
    saturation,
  ]);

  function handleCanvasPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originPanX: panX,
      originPanY: panY,
    };
  }

  function handleCanvasPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!dragStateRef.current.dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / Math.max(rect.width, 1);
    const dx = (e.clientX - dragStateRef.current.startX) * scaleRatio;
    const dy = (e.clientY - dragStateRef.current.startY) * scaleRatio;
    setPanX(Math.round(dragStateRef.current.originPanX + dx));
    setPanY(Math.round(dragStateRef.current.originPanY + dy));
  }

  function handleCanvasPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    dragStateRef.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  async function handleSaveEditedImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      } catch {
        setUploadError(
          'Gambar dari URL eksternal ini diblokir CORS untuk diedit. Silakan download lalu upload file fotonya dari komputer Anda.'
        );
        setIsUploading(false);
        return;
      }

      const res = await fetch('/api/dapur-admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setUploadError(
          'Endpoint upload belum aktif. Restart server (Ctrl+C lalu npm run dev) dan coba lagi.'
        );
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.url) {
        setUploadError(data.message ?? 'Gagal menyimpan foto ke server.');
        return;
      }

      onChange(data.url);
      setIsEditorOpen(false);
      setEditorSource(null);
    } catch {
      setUploadError('Gagal mengupload foto. Periksa koneksi server Anda.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-semibold text-[#5C3A21]">
          {label}
        </label>
        <div className="inline-flex items-center bg-[#FAF5EC] p-0.5 rounded-lg border border-[#5C3A21]/15">
          <button
            type="button"
            onClick={() => setSourceMode('upload')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
              sourceMode === 'upload'
                ? 'bg-white text-[#5C3A21] shadow-xs'
                : 'text-[#7C604C] hover:text-[#5C3A21]'
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('preset')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
              sourceMode === 'preset'
                ? 'bg-white text-[#5C3A21] shadow-xs'
                : 'text-[#7C604C] hover:text-[#5C3A21]'
            }`}
          >
            Preset
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('url')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
              sourceMode === 'url'
                ? 'bg-white text-[#5C3A21] shadow-xs'
                : 'text-[#7C604C] hover:text-[#5C3A21]'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {/* Preview bar */}
      <div className="flex items-center gap-3 p-2.5 bg-[#FAF5EC]/70 rounded-xl border border-[#5C3A21]/12">
        <img
          src={value}
          alt="Preview foto"
          referrerPolicy="no-referrer"
          className="w-20 h-15 rounded-lg object-cover bg-white border border-[#5C3A21]/15 shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] text-[#6E5644] truncate font-mono" title={value}>
            {value.startsWith('/uploads/') ? 'Foto Upload Sendiri' : value}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors"
            >
              <Upload className="w-3 h-3" aria-hidden="true" />
              <span>Upload Foto</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={() => openEditorWithSource(value)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#5C3A21] bg-white hover:bg-[#FAF5EC] border border-[#5C3A21]/20 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
                <span>Customize Foto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {sourceMode === 'upload' && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-3 border-2 border-dashed border-[#5C3A21]/20 hover:border-[#D97706] bg-[#FFFDF9] hover:bg-[#FAF5EC] rounded-xl text-center transition-colors flex flex-col items-center justify-center gap-1"
        >
          <ImagePlus className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
          <span className="text-xs font-semibold text-[#5C3A21]">
            Pilih foto dari komputer / HP (JPG, PNG, WebP)
          </span>
          <span className="text-[11px] text-[#7C604C]">
            Otomatis membuka editor crop, zoom, putar &amp; warna
          </span>
        </button>
      )}

      {sourceMode === 'preset' && (
        <select
          value={presets.some((p) => p.url === value) ? value : ''}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
        >
          {!presets.some((p) => p.url === value) && (
            <option value="">-- Sedang memakai foto kustom --</option>
          )}
          {presets.map((preset) => (
            <option key={preset.url} value={preset.url}>
              {preset.label}
            </option>
          ))}
        </select>
      )}

      {sourceMode === 'url' && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Link2
              className="w-3.5 h-3.5 text-[#7C604C] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (e.target.value.trim()) {
                  onChange(e.target.value.trim());
                }
              }}
              placeholder="https://contoh.com/foto-roti.jpg"
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#5C3A21]/20 rounded-xl focus:outline-none focus:border-[#D97706]"
            />
          </div>
        </div>
      )}

      {uploadError && !isEditorOpen && (
        <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {uploadError}
        </p>
      )}

      {/* Modal Editor Kustomisasi Foto */}
      {isEditorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editor Kustomisasi Foto"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C3A21]/55 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FFFDF9] rounded-2xl border border-[#5C3A21]/15 shadow-2xl">
            <div className="px-5 py-4 border-b border-[#5C3A21]/10 flex items-center justify-between gap-3 sticky top-0 bg-[#FFFDF9] z-10">
              <div>
                <h3 className="font-display text-lg font-bold text-[#5C3A21]">
                  Customize Foto Produk
                </h3>
                <p className="text-xs text-[#7C604C]">
                  Geser foto langsung di kotak preview untuk mengatur posisi crop, zoom, putar, atau warna.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditorOpen(false);
                  setEditorSource(null);
                  setUploadError(null);
                }}
                aria-label="Tutup editor foto"
                className="p-1.5 text-[#7C604C] hover:text-[#5C3A21] rounded-lg hover:bg-[#FAF5EC]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Interactive Canvas Preview */}
              <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#5C3A21]/12 flex flex-col items-center">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                  className="w-full max-h-[320px] object-contain rounded-xl shadow-sm cursor-grab active:cursor-grabbing touch-none bg-[#FAF5EC]"
                  style={{
                    aspectRatio: `${ASPECT_DIMENSIONS[aspect].width} / ${ASPECT_DIMENSIONS[aspect].height}`,
                  }}
                />
                <p className="mt-2 text-[11px] text-[#7C604C]">
                  Tips: Klik &amp; geser gambar di atas untuk memusatkan bagian roti terbaik.
                </p>
              </div>

              {uploadError && (
                <div className="px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl">
                  {uploadError}
                </div>
              )}

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rasio & Transform */}
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#5C3A21]/10">
                  <div>
                    <span className="block text-[11px] font-semibold text-[#5C3A21] mb-1.5">
                      Rasio Potong (Crop)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['4:3', '1:1', '16:9'] as AspectKey[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setAspect(key)}
                          className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
                            aspect === key
                              ? 'bg-[#5C3A21] text-white border-[#5C3A21]'
                              : 'bg-[#FAF5EC] text-[#5C3A21] border-[#5C3A21]/15 hover:bg-[#F3E9D8]'
                          }`}
                        >
                          {ASPECT_DIMENSIONS[key].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#5C3A21] mb-1">
                      <span className="inline-flex items-center gap-1">
                        <ZoomIn className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                        Zoom
                      </span>
                      <span className="tabular-nums">{zoom.toFixed(2)}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ZoomOut className="w-3.5 h-3.5 text-[#7C604C]" aria-hidden="true" />
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-[#D97706]"
                      />
                      <ZoomIn className="w-3.5 h-3.5 text-[#7C604C]" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-[#5C3A21] mb-1.5">
                      Putar &amp; Balik Foto
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#5C3A21] bg-[#FAF5EC] hover:bg-[#F3E9D8] rounded-lg border border-[#5C3A21]/15"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#5C3A21] bg-[#FAF5EC] hover:bg-[#F3E9D8] rounded-lg border border-[#5C3A21]/15"
                      >
                        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>+90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipH((f) => !f)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
                          flipH
                            ? 'bg-[#5C3A21] text-white border-[#5C3A21]'
                            : 'text-[#5C3A21] bg-[#FAF5EC] hover:bg-[#F3E9D8] border-[#5C3A21]/15'
                        }`}
                      >
                        <FlipHorizontal2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Balik Horizontal</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color & Tone Controls */}
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#5C3A21]/10">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C3A21] mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                      Preset Tone Cepat
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FILTER_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setBrightness(preset.brightness);
                            setContrast(preset.contrast);
                            setSaturation(preset.saturation);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-[#5C3A21] bg-[#FAF5EC] hover:bg-[#F3E9D8] border border-[#5C3A21]/15 rounded-lg"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-[#5C3A21]">
                      <span>Kecerahan</span>
                      <span className="tabular-nums">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-[#D97706]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-[#5C3A21]">
                      <span>Kontras</span>
                      <span className="tabular-nums">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-[#D97706]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-[#5C3A21]">
                      <span>Saturasi Warna</span>
                      <span className="tabular-nums">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-[#D97706]"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#5C3A21]/10">
                <button
                  type="button"
                  onClick={resetEditorControls}
                  className="px-3.5 py-2 text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21] hover:bg-[#FAF5EC] rounded-xl transition-colors"
                >
                  Reset ke Asli
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorOpen(false);
                      setEditorSource(null);
                      setUploadError(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#5C3A21] bg-white border border-[#5C3A21]/20 hover:bg-[#FAF5EC] rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleSaveEditedImage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>{isUploading ? 'Mengupload...' : 'Simpan & Pakai Foto'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
