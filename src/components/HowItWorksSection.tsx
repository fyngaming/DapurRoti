export function HowItWorksSection() {
  const steps = [
    {
      num: '01.',
      title: 'Pilih Menu & Jumlah Porsi',
      description:
        'Tambahkan varian roti manis, gurih, atau paket box hajatan sesuai kebutuhan tamu acara Anda. Keranjang tersimpan otomatis.',
    },
    {
      num: '02.',
      title: 'Isi Jadwal Acara & Pilih PO / Lunas',
      description:
        'Tentukan tanggal dan jam acara, alamat pengiriman, serta opsi Pre-Order DP 50% atau Pesan Langsung Lunas.',
    },
    {
      num: '03.',
      title: 'Kirim Otomatis ke WhatsApp Admin',
      description:
        'Pesanan tercatat dengan kode unik di riwayat akun Anda dan langsung terbuka di WhatsApp Admin dengan format rincian lengkap.',
    },
  ];

  return (
    <section
      id="cara-pesan"
      className="py-12 sm:py-16 bg-[#FAF5EC] border-t border-[#5C3A21]/10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97706]">
            Alur Pemesanan Praktis
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#5C3A21] text-balance">
            Tiga Langkah Menyiapkan Suguhan Acara
          </h2>
        </div>

        <div className="mode-grid-steps mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-[#FFFDF9] p-6 rounded-2xl border border-[#5C3A21]/10"
            >
              <span className="font-display text-xl font-bold text-[#D97706]">
                {step.num}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-[#5C3A21]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[#6E5644] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
