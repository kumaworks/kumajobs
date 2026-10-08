import { ArrowUpRight, FileText, Mail, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/recruitment/candidate-forms";
import { safeCandidateReturn } from "@/lib/recruitment/domain";
export const metadata = {
  title: "Masuk — KumaWorks Jobs",
  robots: { index: false, follow: false },
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const p = await searchParams;
  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border bg-card lg:grid-cols-2">
      <section className="bg-accent p-8 sm:p-12">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ArrowUpRight className="size-7" />
        </span>
        <h1 className="mt-10 text-4xl font-medium leading-tight tracking-tight">
          Langkah berikutnya
          <br />
          dimulai dari sini.
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          Satu akun untuk setiap peluang. Simpan profil Anda dan ikuti
          perjalanan karier dari lamaran hingga bergabung.
        </p>
        <div className="mt-10 space-y-5 text-sm">
          <p className="flex items-center gap-3">
            <FileText className="size-5 text-primary" /> Profil dan dokumen yang
            dapat digunakan kembali
          </p>
          <p className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-primary" /> Masuk aman, tanpa
            mengingat kata sandi
          </p>
        </div>
      </section>
      <section className="flex flex-col justify-center p-8 sm:p-12">
        <Mail className="mb-6 size-7 text-primary" />
        <h2 className="text-2xl font-semibold tracking-tight">
          Selamat datang
        </h2>
        <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
          Masuk atau buat akun dengan alamat email Anda.
        </p>
        {p.error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 p-4 text-sm text-red-500"
          >
            Tautan sudah kedaluwarsa atau tidak valid. Minta tautan baru.
          </p>
        )}
        <LoginForm next={safeCandidateReturn(p.next ?? null)} />
      </section>
    </div>
  );
}
