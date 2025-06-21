
import React from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const calculateStrength = (pwd: string): { score: number; feedback: string[] } => {
    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 8) {
      score += 20;
    } else {
      feedback.push("Pelo menos 8 caracteres");
    }

    if (/[A-Z]/.test(pwd)) {
      score += 20;
    } else {
      feedback.push("Uma letra maiúscula");
    }

    if (/[a-z]/.test(pwd)) {
      score += 20;
    } else {
      feedback.push("Uma letra minúscula");
    }

    if (/\d/.test(pwd)) {
      score += 20;
    } else {
      feedback.push("Um número");
    }

    if (/[^A-Za-z0-9]/.test(pwd)) {
      score += 20;
      feedback.pop(); // Remove last feedback if special char is present
    }

    return { score, feedback };
  };

  const { score, feedback } = calculateStrength(password);

  const getStrengthText = (score: number): string => {
    if (score < 40) return "Fraca";
    if (score < 60) return "Regular";
    if (score < 80) return "Boa";
    return "Forte";
  };

  const getStrengthColor = (score: number): string => {
    if (score < 40) return "text-red-600";
    if (score < 60) return "text-yellow-600";
    if (score < 80) return "text-blue-600";
    return "text-green-600";
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Força da senha:</span>
        <span className={`text-sm font-medium ${getStrengthColor(score)}`}>
          {getStrengthText(score)}
        </span>
      </div>
      <Progress value={score} className="h-2" />
      {feedback.length > 0 && (
        <div className="text-xs text-gray-500">
          Precisa de: {feedback.join(", ")}
        </div>
      )}
    </div>
  );
};
