import React from 'react';
import { FolderSearch } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = ({ 
  title, 
  description, 
  icon = <FolderSearch size={48} className="text-muted mb-4 opacity-50" />, 
  action 
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon}
      <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
};
