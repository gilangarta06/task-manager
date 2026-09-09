# Task Manager

Web internal pelacak tugas & progress untuk tim Hotel Mataram (2 pengguna: owner & anggota, hak akses sama).

Stack: Next.js 16 (App Router) · TypeScript · Prisma 6 + PostgreSQL · Tailwind v4 · shadcn/ui (new-york).

## Fitur

- Login JWT, 2 akun di-seed
- Tambah tugas (judul, deskripsi, prioritas, status, penanggung jawab, proyek, jatuh tempo)
- **Papan Kanban** 6 kolom — drag-and-drop antar kolom & urut dalam kolom (@dnd-kit), dengan keyboard support
- Daftar/tabel tugas dengan filter (status, orang, proyek, cari judul)
- **Halaman detail**: edit judul/deskripsi inline, slider progress + catatan → `TaskUpdate`, timeline (update + komentar), checklist/subtask, **lampiran foto/PDF**, komentar
- Aturan otomatis: 100% → status Review, Done → progress dikunci 100%, `startedAt`/`completedAt` terisi otomatis, Blocked wajib alasan
- **Dashboard**: tugas saya, terlambat, antrean review, progress per proyek, aktivitas terakhir
- **Kalender** — tugas menurut jatuh tempo, per bulan
- **Laporan mingguan** — selesai/baru/rata-rata waktu pengerjaan, grafik per hari, rincian per orang & proyek
- Proyek + rollup progress, arsip
- Feed aktivitas gabungan
- Dark mode

## Setup

```bash
# 1. Buat database PostgreSQL
sudo -u postgres createuser --pwprompt taskmanager
sudo -u postgres createdb -O taskmanager task_manager

# 2. Konfigurasi environment
cp .env.example .env
#   isi DATABASE_URL sesuai kredensial di atas
#   isi JWT_SECRET  (openssl rand -base64 32)

# 3. Install & siapkan skema
npm install
npm run db:push
npm run db:seed

# 4. Jalankan
npm run dev            # http://localhost:3000
```

Login awal memakai `OWNER_EMAIL` / `MEMBER_EMAIL` dan `SEED_PASSWORD` dari `.env`.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server (Turbopack) di :3000 |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run lint` | ESLint |
| `npm run db:push` | Terapkan `schema.prisma` ke database |
| `npm run db:seed` | Seed 2 akun + data contoh |
| `npm run db:reset` | Reset database lalu seed ulang |
| `npx prisma studio` | GUI database |

## Struktur

```
app/
  (auth)/login/          Login
  (app)/                  Area terproteksi (butuh sesi)
    page.tsx              Dashboard
    board/                Papan Kanban (drag-and-drop)
    tasks/                Daftar + detail /tasks/[id] (id = nomor tugas)
    calendar/             Kalender jatuh tempo
    projects/             Proyek
    reports/              Laporan mingguan
    activity/             Feed aktivitas
  api/upload/             Upload lampiran (multipart → public/uploads)
  actions.ts             Semua server action (mutasi)
lib/
  prisma.ts  auth.ts  session.ts  workflow.ts  queries.ts  utils.ts
components/
  ui/                    Primitif (button, card, badge, select, modal, …)
  nav.tsx  task-card.tsx  new-task-dialog.tsx  new-project-dialog.tsx
prisma/
  schema.prisma  seed.ts
proxy.ts                 Middleware — gate sesi
public/uploads/          Berkas lampiran (di-gitignore)
```

## Konvensi

- Tanpa komentar di kode.
- Reuse dulu sebelum bikin util/komponen baru.
- Aturan status↔progress terpusat di `lib/workflow.ts`.
- Semua mutasi lewat server action di `app/actions.ts`; setiap perubahan status/progress mencatat `TaskUpdate` (immutable, tidak diedit/hapus).

## Menyusul

Notifikasi WhatsApp/email saat di-assign atau masuk Review, tugas berulang (harian/mingguan), integrasi dengan sistem hotel lain.
