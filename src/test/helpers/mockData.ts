export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone: null,
  confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  role: 'authenticated',
}

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
}

export const mockEmpresa = {
  id: 'test-empresa-id',
  nome: 'Empresa Teste',
  email: 'empresa@teste.com',
  ativa: true,
  plano: 'premium',
}

export const mockPerfil = {
  id: 'test-perfil-id',
  user_id: 'test-user-id',
  empresa_id: 'test-empresa-id',
  nome: 'Usuário Teste',
  nivel_permissao: 'admin' as const,
  ativo: true,
}

export const mockSubscription = {
  id: 'test-subscription-id',
  empresa_id: 'test-empresa-id',
  status: 'trial' as const,
  trial_start_date: '2023-01-01T00:00:00Z',
  trial_end_date: '2023-01-08T00:00:00Z',
  monthly_value: 75.00,
}

export const mockProspect = {
  id: 'test-prospect-id',
  nome: 'Prospect Teste',
  email: 'prospect@teste.com',
  empresa_id: 'test-empresa-id',
  stage: 'lead',
  valor_estimado: 1000,
}