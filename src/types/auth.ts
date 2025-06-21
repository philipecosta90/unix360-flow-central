
import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  sobrenome?: string;
  cargo?: string;
  telefone?: string;
  empresa_id: string;
  nivel_permissao: 'admin' | 'editor' | 'visualizacao';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresas?: {
    id: string;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    configuracoes_nicho?: any;
  };
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
