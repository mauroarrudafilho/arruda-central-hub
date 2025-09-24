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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      acordo_anexos: {
        Row: {
          acordo_id: string
          atualizado_em: string
          criado_em: string
          criado_por: string
          id: string
          mime_type: string
          nome_arquivo: string
          storage_path: string
          tamanho_arquivo: number
          tipo_anexo: string
        }
        Insert: {
          acordo_id: string
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          id?: string
          mime_type: string
          nome_arquivo: string
          storage_path: string
          tamanho_arquivo: number
          tipo_anexo?: string
        }
        Update: {
          acordo_id?: string
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          id?: string
          mime_type?: string
          nome_arquivo?: string
          storage_path?: string
          tamanho_arquivo?: number
          tipo_anexo?: string
        }
        Relationships: []
      }
      acordo_aprovacoes: {
        Row: {
          acordo_id: string
          aprovador_id: string
          atualizado_em: string
          comentarios: string | null
          criado_em: string
          data_aprovacao: string | null
          id: string
          status_aprovacao: string
          tipo_aprovacao: string
        }
        Insert: {
          acordo_id: string
          aprovador_id: string
          atualizado_em?: string
          comentarios?: string | null
          criado_em?: string
          data_aprovacao?: string | null
          id?: string
          status_aprovacao?: string
          tipo_aprovacao: string
        }
        Update: {
          acordo_id?: string
          aprovador_id?: string
          atualizado_em?: string
          comentarios?: string | null
          criado_em?: string
          data_aprovacao?: string | null
          id?: string
          status_aprovacao?: string
          tipo_aprovacao?: string
        }
        Relationships: []
      }
      acordos: {
        Row: {
          anexo_url: string | null
          atualizado_em: string
          cliente_id: string
          comprador_id: string | null
          criado_em: string
          data_negociacao: string
          detalhes_acordo: string | null
          formato_abatimento: string | null
          id: string
          justificativa: string
          mes_previsto_abatimento: string
          numero_acordo: string | null
          regional: string | null
          status: Database["public"]["Enums"]["status_acordo"]
          tipo: Database["public"]["Enums"]["tipo_acordo"]
          tipo_acordo_id: string | null
          uf: string | null
          valor: number
          vendedor_id: string
        }
        Insert: {
          anexo_url?: string | null
          atualizado_em?: string
          cliente_id: string
          comprador_id?: string | null
          criado_em?: string
          data_negociacao: string
          detalhes_acordo?: string | null
          formato_abatimento?: string | null
          id?: string
          justificativa: string
          mes_previsto_abatimento: string
          numero_acordo?: string | null
          regional?: string | null
          status?: Database["public"]["Enums"]["status_acordo"]
          tipo: Database["public"]["Enums"]["tipo_acordo"]
          tipo_acordo_id?: string | null
          uf?: string | null
          valor: number
          vendedor_id: string
        }
        Update: {
          anexo_url?: string | null
          atualizado_em?: string
          cliente_id?: string
          comprador_id?: string | null
          criado_em?: string
          data_negociacao?: string
          detalhes_acordo?: string | null
          formato_abatimento?: string | null
          id?: string
          justificativa?: string
          mes_previsto_abatimento?: string
          numero_acordo?: string | null
          regional?: string | null
          status?: Database["public"]["Enums"]["status_acordo"]
          tipo?: Database["public"]["Enums"]["tipo_acordo"]
          tipo_acordo_id?: string | null
          uf?: string | null
          valor?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acordos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_comprador_id_fkey"
            columns: ["comprador_id"]
            isOneToOne: false
            referencedRelation: "compradores_acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_tipo_acordo_id_fkey"
            columns: ["tipo_acordo_id"]
            isOneToOne: false
            referencedRelation: "tipos_acordo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_acordos"
            referencedColumns: ["id"]
          },
        ]
      }
      action_products: {
        Row: {
          action_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "action_products_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          action_code: string
          approved_at: string | null
          closure_submitted_at: string | null
          comprovante_path: string | null
          created_at: string
          degustadora_id: string
          description: string | null
          end_date: string
          end_time: string | null
          id: string
          leader_id: string
          observations: string | null
          paid_at: string | null
          public_token: string | null
          rejected_at: string | null
          rejection_reason: string | null
          revision_requested_at: string | null
          revision_requested_by: string | null
          start_date: string
          start_time: string | null
          status: string
          store_id: string
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_observations: string | null
          valor: number | null
        }
        Insert: {
          action_code: string
          approved_at?: string | null
          closure_submitted_at?: string | null
          comprovante_path?: string | null
          created_at?: string
          degustadora_id: string
          description?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          leader_id: string
          observations?: string | null
          paid_at?: string | null
          public_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          revision_requested_at?: string | null
          revision_requested_by?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          store_id: string
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_observations?: string | null
          valor?: number | null
        }
        Update: {
          action_code?: string
          approved_at?: string | null
          closure_submitted_at?: string | null
          comprovante_path?: string | null
          created_at?: string
          degustadora_id?: string
          description?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          leader_id?: string
          observations?: string | null
          paid_at?: string | null
          public_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          revision_requested_at?: string | null
          revision_requested_by?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          store_id?: string
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_observations?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_degustadora_id_fkey"
            columns: ["degustadora_id"]
            isOneToOne: false
            referencedRelation: "degustadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: unknown | null
          modulo: string
          nivel: string
          origem: string
          recurso_id: string | null
          recurso_tipo: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown | null
          modulo: string
          nivel?: string
          origem?: string
          recurso_id?: string | null
          recurso_tipo?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown | null
          modulo?: string
          nivel?: string
          origem?: string
          recurso_id?: string | null
          recurso_tipo?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_permission: {
        Row: {
          acao: string
          created_at: string
          descricao: string | null
          id: string
          modulo: string
          nome: string
          sistema: boolean
          updated_at: string
        }
        Insert: {
          acao: string
          created_at?: string
          descricao?: string | null
          id?: string
          modulo: string
          nome: string
          sistema?: boolean
          updated_at?: string
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string | null
          id?: string
          modulo?: string
          nome?: string
          sistema?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      auth_profile: {
        Row: {
          api_tokens: Json | null
          avatar_url: string | null
          cargo: string | null
          created_at: string
          departamento: string | null
          distribuidor: string | null
          email: string
          id: string
          nome: string
          status: string
          telefone: string | null
          time_id: string | null
          two_factor_enabled: boolean
          ultimo_login: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_tokens?: Json | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          distribuidor?: string | null
          email: string
          id?: string
          nome: string
          status?: string
          telefone?: string | null
          time_id?: string | null
          two_factor_enabled?: boolean
          ultimo_login?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_tokens?: Json | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          distribuidor?: string | null
          email?: string
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
          time_id?: string | null
          two_factor_enabled?: boolean
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auth_role: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          distribuidor: string | null
          id: string
          nome: string
          sistema: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          distribuidor?: string | null
          id?: string
          nome: string
          sistema?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          distribuidor?: string | null
          id?: string
          nome?: string
          sistema?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      auth_role_permission: {
        Row: {
          concedida: boolean
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          concedida?: boolean
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          concedida?: boolean
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_role_permission_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "auth_permission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_role_permission_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "auth_role"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_user_role: {
        Row: {
          ativo: boolean
          concedido_por: string | null
          created_at: string
          data_concessao: string
          data_expiracao: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          concedido_por?: string | null
          created_at?: string
          data_concessao?: string
          data_expiracao?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          concedido_por?: string | null
          created_at?: string
          data_concessao?: string
          data_expiracao?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_user_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "auth_role"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_path: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          file_size: number | null
          id: string
          status: string
          tables_count: number | null
          total_records: number | null
        }
        Insert: {
          backup_path?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          status: string
          tables_count?: number | null
          total_records?: number | null
        }
        Update: {
          backup_path?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          status?: string
          tables_count?: number | null
          total_records?: number | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      clientes_acordos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cnpj: string | null
          criado_em: string
          id: string
          nome: string
          rede: string
          regional: string
          uf: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cnpj?: string | null
          criado_em?: string
          id?: string
          nome: string
          rede: string
          regional: string
          uf: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cnpj?: string | null
          criado_em?: string
          id?: string
          nome?: string
          rede?: string
          regional?: string
          uf?: string
        }
        Relationships: []
      }
      closures: {
        Row: {
          action_id: string
          competitor_info: Json | null
          created_at: string
          extra_costs: number | null
          fiscal_document: string | null
          id: string
          observations: string | null
          people_attended: number | null
          photos: string[] | null
          products_data: Json | null
          samples_distributed: number | null
          store_flow: string | null
          total_bottles: number | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          action_id: string
          competitor_info?: Json | null
          created_at?: string
          extra_costs?: number | null
          fiscal_document?: string | null
          id?: string
          observations?: string | null
          people_attended?: number | null
          photos?: string[] | null
          products_data?: Json | null
          samples_distributed?: number | null
          store_flow?: string | null
          total_bottles?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          action_id?: string
          competitor_info?: Json | null
          created_at?: string
          extra_costs?: number | null
          fiscal_document?: string | null
          id?: string
          observations?: string | null
          people_attended?: number | null
          photos?: string[] | null
          products_data?: Json | null
          samples_distributed?: number | null
          store_flow?: string | null
          total_bottles?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "closures_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      compradores_acordos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cargo: string | null
          cliente_id: string | null
          criado_em: string
          departamento: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cargo?: string | null
          cliente_id?: string | null
          criado_em?: string
          departamento?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cargo?: string | null
          cliente_id?: string | null
          criado_em?: string
          departamento?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comprador_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_acordos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_integracao: {
        Row: {
          ativo: boolean
          configuracao: Json
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          configuracao: Json
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          configuracao?: Json
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      degustadora_custos: {
        Row: {
          action_id: string | null
          competencia: string
          created_at: string
          data_pagamento: string | null
          degustadora_id: string
          id: string
          observacao: string | null
          status_pagamento: string | null
          updated_at: string
          valor_acao: number | null
          valor_alimentacao: number | null
          valor_diaria: number | null
          valor_outros: number | null
          valor_total: number | null
          valor_transporte: number | null
        }
        Insert: {
          action_id?: string | null
          competencia: string
          created_at?: string
          data_pagamento?: string | null
          degustadora_id: string
          id?: string
          observacao?: string | null
          status_pagamento?: string | null
          updated_at?: string
          valor_acao?: number | null
          valor_alimentacao?: number | null
          valor_diaria?: number | null
          valor_outros?: number | null
          valor_total?: number | null
          valor_transporte?: number | null
        }
        Update: {
          action_id?: string | null
          competencia?: string
          created_at?: string
          data_pagamento?: string | null
          degustadora_id?: string
          id?: string
          observacao?: string | null
          status_pagamento?: string | null
          updated_at?: string
          valor_acao?: number | null
          valor_alimentacao?: number | null
          valor_diaria?: number | null
          valor_outros?: number | null
          valor_total?: number | null
          valor_transporte?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "degustadora_custos_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "degustadora_custos_degustadora_id_fkey"
            columns: ["degustadora_id"]
            isOneToOne: false
            referencedRelation: "degustadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      degustadora_documentos: {
        Row: {
          created_at: string
          degustadora_id: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          nome_arquivo: string
          observacao: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          degustadora_id: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          nome_arquivo: string
          observacao?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          degustadora_id?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          nome_arquivo?: string
          observacao?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "degustadora_documentos_degustadora_id_fkey"
            columns: ["degustadora_id"]
            isOneToOne: false
            referencedRelation: "degustadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      degustadoras: {
        Row: {
          admission_date: string | null
          banco: string | null
          birth_date: string | null
          celular: string | null
          chave_pix: string | null
          cpf: string
          created_at: string
          email: string | null
          id: string
          name: string
          rg: string | null
          status: string
          tipo_chave_pix: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          banco?: string | null
          birth_date?: string | null
          celular?: string | null
          chave_pix?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          rg?: string | null
          status?: string
          tipo_chave_pix?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          banco?: string | null
          birth_date?: string | null
          celular?: string | null
          chave_pix?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          rg?: string | null
          status?: string
          tipo_chave_pix?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_access_log: {
        Row: {
          action: string
          created_at: string | null
          document_id: string
          document_table: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          document_id: string
          document_table: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          document_id?: string
          document_table?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      documentos_gerados: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          loja_cnpj: string | null
          loja_nome: string
          periodo_fim: string
          periodo_inicio: string
          pessoa_cpf: string
          pessoa_funcao: string
          pessoa_nome: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          loja_cnpj?: string | null
          loja_nome: string
          periodo_fim: string
          periodo_inicio: string
          pessoa_cpf: string
          pessoa_funcao: string
          pessoa_nome: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          loja_cnpj?: string | null
          loja_nome?: string
          periodo_fim?: string
          periodo_inicio?: string
          pessoa_cpf?: string
          pessoa_funcao?: string
          pessoa_nome?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      epi_allocations: {
        Row: {
          created_at: string
          data_alocacao: string
          data_devolucao: string | null
          epi_id: string
          id: string
          observacoes: string | null
          promoter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_alocacao?: string
          data_devolucao?: string | null
          epi_id: string
          id?: string
          observacoes?: string | null
          promoter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_alocacao?: string
          data_devolucao?: string | null
          epi_id?: string
          id?: string
          observacoes?: string | null
          promoter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_allocations_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_allocations_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_categories: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      epi_item_allocations: {
        Row: {
          created_at: string
          data_alocacao: string
          data_devolucao: string | null
          epi_item_id: string
          id: string
          observacoes: string | null
          promoter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_alocacao?: string
          data_devolucao?: string | null
          epi_item_id: string
          id?: string
          observacoes?: string | null
          promoter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_alocacao?: string
          data_devolucao?: string | null
          epi_item_id?: string
          id?: string
          observacoes?: string | null
          promoter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_item_allocations_epi_item_id_fkey"
            columns: ["epi_item_id"]
            isOneToOne: false
            referencedRelation: "epi_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_item_allocations_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_items: {
        Row: {
          codigo_item: string
          created_at: string
          data_entrada: string
          data_fabricacao: string
          data_validade: string
          epi_model_id: string
          id: string
          lote: string | null
          numero_serie: string | null
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          codigo_item: string
          created_at?: string
          data_entrada?: string
          data_fabricacao: string
          data_validade: string
          epi_model_id: string
          id?: string
          lote?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          codigo_item?: string
          created_at?: string
          data_entrada?: string
          data_fabricacao?: string
          data_validade?: string
          epi_model_id?: string
          id?: string
          lote?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_items_epi_model_id_fkey"
            columns: ["epi_model_id"]
            isOneToOne: false
            referencedRelation: "epi_models"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_models: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          fornecedor: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      epis: {
        Row: {
          categoria: string
          created_at: string
          data_fabricacao: string
          data_validade: string
          descricao: string | null
          fornecedor: string | null
          id: string
          lote: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          quantidade_estoque: number
          status: string
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          data_fabricacao: string
          data_validade: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          lote?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          quantidade_estoque?: number
          status?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          data_fabricacao?: string
          data_validade?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          lote?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          quantidade_estoque?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      etl_invoice_items: {
        Row: {
          cest: string | null
          cfop: string | null
          cofins_rate: number | null
          cofins_value: number | null
          description: string
          discount: number | null
          ean: string | null
          freight_value: number | null
          gross_value: number
          icms_cst: string | null
          icms_rate: number | null
          icms_value: number | null
          id: string
          invoice_id: string | null
          ipi_code: string | null
          ipi_rate: number | null
          ipi_value: number | null
          n_item: number
          ncm: string | null
          pis_rate: number | null
          pis_value: number | null
          quantity: number
          raw_item: Json | null
          sku: string | null
          u_com: string | null
          unit_price: number
        }
        Insert: {
          cest?: string | null
          cfop?: string | null
          cofins_rate?: number | null
          cofins_value?: number | null
          description: string
          discount?: number | null
          ean?: string | null
          freight_value?: number | null
          gross_value: number
          icms_cst?: string | null
          icms_rate?: number | null
          icms_value?: number | null
          id?: string
          invoice_id?: string | null
          ipi_code?: string | null
          ipi_rate?: number | null
          ipi_value?: number | null
          n_item: number
          ncm?: string | null
          pis_rate?: number | null
          pis_value?: number | null
          quantity: number
          raw_item?: Json | null
          sku?: string | null
          u_com?: string | null
          unit_price: number
        }
        Update: {
          cest?: string | null
          cfop?: string | null
          cofins_rate?: number | null
          cofins_value?: number | null
          description?: string
          discount?: number | null
          ean?: string | null
          freight_value?: number | null
          gross_value?: number
          icms_cst?: string | null
          icms_rate?: number | null
          icms_value?: number | null
          id?: string
          invoice_id?: string | null
          ipi_code?: string | null
          ipi_rate?: number | null
          ipi_value?: number | null
          n_item?: number
          ncm?: string | null
          pis_rate?: number | null
          pis_value?: number | null
          quantity?: number
          raw_item?: Json | null
          sku?: string | null
          u_com?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "etl_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "etl_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_invoice_payments: {
        Row: {
          amount: number
          due_date: string | null
          id: string
          invoice_id: string | null
          method: string
          paid_at: string | null
          parcela_number: number | null
          raw_payment: Json | null
        }
        Insert: {
          amount: number
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          method: string
          paid_at?: string | null
          parcela_number?: number | null
          raw_payment?: Json | null
        }
        Update: {
          amount?: number
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          paid_at?: string | null
          parcela_number?: number | null
          raw_payment?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "etl_invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "etl_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_invoices: {
        Row: {
          access_key: string
          cofins_total: number | null
          created_at: string | null
          discount_total: number | null
          emitter_id: string | null
          freight_total: number | null
          icms_total: number | null
          id: string
          ipi_total: number | null
          issue_date: string
          json_raw: Json | null
          number: number
          pdf_storage_path: string | null
          pdf_url: string | null
          pis_total: number | null
          recipient_id: string | null
          series: string
          total_invoice: number | null
          total_products: number | null
          updated_at: string | null
          xml_storage_path: string | null
          xml_text: string | null
          xml_url: string | null
        }
        Insert: {
          access_key: string
          cofins_total?: number | null
          created_at?: string | null
          discount_total?: number | null
          emitter_id?: string | null
          freight_total?: number | null
          icms_total?: number | null
          id?: string
          ipi_total?: number | null
          issue_date: string
          json_raw?: Json | null
          number: number
          pdf_storage_path?: string | null
          pdf_url?: string | null
          pis_total?: number | null
          recipient_id?: string | null
          series: string
          total_invoice?: number | null
          total_products?: number | null
          updated_at?: string | null
          xml_storage_path?: string | null
          xml_text?: string | null
          xml_url?: string | null
        }
        Update: {
          access_key?: string
          cofins_total?: number | null
          created_at?: string | null
          discount_total?: number | null
          emitter_id?: string | null
          freight_total?: number | null
          icms_total?: number | null
          id?: string
          ipi_total?: number | null
          issue_date?: string
          json_raw?: Json | null
          number?: number
          pdf_storage_path?: string | null
          pdf_url?: string | null
          pis_total?: number | null
          recipient_id?: string | null
          series?: string
          total_invoice?: number | null
          total_products?: number | null
          updated_at?: string | null
          xml_storage_path?: string | null
          xml_text?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etl_invoices_emitter_id_fkey"
            columns: ["emitter_id"]
            isOneToOne: false
            referencedRelation: "etl_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etl_invoices_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "etl_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_parties: {
        Row: {
          address: Json | null
          cnpj: string
          created_at: string | null
          id: string
          ie: string | null
          im: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          cnpj: string
          created_at?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          cnpj?: string
          created_at?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          created_at: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_acordos: {
        Row: {
          acordo_id: string
          autor_id: string
          criado_em: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          detalhes: string | null
          evento: string
          id: string
          ip_usuario: unknown | null
          tipo_evento: string | null
          user_agent: string | null
        }
        Insert: {
          acordo_id: string
          autor_id: string
          criado_em?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          detalhes?: string | null
          evento: string
          id?: string
          ip_usuario?: unknown | null
          tipo_evento?: string | null
          user_agent?: string | null
        }
        Update: {
          acordo_id?: string
          autor_id?: string
          criado_em?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          detalhes?: string | null
          evento?: string
          id?: string
          ip_usuario?: unknown | null
          tipo_evento?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_acordos_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_acordos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_acordos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ingestao: {
        Row: {
          arquivo_nome: string | null
          created_at: string
          email_origem: string | null
          erro_detalhes: string | null
          id: string
          origem: string
          processado_em: string
          registros_erro: number | null
          registros_processados: number | null
          registros_sucesso: number | null
          status: string
          webhook_n8n_id: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          created_at?: string
          email_origem?: string | null
          erro_detalhes?: string | null
          id?: string
          origem: string
          processado_em?: string
          registros_erro?: number | null
          registros_processados?: number | null
          registros_sucesso?: number | null
          status: string
          webhook_n8n_id?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          created_at?: string
          email_origem?: string | null
          erro_detalhes?: string | null
          id?: string
          origem?: string
          processado_em?: string
          registros_erro?: number | null
          registros_processados?: number | null
          registros_sucesso?: number | null
          status?: string
          webhook_n8n_id?: string | null
        }
        Relationships: []
      }
      importacao_erros: {
        Row: {
          campo: string | null
          criado_em: string
          erro: string
          id: string
          linha: number
          lote_id: string
          valor_original: string | null
        }
        Insert: {
          campo?: string | null
          criado_em?: string
          erro: string
          id?: string
          linha: number
          lote_id: string
          valor_original?: string | null
        }
        Update: {
          campo?: string | null
          criado_em?: string
          erro?: string
          id?: string
          linha?: number
          lote_id?: string
          valor_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "importacao_erros_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "importacao_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      importacao_lotes: {
        Row: {
          finalizado_em: string | null
          id: string
          iniciado_em: string
          iniciado_por: string
          nome_arquivo: string
          observacoes: string | null
          registros_erro: number
          registros_processados: number
          registros_sucesso: number
          status: string
          total_registros: number
        }
        Insert: {
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          iniciado_por: string
          nome_arquivo: string
          observacoes?: string | null
          registros_erro?: number
          registros_processados?: number
          registros_sucesso?: number
          status?: string
          total_registros?: number
        }
        Update: {
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          iniciado_por?: string
          nome_arquivo?: string
          observacoes?: string | null
          registros_erro?: number
          registros_processados?: number
          registros_sucesso?: number
          status?: string
          total_registros?: number
        }
        Relationships: []
      }
      insights_clients: {
        Row: {
          cnpj: string | null
          created_at: string | null
          faturamento_anterior: number | null
          faturamento_atual: number | null
          frequencia_compra: number | null
          id: string
          nome: string
          regiao: string | null
          segmento: string | null
          status: string | null
          supervisor: string | null
          ticket_medio: number | null
          updated_at: string | null
          upload_id: string | null
          variacao: number | null
          vendedor: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          faturamento_anterior?: number | null
          faturamento_atual?: number | null
          frequencia_compra?: number | null
          id?: string
          nome: string
          regiao?: string | null
          segmento?: string | null
          status?: string | null
          supervisor?: string | null
          ticket_medio?: number | null
          updated_at?: string | null
          upload_id?: string | null
          variacao?: number | null
          vendedor?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          faturamento_anterior?: number | null
          faturamento_atual?: number | null
          frequencia_compra?: number | null
          id?: string
          nome?: string
          regiao?: string | null
          segmento?: string | null
          status?: string | null
          supervisor?: string | null
          ticket_medio?: number | null
          updated_at?: string | null
          upload_id?: string | null
          variacao?: number | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_clients_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "insights_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_kpis: {
        Row: {
          calculated_at: string | null
          clientes_crescimento: number | null
          clientes_novos: number | null
          clientes_perdidos: number | null
          clientes_queda: number | null
          crescimento_mensal: number | null
          divergencia_distribuidor: number | null
          faturamento_total: number | null
          id: string
          periodo: string
          total_clientes: number | null
          upload_id: string | null
        }
        Insert: {
          calculated_at?: string | null
          clientes_crescimento?: number | null
          clientes_novos?: number | null
          clientes_perdidos?: number | null
          clientes_queda?: number | null
          crescimento_mensal?: number | null
          divergencia_distribuidor?: number | null
          faturamento_total?: number | null
          id?: string
          periodo: string
          total_clientes?: number | null
          upload_id?: string | null
        }
        Update: {
          calculated_at?: string | null
          clientes_crescimento?: number | null
          clientes_novos?: number | null
          clientes_perdidos?: number | null
          clientes_queda?: number | null
          crescimento_mensal?: number | null
          divergencia_distribuidor?: number | null
          faturamento_total?: number | null
          id?: string
          periodo?: string
          total_clientes?: number | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_kpis_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "insights_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_playbooks: {
        Row: {
          ai_confidence: number | null
          client_id: string | null
          content: string | null
          created_at: string | null
          generated_by: string | null
          id: string
          status: string | null
          strategies: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          status?: string | null
          strategies?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          status?: string | null
          strategies?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_playbooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "insights_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_product_mix: {
        Row: {
          categoria: string
          client_id: string | null
          created_at: string | null
          id: string
          percentual: number | null
          periodo: string | null
          valor: number | null
        }
        Insert: {
          categoria: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          percentual?: number | null
          periodo?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          percentual?: number | null
          periodo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_product_mix_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "insights_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_reports: {
        Row: {
          client_id: string | null
          content: Json | null
          created_at: string | null
          file_path: string | null
          generated_by: string | null
          id: string
          report_type: string | null
          title: string
        }
        Insert: {
          client_id?: string | null
          content?: Json | null
          created_at?: string | null
          file_path?: string | null
          generated_by?: string | null
          id?: string
          report_type?: string | null
          title: string
        }
        Update: {
          client_id?: string | null
          content?: Json | null
          created_at?: string | null
          file_path?: string | null
          generated_by?: string | null
          id?: string
          report_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "insights_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_sales_data: {
        Row: {
          categoria: string | null
          client_id: string | null
          created_at: string | null
          distribuidor_faturamento: number | null
          faturamento: number | null
          id: string
          pedidos: number | null
          periodo: string | null
          raw_data: Json | null
          supervisor: string | null
          ticket_medio: number | null
          upload_id: string | null
          vendedor: string | null
        }
        Insert: {
          categoria?: string | null
          client_id?: string | null
          created_at?: string | null
          distribuidor_faturamento?: number | null
          faturamento?: number | null
          id?: string
          pedidos?: number | null
          periodo?: string | null
          raw_data?: Json | null
          supervisor?: string | null
          ticket_medio?: number | null
          upload_id?: string | null
          vendedor?: string | null
        }
        Update: {
          categoria?: string | null
          client_id?: string | null
          created_at?: string | null
          distribuidor_faturamento?: number | null
          faturamento?: number | null
          id?: string
          pedidos?: number | null
          periodo?: string | null
          raw_data?: Json | null
          supervisor?: string | null
          ticket_medio?: number | null
          upload_id?: string | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_sales_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "insights_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_sales_data_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "insights_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      insights_uploads: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number
          id: string
          mapping_confidence: number | null
          mime_type: string
          processed_records: number | null
          processing_progress: number | null
          storage_path: string | null
          total_records: number | null
          updated_at: string | null
          upload_status: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size: number
          id?: string
          mapping_confidence?: number | null
          mime_type: string
          processed_records?: number | null
          processing_progress?: number | null
          storage_path?: string | null
          total_records?: number | null
          updated_at?: string | null
          upload_status?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number
          id?: string
          mapping_confidence?: number | null
          mime_type?: string
          processed_records?: number | null
          processing_progress?: number | null
          storage_path?: string | null
          total_records?: number | null
          updated_at?: string | null
          upload_status?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      leader_assignments: {
        Row: {
          created_at: string | null
          created_by: string | null
          degustadora_id: string | null
          id: string
          leader_user_id: string
          promoter_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          degustadora_id?: string | null
          id?: string
          leader_user_id: string
          promoter_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          degustadora_id?: string | null
          id?: string
          leader_user_id?: string
          promoter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leader_assignments_degustadora_id_fkey"
            columns: ["degustadora_id"]
            isOneToOne: false
            referencedRelation: "degustadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_assignments_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      leaders: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notas_fiscais: {
        Row: {
          created_at: string
          data_emissao: string
          data_vencimento: string | null
          fornecedor_cnpj: string
          fornecedor_nome: string
          id: string
          numero_nfe: string
          pdf_url: string | null
          serie: string
          status: string
          updated_at: string
          valor_total: number
          xml_url: string | null
        }
        Insert: {
          created_at?: string
          data_emissao: string
          data_vencimento?: string | null
          fornecedor_cnpj: string
          fornecedor_nome: string
          id?: string
          numero_nfe: string
          pdf_url?: string | null
          serie: string
          status?: string
          updated_at?: string
          valor_total: number
          xml_url?: string | null
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_vencimento?: string | null
          fornecedor_cnpj?: string
          fornecedor_nome?: string
          id?: string
          numero_nfe?: string
          pdf_url?: string | null
          serie?: string
          status?: string
          updated_at?: string
          valor_total?: number
          xml_url?: string | null
        }
        Relationships: []
      }
      notificacao_preferencias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          tipo_notificacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          tipo_notificacao: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          tipo_notificacao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_documents: {
        Row: {
          agent_used: string | null
          bucket: string
          created_at: string
          error: string | null
          extracted_data: string | null
          id: number
          metadata: Json
          object_name: string
          pages: number | null
          processing_time: string | null
          source: string | null
          source_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_used?: string | null
          bucket?: string
          created_at?: string
          error?: string | null
          extracted_data?: string | null
          id?: never
          metadata?: Json
          object_name: string
          pages?: number | null
          processing_time?: string | null
          source?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_used?: string | null
          bucket?: string
          created_at?: string
          error?: string | null
          extracted_data?: string | null
          id?: never
          metadata?: Json
          object_name?: string
          pages?: number | null
          processing_time?: string | null
          source?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          brand_id: string | null
          created_at: string
          descricao: string | null
          ean: string | null
          fornecedor: string | null
          fornecedor_id: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          brand_id?: string | null
          created_at?: string
          descricao?: string | null
          ean?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          brand_id?: string | null
          created_at?: string
          descricao?: string | null
          ean?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nivel_acesso: Database["public"]["Enums"]["nivel_acesso"]
          nome: string
          status: Database["public"]["Enums"]["status_usuario"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nivel_acesso?: Database["public"]["Enums"]["nivel_acesso"]
          nome: string
          status?: Database["public"]["Enums"]["status_usuario"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nivel_acesso?: Database["public"]["Enums"]["nivel_acesso"]
          nome?: string
          status?: Database["public"]["Enums"]["status_usuario"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_modules: {
        Row: {
          ativo: boolean
          created_at: string
          icone: string | null
          id: string
          nome: string
          ordem: number
          project_id: string
          rota: string
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          project_id: string
          rota: string
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          project_id?: string
          rota?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          admission_date: string | null
          birth_date: string | null
          cpf: string
          created_at: string
          id: string
          name: string
          rg: string | null
          route_plan_id: string | null
          status: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          birth_date?: string | null
          cpf: string
          created_at?: string
          id?: string
          name: string
          rg?: string | null
          route_plan_id?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          birth_date?: string | null
          cpf?: string
          created_at?: string
          id?: string
          name?: string
          rg?: string | null
          route_plan_id?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoters_route_plan_id_fkey"
            columns: ["route_plan_id"]
            isOneToOne: false
            referencedRelation: "route_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      promotor_custos: {
        Row: {
          acrescimo_periculosidade: number | null
          alimentacao: number | null
          auto_calc: boolean | null
          competencia: string
          created_at: string
          custo_total: number | null
          desconto: number | null
          desconto_plano_saude: number | null
          encargos: number | null
          ferias: number | null
          fgts: number | null
          id: string
          inss: number | null
          manutencao_veiculo: number | null
          mobilidade: number | null
          observacao: string | null
          outras_entidades: number | null
          outros: number | null
          outros_descontos: number | null
          plano_saude: number | null
          promotor_id: string
          rat: number | null
          salario_base: number | null
          transporte: number | null
          updated_at: string
        }
        Insert: {
          acrescimo_periculosidade?: number | null
          alimentacao?: number | null
          auto_calc?: boolean | null
          competencia: string
          created_at?: string
          custo_total?: number | null
          desconto?: number | null
          desconto_plano_saude?: number | null
          encargos?: number | null
          ferias?: number | null
          fgts?: number | null
          id?: string
          inss?: number | null
          manutencao_veiculo?: number | null
          mobilidade?: number | null
          observacao?: string | null
          outras_entidades?: number | null
          outros?: number | null
          outros_descontos?: number | null
          plano_saude?: number | null
          promotor_id: string
          rat?: number | null
          salario_base?: number | null
          transporte?: number | null
          updated_at?: string
        }
        Update: {
          acrescimo_periculosidade?: number | null
          alimentacao?: number | null
          auto_calc?: boolean | null
          competencia?: string
          created_at?: string
          custo_total?: number | null
          desconto?: number | null
          desconto_plano_saude?: number | null
          encargos?: number | null
          ferias?: number | null
          fgts?: number | null
          id?: string
          inss?: number | null
          manutencao_veiculo?: number | null
          mobilidade?: number | null
          observacao?: string | null
          outras_entidades?: number | null
          outros?: number | null
          outros_descontos?: number | null
          plano_saude?: number | null
          promotor_id?: string
          rat?: number | null
          salario_base?: number | null
          transporte?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotor_custos_promotor_id_fkey"
            columns: ["promotor_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promotor_documentos: {
        Row: {
          classificacao: string | null
          competencia: string
          created_at: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          nome_arquivo: string
          observacao: string | null
          promotor_id: string
          reclassificado_em: string | null
          reclassificado_por: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          classificacao?: string | null
          competencia: string
          created_at?: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          nome_arquivo: string
          observacao?: string | null
          promotor_id: string
          reclassificado_em?: string | null
          reclassificado_por?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          classificacao?: string | null
          competencia?: string
          created_at?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          nome_arquivo?: string
          observacao?: string | null
          promotor_id?: string
          reclassificado_em?: string | null
          reclassificado_por?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotor_documentos_promotor_id_fkey"
            columns: ["promotor_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      route_assignments: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          notes: string | null
          plan_id: string
          promotor_id: string | null
          store_id: string
          updated_at: string
          visit_order: number | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          notes?: string | null
          plan_id: string
          promotor_id?: string | null
          store_id: string
          updated_at?: string
          visit_order?: number | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          notes?: string | null
          plan_id?: string
          promotor_id?: string | null
          store_id?: string
          updated_at?: string
          visit_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "route_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "route_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_promotor_id_fkey"
            columns: ["promotor_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      route_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          endereco: string | null
          endereco_completo: string | null
          id: string
          logradouro: string | null
          nome_fantasia: string
          numero: string | null
          perfil_cliente: string | null
          razao_social: string | null
          rede: string | null
          status: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          endereco_completo?: string | null
          id?: string
          logradouro?: string | null
          nome_fantasia: string
          numero?: string | null
          perfil_cliente?: string | null
          razao_social?: string | null
          rede?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          endereco_completo?: string | null
          id?: string
          logradouro?: string | null
          nome_fantasia?: string
          numero?: string | null
          perfil_cliente?: string | null
          razao_social?: string | null
          rede?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      templates_importacao: {
        Row: {
          ativo: boolean
          atualizado_em: string
          campos_obrigatorios: Json
          criado_em: string
          criado_por: string
          descricao: string | null
          id: string
          mapeamento_colunas: Json
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          campos_obrigatorios?: Json
          criado_em?: string
          criado_por: string
          descricao?: string | null
          id?: string
          mapeamento_colunas?: Json
          nome: string
          tipo?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          campos_obrigatorios?: Json
          criado_em?: string
          criado_por?: string
          descricao?: string | null
          id?: string
          mapeamento_colunas?: Json
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      tipos_acordo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_project_access: {
        Row: {
          concedido_por: string | null
          created_at: string
          id: string
          nivel_acesso: Database["public"]["Enums"]["nivel_acesso"]
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concedido_por?: string | null
          created_at?: string
          id?: string
          nivel_acesso?: Database["public"]["Enums"]["nivel_acesso"]
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concedido_por?: string | null
          created_at?: string
          id?: string
          nivel_acesso?: Database["public"]["Enums"]["nivel_acesso"]
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_acordos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          auth_user_id: string | null
          convite_aceito_em: string | null
          convite_enviado_em: string | null
          convite_token: string | null
          criado_em: string
          email: string | null
          id: string
          nome: string
          papel: Database["public"]["Enums"]["acordo_papel"]
          regional: string | null
          status_convite: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          convite_aceito_em?: string | null
          convite_enviado_em?: string | null
          convite_token?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          nome: string
          papel?: Database["public"]["Enums"]["acordo_papel"]
          regional?: string | null
          status_convite?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          auth_user_id?: string | null
          convite_aceito_em?: string | null
          convite_enviado_em?: string | null
          convite_token?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["acordo_papel"]
          regional?: string | null
          status_convite?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      bootstrap_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      debug_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_level: string
          has_admin_role: boolean
          has_leader_role: boolean
          has_viewer_role: boolean
          profile_exists: boolean
          user_id: string
        }[]
      }
      ensure_unique_action_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_action_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_endereco_completo: {
        Args:
          | {
              p_bairro: string
              p_cep: string
              p_cidade: string
              p_endereco: string
              p_logradouro: string
              p_numero: string
              p_uf: string
            }
          | {
              p_bairro: string
              p_cep: string
              p_cidade: string
              p_endereco: string
              p_numero: string
              p_uf: string
            }
        Returns: string
      }
      generate_epi_item_code: {
        Args: { categoria_nome: string }
        Returns: string
      }
      get_highest_role: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_access_level: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["nivel_acesso"]
      }
      get_user_acordo_info: {
        Args: { user_id: string }
        Returns: {
          papel: Database["public"]["Enums"]["acordo_papel"]
          regional: string
        }[]
      }
      get_user_acordo_papel: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["acordo_papel"]
      }
      get_user_basic_info: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          email: string
          nome: string
          status: string
          ultimo_login: string
          user_id: string
        }[]
      }
      get_user_projects: {
        Args: { _user_id?: string }
        Returns: {
          descricao: string
          id: string
          nivel_acesso: Database["public"]["Enums"]["nivel_acesso"]
          nome: string
          slug: string
          status: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_leader: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      leader_has_degustadora_access: {
        Args: { _degustadora_id: string; _user_id?: string }
        Returns: boolean
      }
      leader_has_promoter_access: {
        Args: { _promoter_id: string; _user_id?: string }
        Returns: boolean
      }
      update_user_project_access: {
        Args: {
          _access_level: Database["public"]["Enums"]["nivel_acesso"]
          _grant_access: boolean
          _project_id: string
          _user_id: string
        }
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_name: string; user_id: string }
        Returns: boolean
      }
      user_has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      acordo_papel:
        | "admin"
        | "gestor"
        | "vendedor"
        | "gestor_fornecedor"
        | "financeiro_fornecedor"
      app_role: "admin" | "lider" | "visualizador"
      nivel_acesso: "admin" | "gestor" | "visualizador"
      status_acordo:
        | "rascunho"
        | "solicitar_aprovacao"
        | "aprovacao_comercial"
        | "validacao"
        | "conciliado"
        | "assinado"
      status_usuario: "ativo" | "inativo"
      tipo_acordo:
        | "desconto"
        | "bonificacao"
        | "verba"
        | "negociacao_sell_in"
        | "acao_rebaixa_preco"
        | "aniversario_ocasioes_especiais"
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
      acordo_papel: [
        "admin",
        "gestor",
        "vendedor",
        "gestor_fornecedor",
        "financeiro_fornecedor",
      ],
      app_role: ["admin", "lider", "visualizador"],
      nivel_acesso: ["admin", "gestor", "visualizador"],
      status_acordo: [
        "rascunho",
        "solicitar_aprovacao",
        "aprovacao_comercial",
        "validacao",
        "conciliado",
        "assinado",
      ],
      status_usuario: ["ativo", "inativo"],
      tipo_acordo: [
        "desconto",
        "bonificacao",
        "verba",
        "negociacao_sell_in",
        "acao_rebaixa_preco",
        "aniversario_ocasioes_especiais",
      ],
    },
  },
} as const
