
interface ValidationErrorsProps {
  errors: string[];
}

export const ValidationErrors = ({ errors }: ValidationErrorsProps) => {
  if (errors.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <ul className="text-sm text-red-600 space-y-1">
        {errors.map((error, index) => (
          <li key={index}>• {error}</li>
        ))}
      </ul>
    </div>
  );
};
