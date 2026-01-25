import { X } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  darkMode: boolean;
}

const ErrorModal = ({ isOpen, onClose, message, darkMode }: ErrorModalProps) => {
  if (!isOpen) return null;

  const bgClass = darkMode ? 'bg-[#111827]' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`${bgClass} rounded-2xl shadow-2xl max-w-md w-full p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${textClass}`}>Oops!</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-800' : ''} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`${mutedClass} mb-6 leading-relaxed`}>{message}</p>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;