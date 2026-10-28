/**
 * Database types for the M1 tables. Written by hand to match supabase/migrations because
 * `supabase gen types` needs Docker; replace with the output of `pnpm db:types` (same shape).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Shape of the public schema, as `supabase gen types typescript` would produce it. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          phone_verified_at: string | null;
          locale: string;
          role: string;
          created_at: string;
        };
        Insert: never;
        Update: { name?: string | null; locale?: string };
      };
      clients: {
        Row: { id: string; owner_id: string; name: string; notes: string | null; created_at: string };
        Insert: { id?: string; owner_id?: string; name: string; notes?: string | null };
        Update: { name?: string; notes?: string | null };
      };
      measurement_sets: {
        Row: {
          id: string;
          owner_id: string;
          client_id: string | null;
          label: string;
          size_label: string | null;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          client_id?: string | null;
          label: string;
          size_label?: string | null;
          data: Json;
        };
        Update: { client_id?: string | null; label?: string; size_label?: string | null; data?: Json };
      };
      size_charts: {
        Row: {
          id: string;
          name: string;
          sizes: Json;
          is_default: boolean;
          owner_id: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sizes: Json;
          is_default?: boolean;
          owner_id?: string | null;
          updated_by?: string | null;
        };
        Update: { name?: string; sizes?: Json; is_default?: boolean; updated_by?: string | null };
      };
      fabrics: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          properties: Json;
          care_notes: Json;
          is_draft: boolean;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id: string;
          name_ar: string;
          name_en: string;
          properties: Json;
          care_notes: Json;
          is_draft?: boolean;
          updated_by?: string | null;
        };
        Update: {
          name_ar?: string;
          name_en?: string;
          properties?: Json;
          care_notes?: Json;
          is_draft?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      fabric_rules: {
        Row: {
          id: string;
          condition: Json;
          required_properties: Json;
          priority: number;
          reason: Json;
          is_draft: boolean;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id: string;
          condition: Json;
          required_properties: Json;
          priority: number;
          reason: Json;
          is_draft?: boolean;
          updated_by?: string | null;
        };
        Update: {
          condition?: Json;
          required_properties?: Json;
          priority?: number;
          reason?: Json;
          is_draft?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      fabric_calcs: {
        Row: {
          id: string;
          pattern_version_id: string;
          owner_id: string;
          options: Json;
          options_hash: string;
          result: Json;
          nesting_version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pattern_version_id: string;
          owner_id?: string;
          options: Json;
          options_hash: string;
          result: Json;
          nesting_version: string;
          updated_at?: string;
        };
        Update: { options?: Json; result?: Json; nesting_version?: string; updated_at?: string };
      };
      designs: {
        Row: {
          id: string;
          owner_id: string;
          category: "dress" | "skirt" | "blouse";
          title: string;
          photo_paths: string[];
          analysis: Json | null;
          current_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          category: "dress" | "skirt" | "blouse";
          title: string;
          photo_paths?: string[];
          analysis?: Json | null;
          current_version_id?: string | null;
          updated_at?: string;
        };
        Update: {
          category?: "dress" | "skirt" | "blouse";
          title?: string;
          photo_paths?: string[];
          analysis?: Json | null;
          current_version_id?: string | null;
          updated_at?: string;
        };
      };
      pattern_versions: {
        Row: {
          id: string;
          design_id: string;
          owner_id: string;
          version_no: number;
          spec: Json;
          measurement_set_id: string | null;
          measurements: Json;
          size_label: string | null;
          ease_profile: "fitted" | "regular" | "loose";
          options: Json;
          engine_version: string;
          validation_status: "pass" | "warn";
          input_hash: string;
          created_by: "user" | "chat";
          created_at: string;
        };
        Insert: {
          id?: string;
          design_id: string;
          owner_id?: string;
          version_no: number;
          spec: Json;
          measurement_set_id?: string | null;
          measurements: Json;
          size_label?: string | null;
          ease_profile: "fitted" | "regular" | "loose";
          options?: Json;
          engine_version: string;
          validation_status: "pass" | "warn";
          input_hash: string;
          created_by?: "user" | "chat";
        };
        Update: never;
      };
      admin_audit: {
        Row: {
          id: string;
          who: string | null;
          action: string;
          target: string | null;
          before: Json | null;
          after: Json | null;
          at: string;
        };
        Insert: { who?: string | null; action: string; target?: string | null; before?: Json; after?: Json };
        Update: never;
      };
    };
    Functions: { is_admin: { Args: never; Returns: boolean } };
  };
};
