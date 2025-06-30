
export const InviteInfoSection = () => {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• O usuário será criado com senha temporária: TempPassword123!</li>
        <li>• Após o login, o usuário deve alterar a senha nas configurações</li>
        <li>• O nível de permissão define o que o usuário pode acessar</li>
        <li>• O usuário poderá fazer login imediatamente com os dados criados</li>
      </ul>
    </div>
  );
};
