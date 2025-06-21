
interface LockoutWarningProps {
  isLockedOut: boolean;
}

export const LockoutWarning = ({ isLockedOut }: LockoutWarningProps) => {
  if (!isLockedOut) return null;

  return (
    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
      <p className="text-sm text-orange-600">
        Conta temporariamente bloqueada devido a muitas tentativas de login.
      </p>
    </div>
  );
};
