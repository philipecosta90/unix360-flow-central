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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          empresa_id: string | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cliente_documentos: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          empresa_id: string
          id: string
          nome: string
          tamanho: number | null
          tipo_arquivo: string | null
          updated_at: string
          url_arquivo: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          empresa_id: string
          id?: string
          nome: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          updated_at?: string
          url_arquivo?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          updated_at?: string
          url_arquivo?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim_plano: string | null
          data_inicio_plano: string | null
          email: string | null
          empresa_id: string
          id: string
          nome: string
          observacoes: string | null
          plano_contratado: string | null
          status: Database["public"]["Enums"]["status_cliente"]
          tags: string[] | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim_plano?: string | null
          data_inicio_plano?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          nome: string
          observacoes?: string | null
          plano_contratado?: string | null
          status?: Database["public"]["Enums"]["status_cliente"]
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim_plano?: string | null
          data_inicio_plano?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          plano_contratado?: string | null
          status?: Database["public"]["Enums"]["status_cliente"]
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cliente_nome: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          empresa_id: string
          id: string
          observacoes: string | null
          status: string
          tipo: string | null
          titulo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente_nome?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          empresa_id: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo?: string | null
          titulo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente_nome?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          empresa_id?: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo?: string | null
          titulo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      crm_atividades: {
        Row: {
          created_at: string
          created_by: string | null
          data_atividade: string
          descricao: string | null
          id: string
          prospect_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_atividade?: string
          descricao?: string | null
          id?: string
          prospect_id: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_atividade?: string
          descricao?: string | null
          id?: string
          prospect_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_atividades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_atividades_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospects: {
        Row: {
          cargo: string | null
          created_at: string
          created_by: string | null
          email: string | null
          empresa_cliente: string | null
          empresa_id: string
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          proximo_followup: string | null
          responsavel_id: string | null
          stage: string
          tags: string[] | null
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa_cliente?: string | null
          empresa_id: string
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          proximo_followup?: string | null
          responsavel_id?: string | null
          stage?: string
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa_cliente?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          proximo_followup?: string | null
          responsavel_id?: string | null
          stage?: string
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string
          empresa_id: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          ordem: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_interacoes: {
        Row: {
          cliente_id: string
          created_at: string
          data_interacao: string
          descricao: string | null
          empresa_id: string
          id: string
          responsavel_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_interacao?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          responsavel_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_interacao?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          responsavel_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_interacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_interacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_nps: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string
          data_resposta: string
          empresa_id: string
          id: string
          nota: number
          responsavel_id: string | null
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string
          data_resposta?: string
          empresa_id: string
          id?: string
          nota: number
          responsavel_id?: string | null
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string
          data_resposta?: string
          empresa_id?: string
          id?: string
          nota?: number
          responsavel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_nps_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_nps_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_onboarding: {
        Row: {
          cliente_id: string
          concluido: boolean
          created_at: string
          data_conclusao: string | null
          descricao: string | null
          empresa_id: string
          id: string
          ordem: number
          responsavel_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          ordem?: number
          responsavel_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          ordem?: number
          responsavel_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_onboarding_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_onboarding_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativa: boolean
          cnpj: string | null
          configuracoes_nicho: Json | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          plano: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cnpj?: string | null
          configuracoes_nicho?: Json | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          plano?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cnpj?: string | null
          configuracoes_nicho?: Json | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          plano?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          data_envio: string
          email: string | null
          id: string
          mensagem: string
          nome: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_envio?: string
          email?: string | null
          id?: string
          mensagem: string
          nome?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_envio?: string
          email?: string | null
          id?: string
          mensagem?: string
          nome?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      financeiro_lancamentos: {
        Row: {
          a_receber: boolean | null
          categoria: string
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          empresa_id: string
          id: string
          recorrente: boolean | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          a_receber?: boolean | null
          categoria: string
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          empresa_id: string
          id?: string
          recorrente?: boolean | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          a_receber?: boolean | null
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          empresa_id?: string
          id?: string
          recorrente?: boolean | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lancamentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_tarefas: {
        Row: {
          cliente_id: string | null
          concluida: boolean | null
          created_at: string | null
          created_by: string | null
          descricao: string
          empresa_id: string
          id: string
          updated_at: string | null
          vencimento: string
        }
        Insert: {
          cliente_id?: string | null
          concluida?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          empresa_id: string
          id?: string
          updated_at?: string | null
          vencimento: string
        }
        Update: {
          cliente_id?: string | null
          concluida?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          empresa_id?: string
          id?: string
          updated_at?: string | null
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_tarefas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_tarefas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          empresa_id: string
          id: string
          nivel_permissao: Database["public"]["Enums"]["nivel_permissao"]
          nome: string
          sobrenome: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nivel_permissao?: Database["public"]["Enums"]["nivel_permissao"]
          nome: string
          sobrenome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nivel_permissao?: Database["public"]["Enums"]["nivel_permissao"]
          nome?: string
          sobrenome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_fechadas: {
        Row: {
          created_at: string
          created_by: string | null
          data_fechamento: string
          empresa_id: string
          id: string
          observacoes: string | null
          prospect_id: string
          responsavel_id: string | null
          updated_at: string
          valor_fechado: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fechamento?: string
          empresa_id: string
          id?: string
          observacoes?: string | null
          prospect_id: string
          responsavel_id?: string | null
          updated_at?: string
          valor_fechado?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fechamento?: string
          empresa_id?: string
          id?: string
          observacoes?: string | null
          prospect_id?: string
          responsavel_id?: string | null
          updated_at?: string
          valor_fechado?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_user_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_empresa_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          ativa: boolean
          created_at: string
          email: string
          id: string
          nome: string
          plano: string
          total_usuarios: number
          usuarios_ativos: number
        }[]
      }
      get_security_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          message: string
          status: boolean
        }[]
      }
      get_user_by_email: {
        Args: { user_email: string }
        Returns: string
      }
      get_user_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_active_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_company_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_sensitive_access: {
        Args: { p_action: string; p_record_id?: string; p_table_name: string }
        Returns: undefined
      }
      validate_permission_levels: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_user_empresa_integrity: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      nivel_permissao: "admin" | "operacional" | "visualizacao"
      status_cliente: "ativo" | "inativo" | "lead" | "prospecto"
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
      nivel_permissao: ["admin", "operacional", "visualizacao"],
      status_cliente: ["ativo", "inativo", "lead", "prospecto"],
    },
  },
} as const
