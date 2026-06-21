import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'md' }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className={`relative w-full max-h-[90vh] flex flex-col bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up ${maxWidthClass}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-icon !p-1 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="p-5 sm:p-6 border-t border-white/10 bg-slate-900/20 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
