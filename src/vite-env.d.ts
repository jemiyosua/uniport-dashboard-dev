/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Alamat API akses portal. Bawaan '/api' (lewat proxy dev server / reverse proxy yang sama). */
  readonly VITE_API_AKSES?: string;
  /** 'mati' = URL dibuka langsung sebagai portal Direksi. Selain itu (bawaan): wajib tautan terenkripsi (?akses=…). */
  readonly VITE_AKSES_TAUTAN?: string;
  /** 'api' = daftar wilayah/cabang/MO dari API backend Matrix. Selain itu (bawaan): src/data/dummy.ts. */
  readonly VITE_SUMBER_DATA?: string;
  /** Alamat backend Go (Matrix). Bawaan '/api-go' (proxy ke URL_GO). */
  readonly VITE_API_GO?: string;
}
