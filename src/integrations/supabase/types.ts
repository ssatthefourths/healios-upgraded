export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          postal_code: string
          state: string | null
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          postal_code: string
          state?: string | null
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          postal_code?: string
          state?: string | null
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          reading_time_minutes: number | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_recovery: {
        Row: {
          cart_items: Json
          created_at: string | null
          customer_details: Json | null
          email: string
          expires_at: string
          id: string
          shipping_address: Json | null
          token: string
          used_at: string | null
        }
        Insert: {
          cart_items: Json
          created_at?: string | null
          customer_details?: Json | null
          email: string
          expires_at: string
          id?: string
          shipping_address?: Json | null
          token: string
          used_at?: string | null
        }
        Update: {
          cart_items?: Json
          created_at?: string | null
          customer_details?: Json | null
          email?: string
          expires_at?: string
          id?: string
          shipping_address?: Json | null
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      checkout_security_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      email_campaign_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          recipient_email: string
          segment: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          segment?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          recipients_count: number
          sent_at: string
          status: string
          subject: string
          target_segments: string[] | null
          targeting_mode: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipients_count?: number
          sent_at?: string
          status?: string
          subject: string
          target_segments?: string[] | null
          targeting_mode?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipients_count?: number
          sent_at?: string
          status?: string
          subject?: string
          target_segments?: string[] | null
          targeting_mode?: string
        }
        Relationships: []
      }
      gift_card_rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      gift_card_transactions: {
        Row: {
          amount: number
          created_at: string
          gift_card_id: string
          id: string
          order_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          gift_card_id: string
          id?: string
          order_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          gift_card_id?: string
          id?: string
          order_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          first_redeemed_at: string | null
          id: string
          is_active: boolean
          original_amount: number
          personal_message: string | null
          purchased_at: string
          purchaser_email: string
          purchaser_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_by: string | null
          remaining_balance: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          first_redeemed_at?: string | null
          id?: string
          is_active?: boolean
          original_amount: number
          personal_message?: string | null
          purchased_at?: string
          purchaser_email: string
          purchaser_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_by?: string | null
          remaining_balance: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          first_redeemed_at?: string | null
          id?: string
          is_active?: boolean
          original_amount?: number
          personal_message?: string | null
          purchased_at?: string
          purchaser_email?: string
          purchaser_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_by?: string | null
          remaining_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          lifetime_points_earned: number
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_points_earned?: number
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_points_earned?: number
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          is_subscription: boolean | null
          line_total: number
          order_id: string
          product_category: string | null
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_subscription?: boolean | null
          line_total: number
          order_id: string
          product_category?: string | null
          product_id: string
          product_image?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          is_subscription?: boolean | null
          line_total?: number
          order_id?: string
          product_category?: string | null
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          created_at: string
          discount_amount: number
          discount_code: string | null
          email: string
          first_name: string
          id: string
          invoice_url: string | null
          last_name: string
          phone: string | null
          review_email_sent_at: string | null
          shipping_address: string
          shipping_city: string
          shipping_cost: number
          shipping_country: string
          shipping_method: string | null
          shipping_postal_code: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          subtotal: number
          token_expires_at: string | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          email: string
          first_name: string
          id?: string
          invoice_url?: string | null
          last_name: string
          phone?: string | null
          review_email_sent_at?: string | null
          shipping_address: string
          shipping_city: string
          shipping_cost?: number
          shipping_country?: string
          shipping_method?: string | null
          shipping_postal_code: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal: number
          token_expires_at?: string | null
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          email?: string
          first_name?: string
          id?: string
          invoice_url?: string | null
          last_name?: string
          phone?: string | null
          review_email_sent_at?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_cost?: number
          shipping_country?: string
          shipping_method?: string | null
          shipping_postal_code?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal?: number
          token_expires_at?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          image_urls: string[] | null
          product_id: string
          rating: number
          review_text: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_urls?: string[] | null
          product_id: string
          rating: number
          review_text: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_urls?: string[] | null
          product_id?: string
          rating?: number
          review_text?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "best_seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_versions: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          changes: Json
          created_at: string
          id: string
          previous_values: Json
          product_id: string
        }
        Insert: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changes?: Json
          created_at?: string
          id?: string
          previous_values?: Json
          product_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changes?: Json
          created_at?: string
          id?: string
          previous_values?: Json
          product_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          benefits: Json | null
          bundle_discount_percent: number | null
          bundle_products: string[] | null
          category: string
          contains_allergens: string[] | null
          created_at: string
          description: string | null
          faqs: Json | null
          hero_paragraph: string | null
          how_it_works: string | null
          how_to_take: string | null
          id: string
          image: string
          ingredients: Json | null
          is_adults_only: boolean | null
          is_bundle: boolean | null
          is_coming_soon: boolean
          is_gluten_free: boolean | null
          is_keto_friendly: boolean | null
          is_kids_product: boolean | null
          is_published: boolean | null
          is_sugar_free: boolean | null
          is_vegan: boolean | null
          low_stock_threshold: number
          meta_description: string | null
          name: string
          pairs_well_with: string[] | null
          price: number
          primary_keyword: string | null
          product_cautions: string | null
          routine_30_day: string | null
          safety_info: string | null
          secondary_keywords: string[] | null
          seo_title: string | null
          slug: string | null
          sort_order: number | null
          stock_quantity: number
          subscription_info: string | null
          track_inventory: boolean
          updated_at: string
          what_is_it: string | null
          what_makes_different: string | null
          who_is_it_for: string | null
          why_gummy: string | null
        }
        Insert: {
          benefits?: Json | null
          bundle_discount_percent?: number | null
          bundle_products?: string[] | null
          category: string
          contains_allergens?: string[] | null
          created_at?: string
          description?: string | null
          faqs?: Json | null
          hero_paragraph?: string | null
          how_it_works?: string | null
          how_to_take?: string | null
          id: string
          image: string
          ingredients?: Json | null
          is_adults_only?: boolean | null
          is_bundle?: boolean | null
          is_coming_soon?: boolean
          is_gluten_free?: boolean | null
          is_keto_friendly?: boolean | null
          is_kids_product?: boolean | null
          is_published?: boolean | null
          is_sugar_free?: boolean | null
          is_vegan?: boolean | null
          low_stock_threshold?: number
          meta_description?: string | null
          name: string
          pairs_well_with?: string[] | null
          price: number
          primary_keyword?: string | null
          product_cautions?: string | null
          routine_30_day?: string | null
          safety_info?: string | null
          secondary_keywords?: string[] | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number | null
          stock_quantity?: number
          subscription_info?: string | null
          track_inventory?: boolean
          updated_at?: string
          what_is_it?: string | null
          what_makes_different?: string | null
          who_is_it_for?: string | null
          why_gummy?: string | null
        }
        Update: {
          benefits?: Json | null
          bundle_discount_percent?: number | null
          bundle_products?: string[] | null
          category?: string
          contains_allergens?: string[] | null
          created_at?: string
          description?: string | null
          faqs?: Json | null
          hero_paragraph?: string | null
          how_it_works?: string | null
          how_to_take?: string | null
          id?: string
          image?: string
          ingredients?: Json | null
          is_adults_only?: boolean | null
          is_bundle?: boolean | null
          is_coming_soon?: boolean
          is_gluten_free?: boolean | null
          is_keto_friendly?: boolean | null
          is_kids_product?: boolean | null
          is_published?: boolean | null
          is_sugar_free?: boolean | null
          is_vegan?: boolean | null
          low_stock_threshold?: number
          meta_description?: string | null
          name?: string
          pairs_well_with?: string[] | null
          price?: number
          primary_keyword?: string | null
          product_cautions?: string | null
          routine_30_day?: string | null
          safety_info?: string | null
          secondary_keywords?: string[] | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number | null
          stock_quantity?: number
          subscription_info?: string | null
          track_inventory?: boolean
          updated_at?: string
          what_is_it?: string | null
          what_makes_different?: string | null
          who_is_it_for?: string | null
          why_gummy?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_blocklist: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          identifier: string
          reason: string | null
          region: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          identifier: string
          reason?: string | null
          region?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          identifier?: string
          reason?: string | null
          region?: string | null
        }
        Relationships: []
      }
      referral_rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          order_id: string | null
          referral_code: string
          referred_email: string | null
          referred_reward_points: number | null
          referred_rewarded_at: string | null
          referred_user_id: string | null
          referrer_id: string
          referrer_reward_points: number | null
          referrer_rewarded_at: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referral_code: string
          referred_email?: string | null
          referred_reward_points?: number | null
          referred_rewarded_at?: string | null
          referred_user_id?: string | null
          referrer_id: string
          referrer_reward_points?: number | null
          referrer_rewarded_at?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_reward_points?: number | null
          referred_rewarded_at?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          referrer_reward_points?: number | null
          referrer_rewarded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      scheduled_newsletters: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          recipients_count: number | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          recipients_count?: number | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          recipients_count?: number | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "best_seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          frequency: string
          id: string
          next_delivery_date: string
          paused_at: string | null
          price: number
          product_id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          frequency?: string
          id?: string
          next_delivery_date: string
          paused_at?: string | null
          price: number
          product_id: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          frequency?: string
          id?: string
          next_delivery_date?: string
          paused_at?: string | null
          price?: number
          product_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "best_seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wellness_posts: {
        Row: {
          created_at: string
          display_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          social_link: string
          status: Database["public"]["Enums"]["post_status"]
          submitted_at: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link: string
          status?: Database["public"]["Enums"]["post_status"]
          submitted_at?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string
          status?: Database["public"]["Enums"]["post_status"]
          submitted_at?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "best_seller_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      best_seller_products: {
        Row: {
          add_to_cart_count: number | null
          avg_rating: number | null
          best_seller_score: number | null
          category: string | null
          id: string | null
          image: string | null
          is_adults_only: boolean | null
          is_kids_product: boolean | null
          is_published: boolean | null
          name: string | null
          price: number | null
          purchase_count: number | null
          review_count: number | null
          slug: string | null
          stock_quantity: number | null
          view_count: number | null
        }
        Relationships: []
      }
      low_stock_products: {
        Row: {
          category: string | null
          id: string | null
          image: string | null
          low_stock_threshold: number | null
          name: string | null
          stock_quantity: number | null
        }
        Insert: {
          category?: string | null
          id?: string | null
          image?: string | null
          low_stock_threshold?: number | null
          name?: string | null
          stock_quantity?: number | null
        }
        Update: {
          category?: string | null
          id?: string | null
          image?: string | null
          low_stock_threshold?: number | null
          name?: string | null
          stock_quantity?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_loyalty_points: {
        Args: {
          p_description?: string
          p_order_id?: string
          p_points: number
          p_user_id: string
        }
        Returns: boolean
      }
      apply_referral_code: {
        Args: {
          p_code: string
          p_referred_email: string
          p_referred_user_id?: string
        }
        Returns: {
          message: string
          referrer_name: string
          valid: boolean
        }[]
      }
      check_analytics_rate_limit: {
        Args: {
          p_event_type: string
          p_product_id: string
          p_session_id: string
        }
        Returns: boolean
      }
      check_checkout_ip_security: {
        Args: { p_ip_address: string }
        Returns: {
          attempts_last_hour: number
          failures_last_hour: number
          is_rate_limited: boolean
          is_suspicious: boolean
          reason: string
        }[]
      }
      check_gift_card_lookup_rate_limit: {
        Args: { p_code: string; p_identifier: string }
        Returns: boolean
      }
      check_gift_card_rate_limit: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      check_newsletter_rate_limit: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_referral_rate_limit: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      complete_referral: {
        Args: { p_order_id: string; p_referred_user_id: string }
        Returns: boolean
      }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_referral_code: { Args: { user_id: string }; Returns: string }
      generate_secure_order_token: { Args: never; Returns: string }
      get_best_seller_products: {
        Args: never
        Returns: {
          best_seller_score: number
          category: string
          id: string
          image: string
          is_adults_only: boolean
          is_kids_product: boolean
          is_published: boolean
          name: string
          price: number
          stock_quantity: number
        }[]
      }
      get_checkout_security_stats: {
        Args: { p_hours?: number }
        Returns: {
          top_suspicious_ips: Json
          total_attempts: number
          total_failures: number
          total_rate_limited: number
          total_suspicious: number
          unique_ips: number
        }[]
      }
      get_low_stock_products: {
        Args: never
        Returns: {
          category: string
          id: string
          image: string
          low_stock_threshold: number
          name: string
          stock_quantity: number
        }[]
      }
      get_or_create_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_personalized_recommendations: {
        Args: {
          p_current_product_id?: string
          p_limit?: number
          p_session_id?: string
          p_user_id?: string
        }
        Returns: {
          category: string
          id: string
          image: string
          name: string
          price: number
          recommendation_reason: string
          recommendation_score: number
          slug: string
          stock_quantity: number
        }[]
      }
      get_referral_security_stats: {
        Args: { p_hours?: number }
        Returns: {
          blocked_identifiers: number
          converted_referrals: number
          high_attempt_entries: number
          pending_referrals: number
          top_rate_limited: Json
          total_entries: number
          unique_identifiers: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_discount_usage: {
        Args: { discount_code: string }
        Returns: undefined
      }
      increment_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      log_checkout_security_event: {
        Args: {
          p_event_type: string
          p_ip_address: string
          p_metadata?: Json
          p_session_id?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      mask_email: { Args: { p_email: string }; Returns: string }
      redeem_gift_card: {
        Args: {
          p_amount: number
          p_code: string
          p_order_id?: string
          p_user_id?: string
        }
        Returns: {
          amount_applied: number
          message: string
          new_balance: number
          success: boolean
        }[]
      }
      redeem_loyalty_points: {
        Args: {
          p_description?: string
          p_order_id?: string
          p_points: number
          p_user_id: string
        }
        Returns: boolean
      }
      rotate_guest_order_token: {
        Args: {
          p_current_token: string
          p_extend_hours?: number
          p_order_id: string
        }
        Returns: {
          expires_at: string
          new_token: string
          success: boolean
        }[]
      }
      validate_gift_card: {
        Args: { p_code: string }
        Returns: {
          balance: number
          expires_at: string
          message: string
          valid: boolean
        }[]
      }
      validate_guest_order_token: {
        Args: { p_order_id: string; p_token: string }
        Returns: {
          expires_in_hours: number
          order_status: Database["public"]["Enums"]["order_status"]
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      blog_post_status: "draft" | "published" | "archived"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      post_status: "pending" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      blog_post_status: ["draft", "published", "archived"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      post_status: ["pending", "approved", "rejected"],
    },
  },
} as const
