export interface ParsedCsvProductRow {
  rowNumber: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  expired_days: number;
  variants: string[];
  description: string;
  image: string;
  is_available: boolean;
  error?: string;
}

export const CSV_TEMPLATE_CONTENT = [
  'nama,kategori,harga,stok,expired_hari,varian,deskripsi,foto,tersedia',
  '"Roti Sobek Pandan Kelapa",roti,19000,25,3,"Pandan Kelapa | Pandan Keju","Roti sobek lembut aroma pandan wangi dengan isian unti kelapa manis gurih.",/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg,ya',
  '"Roti Mini Cokelat Meses",roti,4500,50,3,"Cokelat Meses | Stroberi | Keju","Roti mini empuk isi selai cokelat dan taburan meses melimpah cocok untuk snack box.",/src/assets/images/roti_manis_pisang_cokelat_1794924157573.jpg,ya',
  '"Paket Snack Box Pengajian A",paket,16500,40,1,"Standar | Tanpa Air Mineral","Isi 1 roti manis, 1 lemper ayam, 1 kue sus vla vanila, dan air mineral gelas dalam dus rapi.",/src/assets/images/paket_box_hemat_1794924157948.jpg,ya',
].join('\r\n');

function detectDelimiter(headerLine: string): ',' | ';' {
  let commaCount = 0;
  let semiCount = 0;
  let inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === ',') commaCount++;
      if (ch === ';') semiCount++;
    }
  }
  return semiCount > commaCount ? ';' : ',';
}

function parseCsvMatrix(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const firstNewline = cleanText.search(/\r?\n/);
  const firstLine = firstNewline === -1 ? cleanText : cleanText.slice(0, firstNewline);
  const delimiter = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .trim();
}

function parsePrice(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return NaN;
  return Number.parseInt(digits, 10);
}

function parseVariantsCell(raw: string): string[] {
  if (!raw.trim()) return ['Original'];
  const splitter = raw.includes('|') ? '|' : raw.includes(';') ? ';' : ',';
  const list = raw
    .split(splitter)
    .map((v) => v.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ['Original'];
}

function parseAvailableCell(raw: string): boolean {
  const clean = raw.trim().toLowerCase();
  if (!clean) return true;
  if (['0', 'false', 'tidak', 'no', 'nonaktif', 'habis'].includes(clean)) {
    return false;
  }
  return true;
}

export function parseProductsCsv(csvText: string): {
  rows: ParsedCsvProductRow[];
  headerError?: string;
} {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length < 2) {
    return {
      rows: [],
      headerError:
        'File CSV kosong atau hanya berisi header. Pastikan minimal ada 1 baris data produk.',
    };
  }

  const headers = matrix[0].map(normalizeHeader);
  const findCol = (aliases: string[]) => headers.findIndex((h) => aliases.includes(h));

  const nameIdx = findCol(['nama', 'namabarang', 'namaproduk', 'name', 'produk', 'product']);
  const categoryIdx = findCol(['kategori', 'kelompok', 'kelompokbarang', 'category']);
  const priceIdx = findCol(['harga', 'price']);
  const stockIdx = findCol(['stok', 'stock', 'qty', 'jumlah']);
  const expiredIdx = findCol([
    'expired_hari',
    'expiredhari',
    'expired_days',
    'expireddays',
    'expired',
    'kadaluarsa',
    'masasimpan',
    'masa_simpan',
    'tahanhari',
  ]);
  const variantsIdx = findCol(['varian', 'variants', 'rasa']);
  const descIdx = findCol(['deskripsi', 'description', 'keterangan']);
  const imageIdx = findCol(['foto', 'gambar', 'image', 'imageurl', 'urlfoto']);
  const availIdx = findCol(['tersedia', 'aktif', 'status', 'is_available', 'isavailable', 'available']);

  if (nameIdx === -1 || priceIdx === -1) {
    return {
      rows: [],
      headerError:
        'Kolom wajib "nama" dan "harga" tidak ditemukan di baris header CSV. Gunakan template CSV yang disediakan.',
    };
  }

  const parsed: ParsedCsvProductRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    const rowNumber = r + 1;
    const name = (cells[nameIdx] ?? '').trim();
    const category = categoryIdx >= 0 ? (cells[categoryIdx] ?? '').trim() : 'roti';
    const rawPrice = (cells[priceIdx] ?? '').trim();
    const price = parsePrice(rawPrice);
    const rawStock = stockIdx >= 0 ? (cells[stockIdx] ?? '').trim() : '';
    const parsedStock = rawStock ? parsePrice(rawStock) : 20;
    const stock = Number.isFinite(parsedStock) ? Math.max(0, parsedStock) : 20;
    const rawExpired = expiredIdx >= 0 ? (cells[expiredIdx] ?? '').trim() : '';
    const parsedExpired = rawExpired ? parsePrice(rawExpired) : 3;
    const expired_days = Number.isFinite(parsedExpired) && parsedExpired >= 1 ? parsedExpired : 3;
    const variants = parseVariantsCell(variantsIdx >= 0 ? (cells[variantsIdx] ?? '') : '');
    const rawDesc = descIdx >= 0 ? (cells[descIdx] ?? '').trim() : '';
    const description =
      rawDesc.length >= 5
        ? rawDesc
        : `${name} dipanggang segar dari dapur kami untuk kebutuhan acara dan keluarga.`;
    const image =
      (imageIdx >= 0 ? (cells[imageIdx] ?? '').trim() : '') ||
      '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg';
    const is_available = parseAvailableCell(availIdx >= 0 ? (cells[availIdx] ?? '') : 'ya');

    let error: string | undefined;
    if (!name || name.length < 2) {
      error = 'Nama produk minimal 2 karakter.';
    } else if (!Number.isFinite(price) || price < 500) {
      error = 'Harga tidak valid (minimal Rp 500).';
    }

    parsed.push({
      rowNumber,
      name,
      category: category || 'roti',
      price: Number.isFinite(price) ? price : 0,
      stock,
      expired_days,
      variants,
      description,
      image,
      is_available,
      error,
    });
  }

  return { rows: parsed };
}
