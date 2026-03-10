export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          owner_id: string
          email: string
          phone: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due' | null
          subscription_plan: 'starter' | 'pro' | 'multi' | null
          alert_email_enabled: boolean
          alert_sms_enabled: boolean
          alert_days_before: number
          alert_hour: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['restaurants']['Row']>
      }
      products: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          category: 'viande' | 'poisson' | 'légumes' | 'produits laitiers' | 'épicerie' | 'boissons' | 'autre'
          unit: 'kg' | 'g' | 'L' | 'unité' | 'bouteille' | 'boîte'
          default_shelf_life_days: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      stock_entries: {
        Row: {
          id: string
          restaurant_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit: string
          category: 'viande' | 'poisson' | 'légumes' | 'produits laitiers' | 'épicerie' | 'boissons' | 'autre'
          delivery_date: string
          expiry_date: string
          supplier: string | null
          invoice_number: string | null
          invoice_image_url: string | null
          notes: string | null
          is_consumed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_entries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['stock_entries']['Row']>
      }
      alerts: {
        Row: {
          id: string
          restaurant_id: string
          stock_entry_id: string | null
          alert_type: 'expiring_soon' | 'expired'
          days_before_expiry: number | null
          sent_at: string
          channel: 'email' | 'sms'
        }
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'sent_at'>
        Update: Partial<Database['public']['Tables']['alerts']['Row']>
      }
      invoices: {
        Row: {
          id: string
          restaurant_id: string
          image_url: string
          raw_extracted_data: Json | null
          status: 'processing' | 'processed' | 'error'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Row']>
      }
    }
  }
}

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type StockEntry = Database['public']['Tables']['stock_entries']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
