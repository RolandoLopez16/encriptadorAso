import { useState } from 'react';
import PublicKeyUploader from '../components/PublicKeyUploader';
import FileSelector from '../components/FileSelector';
import FileList from '../components/FileList';
import EncryptButton from '../components/EncryptButton';
import { encryptFile, importPublicKey } from '../services/encryption.service';
import { Lock, File, KeyRound, RotateCcw } from 'lucide-react';

export default function EncryptorPage() {
  const [publicKey, setPublicKey] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState<string>(Date.now().toString());
  const [encrypting, setEncrypting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRemoveFile = (index: number) => {
    const updated = [...selectedFiles];
    updated.splice(index, 1);
    setSelectedFiles(updated);
    setInputKey(Date.now().toString());
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setInputKey(Date.now().toString());
  };

  const handleEncrypt = async () => {
    if (!publicKey) return;

    setEncrypting(true);
    setMessage(null);

    try {
      const pem = await publicKey.text();
      const key = await importPublicKey(pem);

      for (const file of selectedFiles) {
        try {
          await encryptFile(file, key);
        } catch (fileErr) {
          console.error(`Error encriptando archivo ${file.name}:`, fileErr);
          setMessage({ type: 'error', text: `Error encriptando archivo: ${file.name}` });
          setEncrypting(false);
          return;
        }
      }

      setMessage({ type: 'success', text: 'Todos los archivos fueron encriptados correctamente 🎉' });
      setSelectedFiles([]);
      setInputKey(Date.now().toString());
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      console.error('Error general de encriptación:', err);
      setMessage({ type: 'error', text: 'Falló el proceso de encriptación. Verifica la llave pública.' });
    } finally {
      setEncrypting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      {/* LOGO en parte superior derecha */}
      {/* LOGO centrado arriba */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2">
        <img
          src="/logo.png"
          alt="Logo ASOPREVISUAL"
          className="h-20 sm:h-24 max-h-[96px] object-contain drop-shadow"
        />
      </div>


      {/* Tarjeta principal */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
          <Lock className="w-6 h-6" /> Encriptador ASOPREVISUAL
        </h2>

        <div className="space-y-4">
          {/* Llave pública */}
          <div className="flex items-center gap-2 text-primary-dark font-medium">
            <KeyRound className="w-4 h-4" /> Cargue la llave pública.
          </div>
          <PublicKeyUploader publicKey={publicKey} setPublicKey={setPublicKey} />

          {/* Archivos */}
          <div className="flex items-center gap-2 text-primary-dark font-medium">
            <File className="w-4 h-4" /> Seleccionar archivos a encriptar.
          </div>
          <FileSelector onFilesSelected={setSelectedFiles} resetKey={inputKey} />
          <FileList files={selectedFiles} onRemove={handleRemoveFile} />

          {/* Botón limpiar */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFiles}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Limpiar archivos
              </button>
            </div>
          )}

          {/* Mensaje visual */}
          {message && (
            <div className={`mt-2 text-sm px-4 py-2 rounded shadow-sm ${message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
              {message.text}
            </div>
          )}

          {/* Botón encriptar */}
          <EncryptButton
            disabled={selectedFiles.length === 0 || !publicKey || encrypting}
            onClick={handleEncrypt}
          />
        </div>
      </div>
    </div>
  );
}
