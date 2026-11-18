import { useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import {
  CSV_TEMPLATE_CONTENT,
  parseProductsCsv,
  type ParsedCsvProductRow,
} from '../utils/csvProducts';
import { formatRupiah } from '../utils/orderLogic';

interface ProductCsvImportPanelProps {
  onImported: (summaryMessage: string) => void;
}

export function ProductCsvImportPanel({ onImported }: ProductCsvImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<ParsedCsvProductRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const validRows = previewRows.filter((r) => !r.error);
  const invalidRows = previewRows.filter((r) => Boolean(r.error));

  function handleDownloadTemplate() {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE_CONTENT], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-produk-roti.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setParseError(null);
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Harap pilih file berformat .csv (Comma / Semicolon Separated Values).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = parseProductsCsv(content);
      setFileName(file.name);
      setCsvText(content);
      if (result.headerError) {
        setParseError(result.headerError);
        setPreviewRows([]);
      } else {
        setPreviewRows(result.rows);
      }
    };
    reader.onerror = () => {
      setParseError('Gagal membaca file CSV dari komputer Anda.');
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleClearSelection() {
    setFileName(null);
    setCsvText('');
    setPreviewRows([]);
    setParseError(null);
  }

  async function handleConfirmImport() {
    if (!csvText || validRows.length === 0) return;
    setParseError(null);
    setIsImporting(true);
    try {
      const res = await fetch('/api/dapur-admin/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setParseError(
          'Endpoint import CSV belum aktif. Restart server (Ctrl+C lalu npm run dev) dan coba lagi.'
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setParseError(data.message ?? 'Gagal mengimpor produk dari CSV.');
        return;
      }

      const catNote =
        data.createdCategoriesCount > 0
          ? ` (${data.createdCategoriesCount} kategori baru otomatis dibuat)`
          : '';
      const skipNote =
        data.skippedCount > 0 ? `, ${data.skippedCount} baris dilewati karena tidak valid` : '';

      handleClearSelection();
      onImported(`Berhasil mengimpor ${data.importedCount} barang dari CSV${catNote}${skipNote}.`);
    } catch {
      setParseError('Gagal terhubung ke server saat mengimpor CSV.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-[#FAF5EC] rounded-xl border border-[#5C3A21]/12 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#5C3A21]">
              1. Unduh Template CSV terlebih dahulu
            </p>
            <p className="text-[11px] text-[#6E5644] mt-0.5 leading-relaxed">
              Isi daftar roti/snack box Anda di Excel atau Google Sheets. Mendukung pemisah koma (
              <code className="font-mono">,</code>) maupun titik koma (
              <code className="font-mono">;</code>).
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#5C3A21] bg-white hover:bg-[#F3E9D8] border border-[#5C3A21]/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
            <span>Template .CSV</span>
          </button>
        </div>

        <div className="text-[11px] text-[#7C604C] bg-white/80 rounded-lg p-2.5 border border-[#5C3A21]/10 space-y-1">
          <p className="font-semibold text-[#5C3A21]">Kolom yang didukung:</p>
          <p className="font-mono text-[10px] leading-relaxed">
            nama*, kategori, harga*, stok, expired_hari, varian, deskripsi, foto, tersedia
          </p>
          <p className="text-[10px]">
            • Pisahkan beberapa varian dengan tanda <code className="font-mono">|</code> (contoh:{' '}
            <code className="font-mono">Cokelat | Keju | Pandan</code>).
            <br />• <em>stok</em> default 20 pcs, <em>expired_hari</em> default 3 hari. Kategori
            baru otomatis dibuatkan.
          </p>
        </div>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!fileName ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 px-4 border-2 border-dashed border-[#5C3A21]/25 hover:border-[#D97706] bg-[#FFFDF9] hover:bg-[#FAF5EC] rounded-xl text-center transition-colors flex flex-col items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
            <span className="text-xs font-bold text-[#5C3A21]">
              2. Pilih File .CSV dari Komputer Anda
            </span>
            <span className="text-[11px] text-[#7C604C]">
              Pratinjau barang akan langsung muncul sebelum disimpan ke database MySQL
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-[#5C3A21]/20 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-[#5C3A21] truncate">{fileName}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-[11px] font-semibold text-[#5C3A21] hover:bg-[#FAF5EC] rounded-lg"
              >
                Ganti File
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                aria-label="Hapus file pilihan"
                className="p-1 text-[#7C604C] hover:text-red-700 rounded-lg hover:bg-red-50"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {parseError && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{parseError}</span>
        </div>
      )}

      {previewRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{validRows.length} barang siap diimpor</span>
            </span>
            {invalidRows.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{invalidRows.length} baris tidak valid (akan dilewati)</span>
              </span>
            )}
          </div>

          <div className="max-h-56 overflow-auto rounded-xl border border-[#5C3A21]/15 bg-white">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="sticky top-0 bg-[#FAF5EC] text-[#5C3A21] border-b border-[#5C3A21]/12">
                <tr>
                  <th className="py-2 px-2.5 font-semibold">#</th>
                  <th className="py-2 px-2.5 font-semibold">Nama Barang</th>
                  <th className="py-2 px-2.5 font-semibold">Stok / Exp</th>
                  <th className="py-2 px-2.5 font-semibold text-right">Harga</th>
                  <th className="py-2 px-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5C3A21]/10">
                {previewRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.error ? 'bg-red-50/70 text-red-800' : 'hover:bg-[#FFFDF9]'}
                  >
                    <td className="py-2 px-2.5 font-mono text-[#7C604C]">{row.rowNumber}</td>
                    <td className="py-2 px-2.5">
                      <p className="font-semibold text-[#5C3A21]">{row.name || '(Kosong)'}</p>
                      <p className="text-[10px] text-[#7C604C] truncate max-w-[160px]">
                        {row.category} · {row.variants.join(', ')}
                      </p>
                    </td>
                    <td className="py-2 px-2.5 text-[#6E5644] whitespace-nowrap">
                      <span className="font-semibold text-[#5C3A21] tabular-nums">{row.stock} pcs</span>
                      <span className="block text-[10px] text-[#7C604C]">
                        Exp {row.expired_days} hari
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right font-semibold tabular-nums">
                      {row.price >= 500 ? formatRupiah(row.price) : '-'}
                    </td>
                    <td className="py-2 px-2.5">
                      {row.error ? (
                        <span className="text-[10px] font-semibold text-red-700">{row.error}</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700">
                          {row.is_available ? 'Aktif' : 'Nonaktif'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={isImporting || validRows.length === 0}
            onClick={handleConfirmImport}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors disabled:opacity-60"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>
              {isImporting
                ? 'Mengimpor ke Database...'
                : `Import ${validRows.length} Barang Sekarang`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
