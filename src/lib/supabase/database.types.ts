export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alert_deliveries: {
        Row: {
          dikirim_at: string
          harga_pemicu: number
          id: string
          kanal: string
          status: string
          watchlist_id: string
        }
        Insert: {
          dikirim_at?: string
          harga_pemicu: number
          id?: string
          kanal: string
          status: string
          watchlist_id: string
        }
        Update: {
          dikirim_at?: string
          harga_pemicu?: number
          id?: string
          kanal?: string
          status?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      board_grades: {
        Row: {
          id: string
          kode: string
          nama: string
          penjelasan: string
          urutan: number
        }
        Insert: {
          id?: string
          kode: string
          nama: string
          penjelasan: string
          urutan: number
        }
        Update: {
          id?: string
          kode?: string
          nama?: string
          penjelasan?: string
          urutan?: number
        }
        Relationships: []
      }
      component_observations: {
        Row: {
          board_grade_id: string | null
          catatan: string | null
          component_type_id: string
          dicatat_by: string | null
          harga: number
          id: number
          koreksi_atas: number | null
          observed_at: string
          part_grade_id: string | null
          perlu_verifikasi: boolean
          product_id: string
          seller_id: string
          sumber: string
        }
        Insert: {
          board_grade_id?: string | null
          catatan?: string | null
          component_type_id: string
          dicatat_by?: string | null
          harga: number
          id?: number
          koreksi_atas?: number | null
          observed_at?: string
          part_grade_id?: string | null
          perlu_verifikasi?: boolean
          product_id: string
          seller_id: string
          sumber: string
        }
        Update: {
          board_grade_id?: string | null
          catatan?: string | null
          component_type_id?: string
          dicatat_by?: string | null
          harga?: number
          id?: number
          koreksi_atas?: number | null
          observed_at?: string
          part_grade_id?: string | null
          perlu_verifikasi?: boolean
          product_id?: string
          seller_id?: string
          sumber?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_observations_board_grade_id_fkey"
            columns: ["board_grade_id"]
            isOneToOne: false
            referencedRelation: "board_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "component_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_koreksi_atas_fkey"
            columns: ["koreksi_atas"]
            isOneToOne: false
            referencedRelation: "component_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_part_grade_id_fkey"
            columns: ["part_grade_id"]
            isOneToOne: false
            referencedRelation: "part_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      component_types: {
        Row: {
          id: string
          kategori_grade: string
          kode: string
          nama: string
          urutan: number
        }
        Insert: {
          id?: string
          kategori_grade: string
          kode: string
          nama: string
          urutan: number
        }
        Update: {
          id?: string
          kategori_grade?: string
          kode?: string
          nama?: string
          urutan?: number
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          tanggal: string
          usd_idr: number
        }
        Insert: {
          tanggal: string
          usd_idr: number
        }
        Update: {
          tanggal?: string
          usd_idr?: number
        }
        Relationships: []
      }
      market_events: {
        Row: {
          catatan: string | null
          id: string
          jenis: string
          kategori: string[]
          label: string
          tanggal: string
        }
        Insert: {
          catatan?: string | null
          id?: string
          jenis: string
          kategori: string[]
          label: string
          tanggal: string
        }
        Update: {
          catatan?: string | null
          id?: string
          jenis?: string
          kategori?: string[]
          label?: string
          tanggal?: string
        }
        Relationships: []
      }
      part_grades: {
        Row: {
          id: string
          kategori: string
          kode: string
          nama: string
          penjelasan: string
          urutan: number
        }
        Insert: {
          id?: string
          kategori: string
          kode: string
          nama: string
          penjelasan: string
          urutan: number
        }
        Update: {
          id?: string
          kategori?: string
          kode?: string
          nama?: string
          penjelasan?: string
          urutan?: number
        }
        Relationships: []
      }
      price_observations: {
        Row: {
          catatan: string | null
          dicatat_by: string | null
          fullset: boolean | null
          garansi: string
          grade: string | null
          harga: number
          id: number
          kondisi: string
          koreksi_atas: number | null
          observed_at: string
          perlu_verifikasi: boolean
          product_id: string
          seller_id: string
          sisi: string
          source_id: string | null
          sumber: string
          url: string | null
        }
        Insert: {
          catatan?: string | null
          dicatat_by?: string | null
          fullset?: boolean | null
          garansi: string
          grade?: string | null
          harga: number
          id?: number
          kondisi: string
          koreksi_atas?: number | null
          observed_at?: string
          perlu_verifikasi?: boolean
          product_id: string
          seller_id: string
          sisi?: string
          source_id?: string | null
          sumber: string
          url?: string | null
        }
        Update: {
          catatan?: string | null
          dicatat_by?: string | null
          fullset?: boolean | null
          garansi?: string
          grade?: string | null
          harga?: number
          id?: number
          kondisi?: string
          koreksi_atas?: number | null
          observed_at?: string
          perlu_verifikasi?: boolean
          product_id?: string
          seller_id?: string
          sisi?: string
          source_id?: string | null
          sumber?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_observations_koreksi_atas_fkey"
            columns: ["koreksi_atas"]
            isOneToOne: false
            referencedRelation: "harga_terkini"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_koreksi_atas_fkey"
            columns: ["koreksi_atas"]
            isOneToOne: false
            referencedRelation: "price_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          catatan: string | null
          hex: string
          id: string
          nama: string
          product_id: string
          rilis_at: string | null
        }
        Insert: {
          catatan?: string | null
          hex: string
          id?: string
          nama: string
          product_id: string
          rilis_at?: string | null
        }
        Update: {
          catatan?: string | null
          hex?: string
          id?: string
          nama?: string
          product_id?: string
          rilis_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          aktif: boolean
          bentuk: Json
          created_at: string
          id: string
          kategori: string
          model: string
          penerus_id: string | null
          rilis_at: string | null
          slug: string
          varian: string
        }
        Insert: {
          aktif?: boolean
          bentuk?: Json
          created_at?: string
          id?: string
          kategori: string
          model: string
          penerus_id?: string | null
          rilis_at?: string | null
          slug: string
          varian: string
        }
        Update: {
          aktif?: boolean
          bentuk?: Json
          created_at?: string
          id?: string
          kategori?: string
          model?: string
          penerus_id?: string | null
          rilis_at?: string | null
          slug?: string
          varian?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_penerus_id_fkey"
            columns: ["penerus_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nama: string | null
          peran: string
          wa_e164: string | null
          wa_terverifikasi: boolean
        }
        Insert: {
          created_at?: string
          id: string
          nama?: string | null
          peran?: string
          wa_e164?: string | null
          wa_terverifikasi?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string | null
          peran?: string
          wa_e164?: string | null
          wa_terverifikasi?: boolean
        }
        Relationships: []
      }
      scrape_runs: {
        Row: {
          dipicu_oleh: string
          id: number
          jumlah_baru: number | null
          jumlah_item: number | null
          jumlah_tak_terpetakan: number | null
          mulai_at: string
          pesan: string | null
          selesai_at: string | null
          source_id: string
          status: string
        }
        Insert: {
          dipicu_oleh: string
          id?: number
          jumlah_baru?: number | null
          jumlah_item?: number | null
          jumlah_tak_terpetakan?: number | null
          mulai_at?: string
          pesan?: string | null
          selesai_at?: string | null
          source_id: string
          status: string
        }
        Update: {
          dipicu_oleh?: string
          id?: number
          jumlah_baru?: number | null
          jumlah_item?: number | null
          jumlah_tak_terpetakan?: number | null
          mulai_at?: string
          pesan?: string | null
          selesai_at?: string | null
          source_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          aktif: boolean
          area: string
          created_at: string
          id: string
          lokasi: string | null
          nama: string
          tipe: string
          url: string | null
          wa: string | null
        }
        Insert: {
          aktif?: boolean
          area: string
          created_at?: string
          id?: string
          lokasi?: string | null
          nama: string
          tipe: string
          url?: string | null
          wa?: string | null
        }
        Update: {
          aktif?: boolean
          area?: string
          created_at?: string
          id?: string
          lokasi?: string | null
          nama?: string
          tipe?: string
          url?: string | null
          wa?: string | null
        }
        Relationships: []
      }
      service_observations: {
        Row: {
          catatan: string | null
          dicatat_by: string | null
          garansi_hari: number | null
          harga: number
          id: number
          koreksi_atas: number | null
          no_fix_no_pay: boolean
          observed_at: string
          part_grade_id: string | null
          perlu_verifikasi: boolean
          product_id: string
          service_type_id: string
          sumber: string
          termasuk_jasa: boolean
          workshop_id: string
        }
        Insert: {
          catatan?: string | null
          dicatat_by?: string | null
          garansi_hari?: number | null
          harga: number
          id?: number
          koreksi_atas?: number | null
          no_fix_no_pay?: boolean
          observed_at?: string
          part_grade_id?: string | null
          perlu_verifikasi?: boolean
          product_id: string
          service_type_id: string
          sumber: string
          termasuk_jasa?: boolean
          workshop_id: string
        }
        Update: {
          catatan?: string | null
          dicatat_by?: string | null
          garansi_hari?: number | null
          harga?: number
          id?: number
          koreksi_atas?: number | null
          no_fix_no_pay?: boolean
          observed_at?: string
          part_grade_id?: string | null
          perlu_verifikasi?: boolean
          product_id?: string
          service_type_id?: string
          sumber?: string
          termasuk_jasa?: boolean
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_observations_koreksi_atas_fkey"
            columns: ["koreksi_atas"]
            isOneToOne: false
            referencedRelation: "service_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_observations_part_grade_id_fkey"
            columns: ["part_grade_id"]
            isOneToOne: false
            referencedRelation: "part_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_observations_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_observations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          abaikan_rasio: boolean
          butuh_grade: boolean
          deskripsi: string | null
          id: string
          kategori: string
          nama: string
          slug: string
          tingkat: number
        }
        Insert: {
          abaikan_rasio?: boolean
          butuh_grade?: boolean
          deskripsi?: string | null
          id?: string
          kategori: string
          nama: string
          slug: string
          tingkat: number
        }
        Update: {
          abaikan_rasio?: boolean
          butuh_grade?: boolean
          deskripsi?: string | null
          id?: string
          kategori?: string
          nama?: string
          slug?: string
          tingkat?: number
        }
        Relationships: []
      }
      sinyal_cache: {
        Row: {
          alasan: string
          dihitung_at: string
          garansi: string
          grade: string | null
          id: string
          judul: string
          kode: string
          kondisi: string
          product_id: string
        }
        Insert: {
          alasan: string
          dihitung_at?: string
          garansi: string
          grade?: string | null
          id?: string
          judul: string
          kode: string
          kondisi: string
          product_id: string
        }
        Update: {
          alasan?: string
          dihitung_at?: string
          garansi?: string
          grade?: string | null
          id?: string
          judul?: string
          kode?: string
          kondisi?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinyal_cache_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      source_product_map: {
        Row: {
          abaikan: boolean
          external_key: string
          fullset: boolean | null
          grade: string | null
          id: string
          product_id: string | null
          source_id: string
        }
        Insert: {
          abaikan?: boolean
          external_key: string
          fullset?: boolean | null
          grade?: string | null
          id?: string
          product_id?: string | null
          source_id: string
        }
        Update: {
          abaikan?: boolean
          external_key?: string
          fullset?: boolean | null
          grade?: string | null
          id?: string
          product_id?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_product_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_product_map_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          adapter: string
          aktif: boolean
          base_url: string
          cadence: string
          config: Json
          id: string
          last_run_at: string | null
          seller_id: string
          sisi: string
        }
        Insert: {
          adapter: string
          aktif?: boolean
          base_url: string
          cadence: string
          config?: Json
          id?: string
          last_run_at?: string | null
          seller_id: string
          sisi: string
        }
        Update: {
          adapter?: string
          aktif?: boolean
          base_url?: string
          cadence?: string
          config?: Json
          id?: string
          last_run_at?: string | null
          seller_id?: string
          sisi?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_broadcast_drafts: {
        Row: {
          created_at: string
          id: string
          isi: string
          judul: string
          periode_mulai: string
          periode_selesai: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          isi: string
          judul: string
          periode_mulai: string
          periode_selesai: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          isi?: string
          judul?: string
          periode_mulai?: string
          periode_selesai?: string
          status?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          aktif: boolean
          created_at: string
          garansi: string | null
          grade: string | null
          id: string
          jenis: string
          kanal: string
          kondisi: string | null
          part_grade_id: string | null
          product_id: string | null
          service_type_id: string | null
          target_harga: number | null
          user_id: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          garansi?: string | null
          grade?: string | null
          id?: string
          jenis: string
          kanal?: string
          kondisi?: string | null
          part_grade_id?: string | null
          product_id?: string | null
          service_type_id?: string | null
          target_harga?: number | null
          user_id: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          garansi?: string | null
          grade?: string | null
          id?: string
          jenis?: string
          kanal?: string
          kondisi?: string | null
          part_grade_id?: string | null
          product_id?: string | null
          service_type_id?: string | null
          target_harga?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_part_grade_id_fkey"
            columns: ["part_grade_id"]
            isOneToOne: false
            referencedRelation: "part_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          aktif: boolean
          area: string
          bisa_board: boolean
          created_at: string
          id: string
          lokasi: string | null
          nama: string
          wa: string | null
        }
        Insert: {
          aktif?: boolean
          area: string
          bisa_board?: boolean
          created_at?: string
          id?: string
          lokasi?: string | null
          nama: string
          wa?: string | null
        }
        Update: {
          aktif?: boolean
          area?: string
          bisa_board?: boolean
          created_at?: string
          id?: string
          lokasi?: string | null
          nama?: string
          wa?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      harga_terkini: {
        Row: {
          catatan: string | null
          fullset: boolean | null
          garansi: string | null
          grade: string | null
          harga: number | null
          id: number | null
          kondisi: string | null
          observed_at: string | null
          perlu_verifikasi: boolean | null
          product_id: string | null
          seller_id: string | null
          sisi: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      pasaran_harian: {
        Row: {
          garansi: string | null
          grade: string | null
          jumlah_toko: number | null
          kondisi: string | null
          median: number | null
          product_id: string | null
          sisi: string | null
          tanggal: string | null
          terendah: number | null
          tertinggi: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rasio_komponen: {
        Row: {
          board_grade_id: string | null
          component_type_id: string | null
          harga_komponen: number | null
          harga_unit: number | null
          jumlah_penjual: number | null
          part_grade_id: string | null
          product_id: string | null
          rasio: number | null
          terakhir: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_observations_board_grade_id_fkey"
            columns: ["board_grade_id"]
            isOneToOne: false
            referencedRelation: "board_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "component_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_part_grade_id_fkey"
            columns: ["part_grade_id"]
            isOneToOne: false
            referencedRelation: "part_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sebaran_servis: {
        Row: {
          jumlah_bengkel: number | null
          p10: number | null
          p25: number | null
          p50: number | null
          p75: number | null
          p90: number | null
          part_grade_id: string | null
          product_id: string | null
          service_type_id: string | null
          terakhir: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_observations_part_grade_id_fkey"
            columns: ["part_grade_id"]
            isOneToOne: false
            referencedRelation: "part_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_observations_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      refresh_agregat: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

