export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batch_usage_orders: {
        Row: {
          batch_usage_id: string
          id: string
          order_identifier: string
        }
        Insert: {
          batch_usage_id: string
          id?: string
          order_identifier: string
        }
        Update: {
          batch_usage_id?: string
          id?: string
          order_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_usage_orders_batch_usage_id_fkey"
            columns: ["batch_usage_id"]
            isOneToOne: false
            referencedRelation: "batch_usages"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_usages: {
        Row: {
          batch_number: string
          first_used: string
          id: string
          last_used: string
          orders_count: number
          product_id: string
          product_name: string
          total_weight: number
          used_weight: number
        }
        Insert: {
          batch_number: string
          first_used?: string
          id?: string
          last_used?: string
          orders_count?: number
          product_id: string
          product_name: string
          total_weight: number
          used_weight: number
        }
        Update: {
          batch_number?: string
          first_used?: string
          id?: string
          last_used?: string
          orders_count?: number
          product_id?: string
          product_name?: string
          total_weight?: number
          used_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_usages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      box_items: {
        Row: {
          batch_number: string | null
          box_id: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          weight: number
        }
        Insert: {
          batch_number?: string | null
          box_id: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          weight: number
        }
        Update: {
          batch_number?: string | null
          box_id?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "box_items_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "box_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes: {
        Row: {
          batch_number: string | null
          box_number: number
          completed: boolean | null
          id: string
          order_id: string
          printed: boolean | null
        }
        Insert: {
          batch_number?: string | null
          box_number: number
          completed?: boolean | null
          id?: string
          order_id: string
          printed?: boolean | null
        }
        Update: {
          batch_number?: string | null
          box_number?: number
          completed?: boolean | null
          id?: string
          order_id?: string
          printed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "boxes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "completed_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          complaint_details: string
          complaint_type: string
          contact_email: string | null
          contact_phone: string | null
          created: string
          customer_id: string | null
          customer_name: string
          customer_type: string
          date_submitted: string
          id: string
          invoice_number: string | null
          order_number: string | null
          product_id: string | null
          product_sku: string | null
          resolution_notes: string | null
          resolution_status: string
          return_status: string
          returns_required: string
          updated: string | null
        }
        Insert: {
          complaint_details: string
          complaint_type: string
          contact_email?: string | null
          contact_phone?: string | null
          created?: string
          customer_id?: string | null
          customer_name: string
          customer_type: string
          date_submitted: string
          id?: string
          invoice_number?: string | null
          order_number?: string | null
          product_id?: string | null
          product_sku?: string | null
          resolution_notes?: string | null
          resolution_status: string
          return_status: string
          returns_required: string
          updated?: string | null
        }
        Update: {
          complaint_details?: string
          complaint_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created?: string
          customer_id?: string | null
          customer_name?: string
          customer_type?: string
          date_submitted?: string
          id?: string
          invoice_number?: string | null
          order_number?: string | null
          product_id?: string | null
          product_sku?: string | null
          resolution_notes?: string | null
          resolution_status?: string
          return_status?: string
          returns_required?: string
          updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          address: string
          created: string
          email: string
          hold_reason: string | null
          id: string
          name: string
          needs_detailed_box_labels: boolean | null
          on_hold: boolean | null
          phone: string
          type: string
        }
        Insert: {
          account_number?: string | null
          address: string
          created?: string
          email: string
          hold_reason?: string | null
          id?: string
          name: string
          needs_detailed_box_labels?: boolean | null
          on_hold?: boolean | null
          phone: string
          type: string
        }
        Update: {
          account_number?: string | null
          address?: string
          created?: string
          email?: string
          hold_reason?: string | null
          id?: string
          name?: string
          needs_detailed_box_labels?: boolean | null
          on_hold?: boolean | null
          phone?: string
          type?: string
        }
        Relationships: []
      }
      missing_items: {
        Row: {
          date: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          status: string | null
        }
        Insert: {
          date?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          status?: string | null
        }
        Update: {
          date?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missing_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "completed_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      modified_deliveries: {
        Row: {
          delivery_date: string
          id: string
          notes: string | null
          standing_order_id: string
        }
        Insert: {
          delivery_date: string
          id?: string
          notes?: string | null
          standing_order_id: string
        }
        Update: {
          delivery_date?: string
          id?: string
          notes?: string | null
          standing_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modified_deliveries_standing_order_id_fkey"
            columns: ["standing_order_id"]
            isOneToOne: false
            referencedRelation: "standing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      modified_delivery_items: {
        Row: {
          id: string
          modified_delivery_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          modified_delivery_id: string
          product_id: string
          quantity: number
        }
        Update: {
          id?: string
          modified_delivery_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "modified_delivery_items_modified_delivery_id_fkey"
            columns: ["modified_delivery_id"]
            isOneToOne: false
            referencedRelation: "modified_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modified_delivery_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      non_working_days: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      order_changes: {
        Row: {
          date: string
          id: string
          new_quantity: number
          order_id: string
          original_quantity: number
          product_id: string
          product_name: string
        }
        Insert: {
          date?: string
          id?: string
          new_quantity: number
          order_id: string
          original_quantity: number
          product_id: string
          product_name: string
        }
        Update: {
          date?: string
          id?: string
          new_quantity?: number
          order_id?: string
          original_quantity?: number
          product_id?: string
          product_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_changes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "completed_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_changes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          batch_number: string | null
          blown_pouches: number | null
          box_number: number | null
          checked: boolean | null
          id: string
          is_unavailable: boolean | null
          manual_weight: number | null
          missing_quantity: number | null
          order_id: string
          original_quantity: number | null
          picked_quantity: number | null
          picked_weight: number | null
          product_id: string
          quantity: number
          unavailable_quantity: number | null
        }
        Insert: {
          batch_number?: string | null
          blown_pouches?: number | null
          box_number?: number | null
          checked?: boolean | null
          id?: string
          is_unavailable?: boolean | null
          manual_weight?: number | null
          missing_quantity?: number | null
          order_id: string
          original_quantity?: number | null
          picked_quantity?: number | null
          picked_weight?: number | null
          product_id: string
          quantity: number
          unavailable_quantity?: number | null
        }
        Update: {
          batch_number?: string | null
          blown_pouches?: number | null
          box_number?: number | null
          checked?: boolean | null
          id?: string
          is_unavailable?: boolean | null
          manual_weight?: number | null
          missing_quantity?: number | null
          order_id?: string
          original_quantity?: number | null
          picked_quantity?: number | null
          picked_weight?: number | null
          product_id?: string
          quantity?: number
          unavailable_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "completed_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          batch_number: string | null
          created: string
          customer_id: string
          customer_order_number: string | null
          delivery_method: string
          from_standing_order: string | null
          has_changes: boolean | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoiced: boolean | null
          is_modified: boolean | null
          is_picked: boolean | null
          notes: string | null
          order_date: string
          order_number: number | null
          picked_at: string | null
          picked_by: string | null
          picker: string | null
          picking_in_progress: boolean | null
          required_date: string | null
          status: string
          total_blown_pouches: number | null
          updated: string | null
        }
        Insert: {
          batch_number?: string | null
          created?: string
          customer_id: string
          customer_order_number?: string | null
          delivery_method: string
          from_standing_order?: string | null
          has_changes?: boolean | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoiced?: boolean | null
          is_modified?: boolean | null
          is_picked?: boolean | null
          notes?: string | null
          order_date: string
          order_number?: number | null
          picked_at?: string | null
          picked_by?: string | null
          picker?: string | null
          picking_in_progress?: boolean | null
          required_date?: string | null
          status: string
          total_blown_pouches?: number | null
          updated?: string | null
        }
        Update: {
          batch_number?: string | null
          created?: string
          customer_id?: string
          customer_order_number?: string | null
          delivery_method?: string
          from_standing_order?: string | null
          has_changes?: boolean | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoiced?: boolean | null
          is_modified?: boolean | null
          is_picked?: boolean | null
          notes?: string | null
          order_date?: string
          order_number?: number | null
          picked_at?: string | null
          picked_by?: string | null
          picker?: string | null
          picking_in_progress?: boolean | null
          required_date?: string | null
          status?: string
          total_blown_pouches?: number | null
          updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pickers: {
        Row: {
          active: boolean | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      picking_progress: {
        Row: {
          created_at: string
          data: Json
          id: string
          order_id: string
          picker: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          order_id: string
          picker: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          order_id?: string
          picker?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "picking_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "completed_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picking_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_dates: {
        Row: {
          id: string
          processed_date: string
          standing_order_id: string
        }
        Insert: {
          id?: string
          processed_date: string
          standing_order_id: string
        }
        Update: {
          id?: string
          processed_date?: string
          standing_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_dates_standing_order_id_fkey"
            columns: ["standing_order_id"]
            isOneToOne: false
            referencedRelation: "standing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created: string
          description: string
          id: string
          name: string
          required: boolean | null
          requires_weight_input: boolean | null
          sku: string
          stock_level: number
          unit: string | null
          weight: number | null
        }
        Insert: {
          created?: string
          description: string
          id?: string
          name: string
          required?: boolean | null
          requires_weight_input?: boolean | null
          sku: string
          stock_level?: number
          unit?: string | null
          weight?: number | null
        }
        Update: {
          created?: string
          description?: string
          id?: string
          name?: string
          required?: boolean | null
          requires_weight_input?: boolean | null
          sku?: string
          stock_level?: number
          unit?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      returns: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created: string
          customer_id: string | null
          customer_name: string
          customer_type: string
          date_returned: string
          id: string
          invoice_number: string | null
          order_number: string | null
          product_id: string
          product_sku: string
          quantity: number | null
          reason: string | null
          resolution_notes: string | null
          resolution_status: string
          return_status: string
          returns_required: string
          updated: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created?: string
          customer_id?: string | null
          customer_name: string
          customer_type: string
          date_returned: string
          id?: string
          invoice_number?: string | null
          order_number?: string | null
          product_id: string
          product_sku: string
          quantity?: number | null
          reason?: string | null
          resolution_notes?: string | null
          resolution_status: string
          return_status: string
          returns_required: string
          updated?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created?: string
          customer_id?: string | null
          customer_name?: string
          customer_type?: string
          date_returned?: string
          id?: string
          invoice_number?: string | null
          order_number?: string | null
          product_id?: string
          product_sku?: string
          quantity?: number | null
          reason?: string | null
          resolution_notes?: string | null
          resolution_status?: string
          return_status?: string
          returns_required?: string
          updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      skipped_dates: {
        Row: {
          id: string
          skipped_date: string
          standing_order_id: string
        }
        Insert: {
          id?: string
          skipped_date: string
          standing_order_id: string
        }
        Update: {
          id?: string
          skipped_date?: string
          standing_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skipped_dates_standing_order_id_fkey"
            columns: ["standing_order_id"]
            isOneToOne: false
            referencedRelation: "standing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      standing_order_items: {
        Row: {
          id: string
          product_id: string
          quantity: number
          standing_order_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          standing_order_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          standing_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "standing_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standing_order_items_standing_order_id_fkey"
            columns: ["standing_order_id"]
            isOneToOne: false
            referencedRelation: "standing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      standing_orders: {
        Row: {
          active: boolean | null
          created: string
          customer_id: string
          customer_order_number: string | null
          day_of_month: number | null
          day_of_week: number | null
          delivery_method: string
          frequency: string
          id: string
          last_processed_date: string | null
          next_delivery_date: string | null
          next_processing_date: string | null
          notes: string | null
          updated: string | null
        }
        Insert: {
          active?: boolean | null
          created?: string
          customer_id: string
          customer_order_number?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          delivery_method: string
          frequency: string
          id?: string
          last_processed_date?: string | null
          next_delivery_date?: string | null
          next_processing_date?: string | null
          notes?: string | null
          updated?: string | null
        }
        Update: {
          active?: boolean | null
          created?: string
          customer_id?: string
          customer_order_number?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          delivery_method?: string
          frequency?: string
          id?: string
          last_processed_date?: string | null
          next_delivery_date?: string | null
          next_processing_date?: string | null
          notes?: string | null
          updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standing_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean | null
          email: string
          id: string
          name: string
          password: string | null
          role: string
        }
        Insert: {
          active?: boolean | null
          email: string
          id?: string
          name: string
          password?: string | null
          role: string
        }
        Update: {
          active?: boolean | null
          email?: string
          id?: string
          name?: string
          password?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      completed_orders: {
        Row: {
          batch_number: string | null
          created: string | null
          customer_id: string | null
          customer_order_number: string | null
          delivery_method: string | null
          from_standing_order: string | null
          has_changes: boolean | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoiced: boolean | null
          is_modified: boolean | null
          is_picked: boolean | null
          notes: string | null
          order_date: string | null
          picked_at: string | null
          picked_by: string | null
          picker: string | null
          picking_in_progress: boolean | null
          required_date: string | null
          status: string | null
          total_blown_pouches: number | null
          updated: string | null
        }
        Insert: {
          batch_number?: string | null
          created?: string | null
          customer_id?: string | null
          customer_order_number?: string | null
          delivery_method?: string | null
          from_standing_order?: string | null
          has_changes?: boolean | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoiced?: boolean | null
          is_modified?: boolean | null
          is_picked?: boolean | null
          notes?: string | null
          order_date?: string | null
          picked_at?: string | null
          picked_by?: string | null
          picker?: string | null
          picking_in_progress?: boolean | null
          required_date?: string | null
          status?: string | null
          total_blown_pouches?: number | null
          updated?: string | null
        }
        Update: {
          batch_number?: string | null
          created?: string | null
          customer_id?: string | null
          customer_order_number?: string | null
          delivery_method?: string | null
          from_standing_order?: string | null
          has_changes?: boolean | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoiced?: boolean | null
          is_modified?: boolean | null
          is_picked?: boolean | null
          notes?: string | null
          order_date?: string | null
          picked_at?: string | null
          picked_by?: string | null
          picker?: string | null
          picking_in_progress?: boolean | null
          required_date?: string | null
          status?: string | null
          total_blown_pouches?: number | null
          updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      trigger_process_standing_orders: {
        Args: Record<PropertyKey, never>
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
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
