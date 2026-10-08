import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "KumaWorks Jobs — Temukan langkah karier berikutnya",
  description:
    "Temukan lowongan kerja, kirim lamaran, dan ikuti proses seleksi hingga bergabung. Satu profil untuk setiap peluang di KumaWorks.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
