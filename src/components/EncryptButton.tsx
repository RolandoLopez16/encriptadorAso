import { useState } from 'react';

type EncryptButtonProps = {
  disabled: boolean;
  onClick: () => Promise<void>;
};

export default function EncryptButton({ disabled, onClick }: EncryptButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`px-6 py-2 rounded text-white font-semibold transition ${
          disabled
            ? 'bg-neutral cursor-not-allowed'
            : 'bg-primary hover:bg-primary-dark'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            Encriptando...
            <span className="animate-spin inline-block border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
          </span>
        ) : (
          'Encriptar archivos'
        )}
      </button>
    </div>
  );
}
