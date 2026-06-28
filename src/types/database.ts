// src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type PropertyFeatures = {
  bedrooms?: number
  bathrooms?: number
  area_sqm?: number
  parking_spots?: number
  floor?: number
  total_floors?: number
  estrato?: number
  [key: string]: Json | undefined
}

export type ContractStatus = 'active' | 'ending' | 'ended' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'
export type UserRole = 'admin' | 'tenant' | 'owner'
export type TerminationReason = 'non_renewal_admin' | 'non_renewal_tenant' | 'renewed'

export type ContractAmendment = {
  id: string
  contract_id: string
  amendment_number: number
  amendment_date: string
  period_start: string
  period_end: string
  monthly_rent: number
  ipc_rate: number | null
  administration_fee: number
  admin_fee_increase_pct: number | null
  notes: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
      }
      profiles: {
        Row: { id: string; role: UserRole; created_at: string }
        Insert: { id: string; role?: UserRole }
        Update: { role?: UserRole }
        Relationships: []
      }
      owners: {
        Row: { id: string; full_name: string; document_number: string | null; phone: string | null; email: string | null; user_id: string | null; created_at: string }
        Insert: { id?: string; full_name: string; document_number?: string | null; phone?: string | null; email?: string | null; user_id?: string | null }
        Update: { full_name?: string; document_number?: string | null; phone?: string | null; email?: string | null; user_id?: string | null }
        Relationships: []
      }
      encrypted_passwords: {
        Row: { id: string; user_id: string; encrypted_password: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; encrypted_password: string }
        Update: { encrypted_password?: string; updated_at?: string }
        Relationships: []
      }
      properties: {
        Row: { id: string; name: string; address: string; type: string; description: string | null; features: PropertyFeatures; monthly_price: number | null; administration_fee: number | null; maps_url: string | null; chip: string | null; matricula: string | null; is_published: boolean; created_at: string }
        Insert: { id?: string; name: string; address: string; type: string; description?: string | null; features?: PropertyFeatures; monthly_price?: number | null; administration_fee?: number | null; maps_url?: string | null; chip?: string | null; matricula?: string | null; is_published?: boolean }
        Update: { name?: string; address?: string; type?: string; description?: string | null; features?: PropertyFeatures; monthly_price?: number | null; administration_fee?: number | null; maps_url?: string | null; chip?: string | null; matricula?: string | null; is_published?: boolean }
        Relationships: []
      }
      property_owners: {
        Row: { id: string; property_id: string; owner_id: string; ownership_pct: number; created_at: string }
        Insert: { id?: string; property_id: string; owner_id: string; ownership_pct?: number }
        Update: { ownership_pct?: number }
        Relationships: [{ foreignKeyName: "property_owners_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "owners"; referencedColumns: ["id"] }]
      }
      property_photos: {
        Row: { id: string; property_id: string; photo_url: string; is_cover: boolean; sort_order: number; created_at: string }
        Insert: { id?: string; property_id: string; photo_url: string; is_cover?: boolean; sort_order?: number }
        Update: { photo_url?: string; is_cover?: boolean; sort_order?: number }
        Relationships: []
      }
      property_feature_configs: {
        Row: { id: string; property_type: string; field_key: string; field_label: string; placeholder: string; field_type: string; sort_order: number; is_active: boolean }
        Insert: { id?: string; property_type: string; field_key: string; field_label: string; placeholder?: string; field_type?: string; sort_order?: number; is_active?: boolean }
        Update: { field_label?: string; placeholder?: string; field_type?: string; sort_order?: number; is_active?: boolean }
        Relationships: []
      }
      tenants: {
        Row: { id: string; user_id: string | null; full_name: string; document_number: string | null; phone: string | null; email: string; created_at: string }
        Insert: { id?: string; user_id?: string; full_name: string; document_number?: string | null; phone?: string | null; email: string | null }
        Update: { user_id?: string; full_name?: string; document_number?: string | null; phone?: string | null; email?: string | null }
        Relationships: []
      }
      insurers: {
        Row: { id: string; name: string; contact_name: string | null; phone: string | null; email: string | null; created_at: string }
        Insert: { id?: string; name: string; contact_name?: string; phone?: string; email?: string }
        Update: { name?: string; contact_name?: string; phone?: string; email?: string }
        Relationships: []
      }
      contracts: {
        Row: { id: string; property_id: string; tenant_id: string; start_date: string; end_date: string; monthly_rent: number; administration_fee: number; ipc_rate: number; min_wage_increase: number | null; status: ContractStatus; termination_reason: TerminationReason | null; termination_notice_date: string | null; ended_at: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; property_id: string; tenant_id: string; start_date: string; end_date: string; monthly_rent: number; administration_fee?: number | null; ipc_rate?: number | null; min_wage_increase?: number | null; status?: ContractStatus; termination_reason?: TerminationReason; termination_notice_date?: string; ended_at?: string; notes?: string | null }
        Update: { monthly_rent?: number; administration_fee?: number; ipc_rate?: number; min_wage_increase?: number | null; status?: ContractStatus; termination_reason?: TerminationReason; termination_notice_date?: string; ended_at?: string; notes?: string }
        Relationships: []
      }
      contract_amendments: {
        Row: ContractAmendment
        Insert: { id?: string; contract_id: string; amendment_number: number; amendment_date: string; period_start: string; period_end: string; monthly_rent: number; ipc_rate?: number | null; administration_fee?: number; admin_fee_increase_pct?: number | null; notes?: string | null }
        Update: { monthly_rent?: number; ipc_rate?: number | null; administration_fee?: number; admin_fee_increase_pct?: number | null; period_end?: string; notes?: string }
        Relationships: []
      }
      payments: {
        Row: { id: string; contract_id: string; amount: number; due_date: string; paid_date: string | null; status: PaymentStatus; receipt_url: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; contract_id: string; amount: number; due_date: string; paid_date?: string; status?: PaymentStatus; receipt_url?: string; notes?: string }
        Update: { amount?: number; due_date?: string; paid_date?: string; status?: PaymentStatus; receipt_url?: string; notes?: string }
        Relationships: []
      }
      documents: {
        Row: { id: string; contract_id: string; type: string; file_url: string; name: string; description: string | null; file_size: number | null; mime_type: string | null; uploaded_by: string | null; created_at: string }
        Insert: { id?: string; contract_id: string; type: string; file_url: string; name?: string; description?: string | null; file_size?: number | null; mime_type?: string | null; uploaded_by?: string }
        Update: { type?: string; file_url?: string; name?: string; description?: string | null; file_size?: number | null; mime_type?: string | null; uploaded_by?: string }
        Relationships: []
      }
      insurance_policies: {
        Row: { id: string; contract_id: string; insurer_id: string; policy_number: string | null; monthly_cost: number; start_date: string; end_date: string; created_at: string }
        Insert: { id?: string; contract_id: string; insurer_id: string; policy_number?: string; monthly_cost?: number; start_date: string; end_date: string }
        Update: { policy_number?: string; monthly_cost?: number; start_date?: string; end_date?: string }
        Relationships: []
      }
      system_config: {
        Row: { id: number; year: number; ipc_rate: number | null; min_wage_increase: number | null; renewal_notice_days: number | null; audit_retention_days: number | null; storage_limit_gb: number | null; updated_at: string | null }
        Insert: { id?: number; year: number; ipc_rate?: number | null; min_wage_increase?: number | null; renewal_notice_days?: number | null; audit_retention_days?: number | null; storage_limit_gb?: number | null; updated_at?: string | null }
        Update: { ipc_rate?: number | null; min_wage_increase?: number | null; renewal_notice_days?: number | null; audit_retention_days?: number | null; storage_limit_gb?: number | null; updated_at?: string | null }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; user_id: string; user_email: string; action: string; entity: string; entity_id: string; entity_name: string | null; changes: Json | null; metadata: Json | null; created_at: string }
        Insert: { id?: string; user_id: string; user_email: string; action: string; entity: string; entity_id: string; entity_name?: string | null; changes?: Json | null; metadata?: Json | null }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: { foreignKeyName: string; columns: string[]; referencedRelation: string; referencedColumns: string[] }[] }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
  }
}
