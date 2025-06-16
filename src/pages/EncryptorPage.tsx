import { useState, useEffect } from 'react';
import PublicKeyUploader from '../components/PublicKeyUploader';
import FileSelector from '../components/FileSelector';
import FileList from '../components/FileList';
import EncryptButton from '../components/EncryptButton';
import { encryptFile, importPublicKey } from '../services/encryption.service';
import { Lock, File, KeyRound, RotateCcw } from 'lucide-react';

const STORAGE_KEYS = {
  nit: 'asoprevisual_nit',
};

export default function EncryptorPage() {
  const [publicKey, setPublicKey] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState<string>(Date.now().toString());
  const [encrypting, setEncrypting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [nit, setNit] = useState<string>('');
  const [nitLocked, setNitLocked] = useState<boolean>(false);
  const [tipo, setTipo] = useState<string>('CRC');
  const [mantenerNombreOriginal, setMantenerNombreOriginal] = useState<boolean>(false);

  const tiposDeDocumento = ['CRC', 'CUV', 'FEV', 'RIPS', 'HEV', 'PDE', 'PDX'];

  useEffect(() => {
    const savedNit = localStorage.getItem(STORAGE_KEYS.nit);
    if (savedNit) {
      setNit(savedNit);
    }
  }, []);

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
    if (!publicKey || !nit) return;

    setEncrypting(true);
    setMessage(null);

    try {
      const pem = await publicKey.text();
      const key = await importPublicKey(pem);

      const resultados = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            await encryptFile(file, key, nit, tipo, mantenerNombreOriginal);
            return { file, success: true };
          } catch (error) {
            return { file, success: false, error };
          }
        })
      );

      const fallidos = resultados.filter(r => !r.success);
      const exitosos = resultados.filter(r => r.success);

      // Generar log.csv
      const logCsv = [
        'Nombre del Archivo,Estado',
        ...resultados.map(r => `${r.file.name},${r.success ? 'OK' : 'ERROR'}`)
      ].join('\n');

      const blob = new Blob([logCsv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `log_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (fallidos.length > 0) {
        setMessage({
          type: 'error',
          text: `Fallaron ${fallidos.length} archivo(s): ${fallidos.map(f => f.file.name).join(', ')}`
        });
      } else {
        setMessage({ type: 'success', text: 'Todos los archivos fueron encriptados correctamente 🎉' });
      }

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
      {/* Logo centrado */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center w-full px-4">
        <div className="w-full h-px bg-neutral mb-3"></div>
        <img
          src="/logo.png"
          alt="Logo ASOPREVISUAL"
          className="h-20 sm:h-24 max-h-[96px] object-contain drop-shadow"
        />
        <div className="w-full h-px bg-neutral mt-3"></div>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 mt-32">
        <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
          <Lock className="w-6 h-6" /> Encriptador ASOPREVISUAL
        </h2>

        <div className="space-y-4">
          {/* Llave pública */}
          <div className="flex items-center gap-2 text-primary-dark font-medium">
            <KeyRound className="w-4 h-4" /> Cargue la llave pública.
          </div>
          <PublicKeyUploader publicKey={publicKey} setPublicKey={setPublicKey} />

          {/* NIT */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="text-sm text-text-main font-medium flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <span className="text-primary-dark font-semibold">Digite su NIT:</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => {
                    setNit(e.target.value);
                    localStorage.setItem(STORAGE_KEYS.nit, e.target.value);
                  }}
                  placeholder="Ej: 123456789"
                  disabled={nitLocked}
                  className="border border-primary-dark rounded px-3 py-1 text-sm outline-none w-full sm:w-[200px]"
                />
                {nit && (
                  <button
                    onClick={() => {
                      setNit('');
                      localStorage.removeItem(STORAGE_KEYS.nit);
                      setNitLocked(false);
                    }}
                    title="Eliminar NIT"
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            </label>

            <label className="text-sm text-primary-dark font-semibold flex items-center gap-2 mt-1 sm:mt-0">
              <input
                type="checkbox"
                checked={nitLocked}
                onChange={() => setNitLocked(!nitLocked)}
              />
              Mantener bloqueado
            </label>
          </div>

          {/* Tipo y switch */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-primary-dark font-medium">
              <File className="w-4 h-4" /> Seleccionar archivos a encriptar.
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-primary-dark font-semibold flex items-center gap-2">
                Tipo:
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="border border-neutral rounded px-2 py-1 text-sm"
                >
                  {tiposDeDocumento.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              {/* Switch mantener nombre */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-primary-dark font-semibold">Nombre original:</label>
                <button
                  onClick={() => setMantenerNombreOriginal(!mantenerNombreOriginal)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                    mantenerNombreOriginal ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`h-4 w-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      mantenerNombreOriginal ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Archivos */}
          <FileSelector onFilesSelected={setSelectedFiles} resetKey={inputKey} />
          <FileList files={selectedFiles} onRemove={handleRemoveFile} />

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

          {message && (
            <div className={`mt-2 text-sm px-4 py-2 rounded shadow-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message.text}
            </div>
          )}

          <EncryptButton
            disabled={selectedFiles.length === 0 || !publicKey || encrypting || !nit}
            onClick={handleEncrypt}
          />
        </div>
      </div>
    </div>
  );
}
