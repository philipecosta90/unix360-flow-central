
import { Shield, Edit, Eye, Wrench } from "lucide-react";

export const getPermissionIcon = (level: string) => {
  switch (level) {
    case 'admin':
      return Shield;
    case 'editor':
      return Edit;
    case 'visualizacao':
      return Eye;
    case 'operacional':
      return Wrench;
    default:
      return Wrench;
  }
};

export const getPermissionDescription = (level: string) => {
  switch (level) {
    case 'admin':
      return 'Acesso total ao sistema';
    case 'editor':
      return 'Pode editar dados e configurações';
    case 'visualizacao':
      return 'Apenas visualização de dados';
    case 'operacional':
      return 'Acesso operacional básico';
    default:
      return 'Acesso operacional básico';
  }
};
