
export interface InviteRequest {
  email: string;
  nome: string;
  nivel_permissao: 'admin' | 'editor' | 'visualizacao' | 'operacional';
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
