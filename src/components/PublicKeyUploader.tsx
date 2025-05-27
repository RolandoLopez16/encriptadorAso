import { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

type PublicKeyUploaderProps = {
  publicKey: File | null;
  setPublicKey: (file: File | null) => void;
};

export default function PublicKeyUploader({ publicKey, setPublicKey }: PublicKeyUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.pem')) {
      setPublicKey(file);
    } else {
      alert('Por favor selecciona un archivo .pem válido.');
    }
  };

  const handleRemove = () => {
    setPublicKey(null);
    inputRef.current!.value = '';
  };

  return (
    <div>
      {publicKey ? (
        <div className="flex items-center justify-between bg-neutral px-3 py-2 rounded">
          <span className="text-sm text-text-main truncate">{publicKey.name}</span>
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 cursor-pointer bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition">
          <UploadCloud className="w-4 h-4" />
          Subir llave
          <input
            ref={inputRef}
            type="file"
            accept=".pem"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
