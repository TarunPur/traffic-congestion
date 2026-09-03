/**
 * Database types. Placeholder shape for P0.4 — the authoritative generated types land with the
 * P2 migrations (`supabase gen types typescript`). Kept minimal + strict (no `any`) so the
 * clients are typed today; `places` is the public-read reference table used by the P0.4 smoke read.
 */

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          name: string;
          sub_label: string | null;
          type: "area" | "metro" | "bus_stop" | "office_hub" | "landmark";
          lat: number;
          lng: number;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sub_label?: string | null;
          type: "area" | "metro" | "bus_stop" | "office_hub" | "landmark";
          lat: number;
          lng: number;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          sub_label?: string | null;
          type?: "area" | "metro" | "bus_stop" | "office_hub" | "landmark";
          lat?: number;
          lng?: number;
          source?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
