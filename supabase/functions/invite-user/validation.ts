
import { InviteRequest } from './types.ts';

export async function parseAndValidateRequest(req: Request): Promise<InviteRequest> {
  // Parse request body com logs detalhados
  console.log('📄 Iniciando parsing do corpo da requisição...');
  
  let requestBody: string;
  try {
    requestBody = await req.text();
    console.log('📄 Corpo da requisição recebido (raw):', requestBody);
    console.log('📏 Tamanho do corpo:', requestBody ? requestBody.length : 0);
  } catch (error) {
    console.error('❌ Erro ao ler o corpo da requisição:', error);
    throw new Error('Failed to read request body');
  }

  // Verificar se o corpo não está vazio
  if (!requestBody || requestBody.trim() === '') {
    console.error('❌ Corpo da requisição está vazio');
    throw new Error('Corpo da requisição inválido ou vazio');
  }

  // Parse JSON
  let inviteData: InviteRequest;
  try {
    console.log('🔄 Tentando fazer parse do JSON...');
    inviteData = JSON.parse(requestBody);
    console.log('✅ JSON parseado com sucesso:', JSON.stringify(inviteData, null, 2));
  } catch (parseError) {
    console.error('❌ Erro ao fazer parse do JSON:', parseError);
    console.error('❌ Conteúdo que causou erro:', requestBody);
    throw new Error('Corpo da requisição inválido ou vazio');
  }

  // Validar estrutura do JSON
  const { email, nome, nivel_permissao } = inviteData || {};

  if (!email || !nome || !nivel_permissao) {
    console.error('❌ Campos obrigatórios faltando:', { 
      email: !!email, 
      nome: !!nome, 
      nivel_permissao: !!nivel_permissao,
      received_data: inviteData 
    });
    throw new Error('Missing required fields: email, nome, nivel_permissao');
  }

  // Validar tipos dos campos
  if (typeof email !== 'string' || typeof nome !== 'string' || typeof nivel_permissao !== 'string') {
    console.error('❌ Tipos de campos inválidos:', {
      email_type: typeof email,
      nome_type: typeof nome,
      nivel_permissao_type: typeof nivel_permissao
    });
    throw new Error('Invalid field types in request body');
  }

  // Validar nível de permissão
  const validPermissions = ['admin', 'editor', 'visualizacao', 'operacional'];
  if (!validPermissions.includes(nivel_permissao)) {
    console.error('❌ Nível de permissão inválido:', nivel_permissao);
    throw new Error('Invalid permission level');
  }

  return inviteData;
}
