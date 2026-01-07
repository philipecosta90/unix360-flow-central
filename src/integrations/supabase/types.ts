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
      anamnese_envios: {
        Row: {
          cliente_id: string
          created_at: string | null
          empresa_id: string
          enviado_em: string | null
          expira_em: string
          id: string
          preenchido_em: string | null
          status: string
          template_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          empresa_id: string
          enviado_em?: string | null
          expira_em: string
          id?: string
          preenchido_em?: string | null
          status?: string
          template_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          empresa_id?: string
          enviado_em?: string | null
          expira_em?: string
          id?: string
          preenchido_em?: string | null
          status?: string
          template_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_envios_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnese_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_perguntas: {
        Row: {
          created_at: string | null
          id: string
          obrigatoria: boolean | null
          opcoes: Json | null
          ordem: number
          pergunta: string
          placeholder: string | null
          secao: string
          secao_icone: string | null
          template_id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          obrigatoria?: boolean | null
          opcoes?: Json | null
          ordem: number
          pergunta: string
          placeholder?: string | null
          secao: string
          secao_icone?: string | null
          template_id: string
          tipo?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          obrigatoria?: boolean | null
          opcoes?: Json | null
          ordem?: number
          pergunta?: string
          placeholder?: string | null
          secao?: string
          secao_icone?: string | null
          template_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_perguntas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnese_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_respostas: {
        Row: {
          created_at: string | null
          envio_id: string
          id: string
          pergunta_id: string
          resposta: string | null
        }
        Insert: {
          created_at?: string | null
          envio_id: string
          id?: string
          pergunta_id: string
          resposta?: string | null
        }
        Update: {
          created_at?: string | null
          envio_id?: string
          id?: string
          pergunta_id?: string
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_respostas_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: false
            referencedRelation: "anamnese_envios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_respostas_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "anamnese_perguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assinaturas_cakto: {
        Row: {
          created_at: string
          data_de_ativacao: string | null
          data_de_expiracao: string | null
          email: string
          id: string
          id_assinatura: string
          nome: string
          perfil_id: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          data_de_ativacao?: string | null
          data_de_expiracao?: string | null
          email: string
          id?: string
          id_assinatura: string
          nome: string
          perfil_id?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          data_de_ativacao?: string | null
          data_de_expiracao?: string | null
          email?: string
          id?: string
          id_assinatura?: string
          nome?: string
          perfil_id?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_cakto_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          empresa_id: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      checkin_agendamentos: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          empresa_id: string
          frequencia: string
          hora_envio: string | null
          id: string
          intervalo_dias: number | null
          proximo_envio: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          empresa_id: string
          frequencia?: string
          hora_envio?: string | null
          id?: string
          intervalo_dias?: number | null
          proximo_envio: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          empresa_id?: string
          frequencia?: string
          hora_envio?: string | null
          id?: string
          intervalo_dias?: number | null
          proximo_envio?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_agendamentos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checkin_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_envios: {
        Row: {
          agendamento_id: string | null
          anotacoes_profissional: string | null
          cliente_id: string
          created_at: string | null
          empresa_id: string
          enviado_em: string | null
          expira_em: string
          id: string
          pontuacao_maxima: number | null
          pontuacao_total: number | null
          respondido_em: string | null
          revisado: boolean | null
          status: string
          template_id: string
          token: string
        }
        Insert: {
          agendamento_id?: string | null
          anotacoes_profissional?: string | null
          cliente_id: string
          created_at?: string | null
          empresa_id: string
          enviado_em?: string | null
          expira_em: string
          id?: string
          pontuacao_maxima?: number | null
          pontuacao_total?: number | null
          respondido_em?: string | null
          revisado?: boolean | null
          status?: string
          template_id: string
          token: string
        }
        Update: {
          agendamento_id?: string | null
          anotacoes_profissional?: string | null
          cliente_id?: string
          created_at?: string | null
          empresa_id?: string
          enviado_em?: string | null
          expira_em?: string
          id?: string
          pontuacao_maxima?: number | null
          pontuacao_total?: number | null
          respondido_em?: string | null
          revisado?: boolean | null
          status?: string
          template_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_envios_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "checkin_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_envios_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checkin_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_perguntas: {
        Row: {
          created_at: string | null
          id: string
          obrigatoria: boolean | null
          opcoes_pontuacao: Json | null
          ordem: number
          pergunta: string
          placeholder: string | null
          pontos_maximo: number | null
          secao: string
          secao_icone: string | null
          template_id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          obrigatoria?: boolean | null
          opcoes_pontuacao?: Json | null
          ordem: number
          pergunta: string
          placeholder?: string | null
          pontos_maximo?: number | null
          secao: string
          secao_icone?: string | null
          template_id: string
          tipo?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          obrigatoria?: boolean | null
          opcoes_pontuacao?: Json | null
          ordem?: number
          pergunta?: string
          placeholder?: string | null
          pontos_maximo?: number | null
          secao?: string
          secao_icone?: string | null
          template_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_perguntas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checkin_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_respostas: {
        Row: {
          created_at: string | null
          envio_id: string
          id: string
          indicador_visual: string | null
          pergunta_id: string
          pontuacao: number | null
          resposta: string | null
          resposta_arquivo: string | null
        }
        Insert: {
          created_at?: string | null
          envio_id: string
          id?: string
          indicador_visual?: string | null
          pergunta_id: string
          pontuacao?: number | null
          resposta?: string | null
          resposta_arquivo?: string | null
        }
        Update: {
          created_at?: string | null
          envio_id?: string
          id?: string
          indicador_visual?: string | null
          pergunta_id?: string
          pontuacao?: number | null
          resposta?: string | null
          resposta_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_respostas_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: false
            referencedRelation: "checkin_envios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_respostas_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "checkin_perguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string | null
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
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          data_fim_plano: string | null
          data_inicio_plano: string | null
          data_nascimento: string | null
          email: string | null
          empresa_id: string
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          plano_contratado: string | null
          status: Database["public"]["Enums"]["status_cliente"]
          tags: string[] | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          data_fim_plano?: string | null
          data_inicio_plano?: string | null
          data_nascimento?: string | null
          email?: string | null
          empresa_id: string
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          plano_contratado?: string | null
          status?: Database["public"]["Enums"]["status_cliente"]
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          data_fim_plano?: string | null
          data_inicio_plano?: string | null
          data_nascimento?: string | null
          email?: string | null
          empresa_id?: string
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
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
      contratos_documentos: {
        Row: {
          contrato_id: string
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
          contrato_id: string
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
          contrato_id?: string
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
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          nome_exibicao: string | null
          plano: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cnpj?: string | null
          configuracoes_nicho?: Json | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          nome_exibicao?: string | null
          plano?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cnpj?: string | null
          configuracoes_nicho?: Json | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          nome_exibicao?: string | null
          plano?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evolucao_fotos: {
        Row: {
          categoria: string
          cliente_id: string
          created_at: string | null
          data_foto: string
          empresa_id: string
          id: string
          observacoes: string | null
          url_arquivo: string
        }
        Insert: {
          categoria?: string
          cliente_id: string
          created_at?: string | null
          data_foto?: string
          empresa_id: string
          id?: string
          observacoes?: string | null
          url_arquivo: string
        }
        Update: {
          categoria?: string
          cliente_id?: string
          created_at?: string | null
          data_foto?: string
          empresa_id?: string
          id?: string
          observacoes?: string | null
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolucao_fotos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
          cliente_id: string | null
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          empresa_id: string
          id: string
          recorrente: boolean | null
          servico_id: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          a_receber?: boolean | null
          categoria: string
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          empresa_id: string
          id?: string
          recorrente?: boolean | null
          servico_id?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          a_receber?: boolean | null
          categoria?: string
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          empresa_id?: string
          id?: string
          recorrente?: boolean | null
          servico_id?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "financeiro_lancamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
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
            referencedRelation: "clientes"
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
      historico_renovacoes: {
        Row: {
          cliente_id: string
          created_at: string
          data_fim_plano: string
          data_inicio_plano: string
          empresa_id: string
          id: string
          periodo_dias: number
          periodo_label: string
          renovado_por: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim_plano: string
          data_inicio_plano: string
          empresa_id: string
          id?: string
          periodo_dias: number
          periodo_label: string
          renovado_por?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim_plano?: string
          data_inicio_plano?: string
          empresa_id?: string
          id?: string
          periodo_dias?: number
          periodo_label?: string
          renovado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_renovacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_renovacoes_renovado_por_fkey"
            columns: ["renovado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_agendamentos: {
        Row: {
          ativo: boolean | null
          cliente_id: string | null
          created_at: string | null
          created_by: string | null
          data_envio: string | null
          dia_mes: string | null
          empresa_id: string
          filtro_clientes: Json | null
          hora_envio: string | null
          id: string
          mensagem_id: string
          proximo_envio: string | null
          tipo_agendamento: string
          ultimo_envio: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_envio?: string | null
          dia_mes?: string | null
          empresa_id: string
          filtro_clientes?: Json | null
          hora_envio?: string | null
          id?: string
          mensagem_id: string
          proximo_envio?: string | null
          tipo_agendamento: string
          ultimo_envio?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_envio?: string | null
          dia_mes?: string | null
          empresa_id?: string
          filtro_clientes?: Json | null
          hora_envio?: string | null
          id?: string
          mensagem_id?: string
          proximo_envio?: string | null
          tipo_agendamento?: string
          ultimo_envio?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_agendamentos_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_mensagens"
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
          data_de_assinatura_ativa: string | null
          data_de_expiracao_da_assinatura_ativa: string | null
          email: string
          empresa_id: string
          id: string
          nivel_permissao: Database["public"]["Enums"]["nivel_permissao"]
          nome: string
          sobrenome: string | null
          subscription_plan: string | null
          subscription_status: string | null
          telefone: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          data_de_assinatura_ativa?: string | null
          data_de_expiracao_da_assinatura_ativa?: string | null
          email: string
          empresa_id: string
          id?: string
          nivel_permissao?: Database["public"]["Enums"]["nivel_permissao"]
          nome: string
          sobrenome?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          telefone?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          data_de_assinatura_ativa?: string | null
          data_de_expiracao_da_assinatura_ativa?: string | null
          email?: string
          empresa_id?: string
          id?: string
          nivel_permissao?: Database["public"]["Enums"]["nivel_permissao"]
          nome?: string
          sobrenome?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          telefone?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
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
      servicos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string | null
          duracao_meses: number | null
          empresa_id: string
          id: string
          nome: string
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_meses?: number | null
          empresa_id: string
          id?: string
          nome: string
          tipo?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_meses?: number | null
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      whatsapp_instances: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          jid: string | null
          nome: string
          numero: string
          status: string | null
          updated_at: string | null
          user_token: string
          webhook: string | null
          wuzapi_id: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          jid?: string | null
          nome: string
          numero: string
          status?: string | null
          updated_at?: string | null
          user_token: string
          webhook?: string | null
          wuzapi_id?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          jid?: string | null
          nome?: string
          numero?: string
          status?: string | null
          updated_at?: string | null
          user_token?: string
          webhook?: string | null
          wuzapi_id?: string | null
        }
        Relationships: []
      }
      whatsapp_mensagens: {
        Row: {
          ativo: boolean | null
          conteudo: string
          created_at: string | null
          descricao: string | null
          empresa_id: string
          icone: string | null
          id: string
          is_system: boolean | null
          tipo: string
          titulo: string
          updated_at: string | null
          variaveis_disponiveis: string[]
        }
        Insert: {
          ativo?: boolean | null
          conteudo: string
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          icone?: string | null
          id?: string
          is_system?: boolean | null
          tipo: string
          titulo: string
          updated_at?: string | null
          variaveis_disponiveis?: string[]
        }
        Update: {
          ativo?: boolean | null
          conteudo?: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          icone?: string | null
          id?: string
          is_system?: boolean | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          variaveis_disponiveis?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_anamnese_template_for_company: {
        Args: { p_empresa_id: string }
        Returns: string
      }
      create_default_crm_stages_for_company: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      create_default_whatsapp_messages_for_company: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      get_active_user_empresa_id: { Args: never; Returns: string }
      get_admin_empresa_stats: {
        Args: never
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
      get_anamnese_perguntas_by_template: {
        Args: { p_template_id: string }
        Returns: {
          id: string
          obrigatoria: boolean
          opcoes: Json
          ordem: number
          pergunta: string
          placeholder: string
          secao: string
          secao_icone: string
          tipo: string
        }[]
      }
      get_anamnese_template: {
        Args: { p_template_id: string }
        Returns: {
          descricao: string
          id: string
          nome: string
        }[]
      }
      get_checkin_perguntas_by_template: {
        Args: { p_template_id: string }
        Returns: {
          id: string
          obrigatoria: boolean
          opcoes_pontuacao: Json
          ordem: number
          pergunta: string
          placeholder: string
          pontos_maximo: number
          secao: string
          secao_icone: string
          tipo: string
        }[]
      }
      get_checkin_template: {
        Args: { p_template_id: string }
        Returns: {
          descricao: string
          id: string
          nome: string
        }[]
      }
      get_cliente_nome: { Args: { p_cliente_id: string }; Returns: string }
      get_empresa_by_envio: {
        Args: { p_empresa_id: string }
        Returns: {
          cor_primaria: string
          cor_secundaria: string
          logo_url: string
          nome: string
          nome_exibicao: string
        }[]
      }
      get_security_report: {
        Args: never
        Returns: {
          check_name: string
          message: string
          status: boolean
        }[]
      }
      get_user_by_email: { Args: { user_email: string }; Returns: string }
      get_user_empresa_id: { Args: never; Returns: string }
      get_user_highest_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_active_subscription: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_company_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_sensitive_access: {
        Args: { p_action: string; p_record_id?: string; p_table_name: string }
        Returns: undefined
      }
      validate_anamnese_token: {
        Args: { p_token: string }
        Returns: {
          cliente_id: string
          empresa_id: string
          envio_id: string
          expira_em: string
          status: string
          template_id: string
        }[]
      }
      validate_checkin_token: {
        Args: { p_token: string }
        Returns: {
          cliente_id: string
          empresa_id: string
          envio_id: string
          expira_em: string
          status: string
          template_id: string
        }[]
      }
      validate_permission_levels: { Args: never; Returns: boolean }
      validate_user_empresa_integrity: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "operacional" | "visualizacao"
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
      app_role: ["admin", "editor", "operacional", "visualizacao"],
      nivel_permissao: ["admin", "operacional", "visualizacao"],
      status_cliente: ["ativo", "inativo", "lead", "prospecto"],
    },
  },
} as const
