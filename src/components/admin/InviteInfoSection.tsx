
export const InviteInfoSection = () => {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• O usuário receberá um email com link para definir a senha</li>
        <li>• Após definir a senha, poderá fazer login normalmente</li>
        <li>• O nível de permissão define o que o usuário pode acessar</li>
      </ul>
    </div>
  );
};
