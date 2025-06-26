
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

// Function to decode JWT payload (without signature validation)
export function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Failed to decode JWT payload');
  }
}

export async function validateAuth(req: Request) {
  // Get the authorization header
  const authHeader = req.headers.get('authorization');
  console.log('🔍 Authorization header recebido:', authHeader ? 'Presente' : 'Ausente');
  
  if (!authHeader) {
    console.error('❌ Authorization header não encontrado');
    throw new Error('Authorization header is required');
  }

  // Extract the JWT token
  const token = authHeader.replace('Bearer ', '');
  if (!token || token === authHeader) {
    console.error('❌ Formato do authorization header inválido:', authHeader.substring(0, 100));
    throw new Error('Invalid authorization header format');
  }

  // Verificar se o token parece ser um JWT (contém pontos)
  if (!token.includes('.')) {
    console.error('❌ Token não parece ser um JWT válido (sem pontos):', token.substring(0, 100));
    throw new Error('Invalid JWT token format');
  }

  console.log('✅ Token JWT extraído com sucesso (primeiros 50 chars):', token.substring(0, 50) + '...');

  // Decode JWT payload to get user_id
  console.log('🔓 Decodificando payload do JWT...');
  let jwtPayload;
  try {
    jwtPayload = decodeJWTPayload(token);
    console.log('✅ JWT payload decodificado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao decodificar JWT payload:', error);
    throw new Error('Invalid JWT token payload');
  }

  const userId = jwtPayload.sub;
  if (!userId) {
    console.error('❌ User ID (sub) não encontrado no JWT payload');
    throw new Error('User ID not found in JWT payload');
  }

  console.log('✅ User ID extraído do JWT:', userId);
  return userId;
}

export async function validateAdminPermissions(userId: string) {
  // Create Supabase client for database queries
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // Check if current user is admin by querying the perfis table
  console.log('🔍 Verificando permissões do usuário...');
  const { data: userProfile, error: profileError } = await supabase
    .from('perfis')
    .select('nivel_permissao, empresa_id')
    .eq('user_id', userId)
    .single();

  if (profileError) {
    console.error('❌ Erro ao buscar perfil do usuário:', profileError);
    throw new Error('User profile not found');
  }

  console.log('👤 Perfil do usuário:', { nivel_permissao: userProfile.nivel_permissao, empresa_id: userProfile.empresa_id });

  if (userProfile.nivel_permissao !== 'admin') {
    console.error('❌ Usuário não tem permissão de admin:', userProfile.nivel_permissao);
    throw new Error('Admin permission required to invite users');
  }

  console.log('✅ Usuário é admin, prosseguindo com o convite...');
  return userProfile;
}
