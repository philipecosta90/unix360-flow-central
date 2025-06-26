
export function getStatusCodeFromError(errorMessage: string): number {
  if (errorMessage.includes('Authorization header is required') || 
      errorMessage.includes('Invalid JWT token') ||
      errorMessage.includes('User ID not found') ||
      errorMessage.includes('Invalid authorization header format')) {
    return 401;
  } else if (errorMessage.includes('Admin permission required') || 
             errorMessage.includes('not allowed')) {
    return 403;
  } else if (errorMessage.includes('Missing required fields') ||
             errorMessage.includes('Corpo da requisição inválido ou vazio') ||
             errorMessage.includes('Invalid field types') ||
             errorMessage.includes('Invalid permission level') ||
             errorMessage.includes('Failed to read request body')) {
    return 400;
  }
  
  return 500;
}
