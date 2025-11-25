/**
 * Database Type Definitions
 * Generated from Supabase schema (project: xmziovusqlmgygcrgyqt)
 * Feature: 003-correction-ui
 *
 * NOTE: This is a manual type definition based on the schema from 001-email-classification-mvp.
 * To regenerate from Supabase:
 *   npx supabase gen types typescript --project-id xmziovusqlmgygcrgyqt > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      emails: {
        Row: {
          id: number
          message_id: string
          thread_id: string | null
          sender: string | null
          recipient: string | null
          subject: string | null
          body: string | null
          received_timestamp: string | null
          labels: string[] | null
          is_read: boolean | null
          is_archived: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          message_id: string
          thread_id?: string | null
          sender?: string | null
          recipient?: string | null
          subject?: string | null
          body?: string | null
          received_timestamp?: string | null
          labels?: string[] | null
          is_read?: boolean | null
          is_archived?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          message_id?: string
          thread_id?: string | null
          sender?: string | null
          recipient?: string | null
          subject?: string | null
          body?: string | null
          received_timestamp?: string | null
          labels?: string[] | null
          is_read?: boolean | null
          is_archived?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      classifications: {
        Row: {
          id: number
          email_id: number
          category: 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
          urgency: 'HIGH' | 'MEDIUM' | 'LOW'
          action: 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'
          confidence_score: number
          extracted_names: string[] | null
          extracted_dates: string[] | null
          extracted_amounts: string[] | null
          classified_timestamp: string
          // Note: Database stores original values (before correction) in original_* columns
          // The current category/urgency/action columns contain the corrected values
          original_category: string | null
          original_urgency: string | null
          original_action: string | null
          corrected_timestamp: string | null
          corrected_by: string | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          email_id: number
          category: 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
          urgency: 'HIGH' | 'MEDIUM' | 'LOW'
          action: 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'
          confidence_score: number
          extracted_names?: string[] | null
          extracted_dates?: string[] | null
          extracted_amounts?: string[] | null
          classified_timestamp: string
          original_category?: string | null
          original_urgency?: string | null
          original_action?: string | null
          corrected_timestamp?: string | null
          corrected_by?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          email_id?: number
          category?: 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
          urgency?: 'HIGH' | 'MEDIUM' | 'LOW'
          action?: 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'
          confidence_score?: number
          extracted_names?: string[] | null
          extracted_dates?: string[] | null
          extracted_amounts?: string[] | null
          classified_timestamp?: string
          original_category?: string | null
          original_urgency?: string | null
          original_action?: string | null
          corrected_timestamp?: string | null
          corrected_by?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      correction_logs: {
        Row: {
          id: number
          email_id: number
          field_name: 'CATEGORY' | 'URGENCY' | 'ACTION'
          original_value: string
          corrected_value: string
          correction_timestamp: string
          corrected_by: string
          created_at: string
        }
        Insert: {
          id?: number
          email_id: number
          field_name: 'CATEGORY' | 'URGENCY' | 'ACTION'
          original_value: string
          corrected_value: string
          correction_timestamp?: string
          corrected_by: string
          created_at?: string
        }
        Update: {
          id?: number
          email_id?: number
          field_name?: 'CATEGORY' | 'URGENCY' | 'ACTION'
          original_value?: string
          corrected_value?: string
          correction_timestamp?: string
          corrected_by?: string
          created_at?: string
        }
      }
      email_actions: {
        Row: {
          id: number
          email_id: number
          action_type: 'LABEL_APPLIED' | 'MARKED_READ' | 'ARCHIVED' | 'MARKED_UNREAD' | 'UNARCHIVED'
          action_details: Json | null
          action_timestamp: string
          success_status: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: number
          email_id: number
          action_type: 'LABEL_APPLIED' | 'MARKED_READ' | 'ARCHIVED' | 'MARKED_UNREAD' | 'UNARCHIVED'
          action_details?: Json | null
          action_timestamp?: string
          success_status?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          email_id?: number
          action_type?: 'LABEL_APPLIED' | 'MARKED_READ' | 'ARCHIVED' | 'MARKED_UNREAD' | 'UNARCHIVED'
          action_details?: Json | null
          action_timestamp?: string
          success_status?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          email_id: number
          channel: 'TELEGRAM'
          recipient: string
          message_content: string
          sent_timestamp: string | null
          delivery_status: 'PENDING' | 'SENT' | 'FAILED' | 'QUEUED'
          retry_count: number
          error_message: string | null
          scheduled_for: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          email_id: number
          channel: 'TELEGRAM'
          recipient: string
          message_content: string
          sent_timestamp?: string | null
          delivery_status: 'PENDING' | 'SENT' | 'FAILED' | 'QUEUED'
          retry_count?: number
          error_message?: string | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          email_id?: number
          channel?: 'TELEGRAM'
          recipient?: string
          message_content?: string
          sent_timestamp?: string | null
          delivery_status?: 'PENDING' | 'SENT' | 'FAILED' | 'QUEUED'
          retry_count?: number
          error_message?: string | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
