// Hand-authored types for NFX Hub schema (migrations 001 + 002)
// Regenerate with: supabase gen types typescript --project-id <id>

export type AccountStatus = 'active' | 'passed' | 'blown' | 'paused'
export type AccountPhase  = 'P1' | 'P2' | 'Funded'
export type AccountGroup  = 'A' | 'B' | 'C' | 'D' | 'E'
export type TradeType     = 'Swing' | 'Intraswing' | 'Intraday' | 'Manipulation'
export type TradeResult   = 'win' | 'loss' | 'breakeven' | 'pending'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  firm_name: string
  account_name: string
  starting_balance: number
  current_balance: number | null
  profit_target_pct: number
  max_drawdown_pct: number
  daily_loss_limit_pct: number | null
  status: AccountStatus
  phase: AccountPhase | null
  grp: AccountGroup | null
  start_date: string | null
  created_at: string
  updated_at: string
}

export interface Confluence {
  id: string
  user_id: string
  name: string
  color: string
  category: string | null
}

export interface Symbol {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Trade {
  id: string
  user_id: string
  account_id: string | null           // kept for legacy; use trade_accounts junction
  parent_trade_id: string | null      // scale-in parent
  open_date: string
  close_date: string | null
  symbol: string
  direction: 'long' | 'short' | null
  trade_type: TradeType | null
  scale_in_enabled: boolean
  model: string | null
  entry_type: 'market' | 'limit' | null
  entry_price: number | null
  stop_loss: number | null
  take_profit: number | null
  risk_reward: number | null
  result: TradeResult | null
  pnl: number | null
  summary: string | null
  dxy_chart_url: string | null
  entry_chart_url: string | null
  new_daily_outlook_id: string | null
  new_weekly_outlook_id: string | null
  created_at: string
  updated_at: string
  // Joined relations (not in DB row directly)
  trade_accounts?: { account_id: string; accounts?: Account }[]
  trade_confluences?: { confluence_id: string; confluences?: Confluence }[]
  trade_groups?: { grp: AccountGroup }[]
}

export interface WeeklyOutlook {
  id: string
  user_id: string
  week_start: string
  trading_plan: string | null
  notes: string | null
  chart_url: string | null
  news_urls: string[] | null
  created_at: string
  updated_at: string
}

export interface DailyOutlook {
  id: string
  user_id: string
  outlook_date: string
  trading_plan: string | null
  chart_url: string | null
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────
// Supabase client generic shape
// Row/Insert/Update use flat inline objects (no Omit/Partial over interfaces)
// so they satisfy Record<string, unknown> and pass GenericSchema constraints.
// ──────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; user_id: string; email: string; full_name: string | null
          avatar_url: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; email: string; full_name?: string | null
          avatar_url?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          email?: string; full_name?: string | null; avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string; user_id: string; firm_name: string; account_name: string
          starting_balance: number; current_balance: number | null
          profit_target_pct: number; max_drawdown_pct: number
          daily_loss_limit_pct: number | null; status: AccountStatus
          phase: AccountPhase | null; grp: AccountGroup | null
          start_date: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; firm_name: string; account_name: string
          starting_balance: number; current_balance?: number | null
          profit_target_pct: number; max_drawdown_pct: number
          daily_loss_limit_pct?: number | null; status?: AccountStatus
          phase?: AccountPhase | null; grp?: AccountGroup | null
          start_date?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          firm_name?: string; account_name?: string
          starting_balance?: number; current_balance?: number | null
          profit_target_pct?: number; max_drawdown_pct?: number
          daily_loss_limit_pct?: number | null; status?: AccountStatus
          phase?: AccountPhase | null; grp?: AccountGroup | null
          start_date?: string | null; updated_at?: string
        }
        Relationships: []
      }
      confluences: {
        Row: {
          id: string; user_id: string; name: string; color: string
          category: string | null
        }
        Insert: {
          id?: string; user_id: string; name: string; color?: string
          category?: string | null
        }
        Update: {
          name?: string; color?: string; category?: string | null
        }
        Relationships: []
      }
      symbols: {
        Row:    { id: string; user_id: string; name: string; created_at: string }
        Insert: { id?: string; user_id: string; name: string; created_at?: string }
        Update: { name?: string }
        Relationships: []
      }
      trades: {
        Row: {
          id: string; user_id: string; account_id: string | null
          parent_trade_id: string | null; open_date: string
          close_date: string | null; symbol: string
          direction: 'long' | 'short' | null; trade_type: TradeType | null
          scale_in_enabled: boolean; model: string | null
          entry_type: 'market' | 'limit' | null; entry_price: number | null
          stop_loss: number | null; take_profit: number | null
          risk_reward: number | null; result: TradeResult | null
          pnl: number | null; summary: string | null
          dxy_chart_url: string | null; entry_chart_url: string | null
          new_daily_outlook_id: string | null; new_weekly_outlook_id: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; account_id?: string | null
          parent_trade_id?: string | null; open_date: string
          close_date?: string | null; symbol: string
          direction?: 'long' | 'short' | null; trade_type?: TradeType | null
          scale_in_enabled?: boolean; model?: string | null
          entry_type?: 'market' | 'limit' | null; entry_price?: number | null
          stop_loss?: number | null; take_profit?: number | null
          risk_reward?: number | null; result?: TradeResult | null
          pnl?: number | null; summary?: string | null
          dxy_chart_url?: string | null; entry_chart_url?: string | null
          new_daily_outlook_id?: string | null; new_weekly_outlook_id?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          account_id?: string | null; parent_trade_id?: string | null
          open_date?: string; close_date?: string | null; symbol?: string
          direction?: 'long' | 'short' | null; trade_type?: TradeType | null
          scale_in_enabled?: boolean; model?: string | null
          entry_type?: 'market' | 'limit' | null; entry_price?: number | null
          stop_loss?: number | null; take_profit?: number | null
          risk_reward?: number | null; result?: TradeResult | null
          pnl?: number | null; summary?: string | null
          dxy_chart_url?: string | null; entry_chart_url?: string | null
          new_daily_outlook_id?: string | null; new_weekly_outlook_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      weekly_outlooks: {
        Row: {
          id: string; user_id: string; week_start: string
          trading_plan: string | null; notes: string | null
          chart_url: string | null; news_urls: string[] | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; week_start: string
          trading_plan?: string | null; notes?: string | null
          chart_url?: string | null; news_urls?: string[] | null
          created_at?: string; updated_at?: string
        }
        Update: {
          week_start?: string; trading_plan?: string | null; notes?: string | null
          chart_url?: string | null; news_urls?: string[] | null; updated_at?: string
        }
        Relationships: []
      }
      daily_outlooks: {
        Row: {
          id: string; user_id: string; outlook_date: string
          trading_plan: string | null; chart_url: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; outlook_date: string
          trading_plan?: string | null; chart_url?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          outlook_date?: string; trading_plan?: string | null
          chart_url?: string | null; updated_at?: string
        }
        Relationships: []
      }
      trade_accounts: {
        Row: { trade_id: string; account_id: string }
        Insert: { trade_id: string; account_id: string }
        Update: { trade_id?: string; account_id?: string }
        Relationships: [
          { foreignKeyName: "trade_accounts_trade_id_fkey"; columns: ["trade_id"]; isOneToOne: false; referencedRelation: "trades"; referencedColumns: ["id"] },
          { foreignKeyName: "trade_accounts_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      trade_confluences: {
        Row: { trade_id: string; confluence_id: string }
        Insert: { trade_id: string; confluence_id: string }
        Update: { trade_id?: string; confluence_id?: string }
        Relationships: [
          { foreignKeyName: "trade_confluences_trade_id_fkey"; columns: ["trade_id"]; isOneToOne: false; referencedRelation: "trades"; referencedColumns: ["id"] },
          { foreignKeyName: "trade_confluences_confluence_id_fkey"; columns: ["confluence_id"]; isOneToOne: false; referencedRelation: "confluences"; referencedColumns: ["id"] }
        ]
      }
      trade_groups: {
        Row: { trade_id: string; grp: AccountGroup }
        Insert: { trade_id: string; grp: AccountGroup }
        Update: { trade_id?: string; grp?: AccountGroup }
        Relationships: [
          { foreignKeyName: "trade_groups_trade_id_fkey"; columns: ["trade_id"]; isOneToOne: false; referencedRelation: "trades"; referencedColumns: ["id"] }
        ]
      }
    }
    Views: { [K in never]: never }
    Functions: { [K in never]: never }
    Enums: { [K in never]: never }
    CompositeTypes: { [K in never]: never }
  }
}
