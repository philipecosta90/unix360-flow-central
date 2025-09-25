
import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  sobrenome?: string;
  cargo?: string;
  telefone?: string;
  email: string;
  empresa_id: string;
  nivel_permissao: 'admin' | 'editor' | 'visualizacao' | 'operacional';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_status?: 'trial' | 'active' | 'expired' | 'canceled';
  subscription_plan?: string;
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

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nome: string;
  nomeEmpresa: string;
  cnpj: string;
}
