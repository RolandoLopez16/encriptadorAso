import React, { useState } from 'react'

type FileStatus = 'pendiente' | 'enviando' | 'completado' | 'error'

const tipos = ['CRC', 'CUV', 'FEV', 'RIPS', 'HEV', 'PDE', 'PDX']

interface FileItem {
  file: File
  status: FileStatus
  progress: number
  message?: string
}

const EncryptUploader: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [encryptionInProgress, setEncryptionInProgress] = useState(false)

  const [mantenerNombreOriginal, setMantenerNombreOriginal] = useState(true)
  const [nit, setNit] = useState('')
  const [tipo, setTipo] = useState(tipos[0])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const nuevosArchivos = Array.from(e.target.files).map(file => ({
      file,
      status: 'pendiente' as FileStatus,
      progress: 0,
    }))
    setFiles(nuevosArchivos)
  }

  const getFormattedFileName = (file: File) => {
    const nombre = file.name.replace(/\.[^/.]+$/, '')
    const extension = file.name.slice(file.name.lastIndexOf('.'))
    return mantenerNombreOriginal
      ? `${nombre}${extension}`
      : `${tipo}_${nit}_${nombre}${extension}`
  }

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const updateFileStatus = (
    index: number,
    status: FileStatus,
    progress?: number,
    message?: string
  ) => {
    setFiles(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        status,
        progress: progress ?? updated[index].progress,
        message,
      }
      return updated
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const encryptFile = async (item: FileItem, index: number) => {
    updateFileStatus(index, 'enviando', 10)
    const formData = new FormData()
    formData.append('file', item.file)

    try {
      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Servidor no respondió correctamente.')
      updateFileStatus(index, 'enviando', 60)

      const { encryptedFile, encryptedKey } = await res.json()

      const encBlob = new Blob([Uint8Array.from(atob(encryptedFile), c => c.charCodeAt(0))])
      const keyBlob = new Blob([Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0))])

      const baseName = getFormattedFileName(item.file)
      downloadBlob(encBlob, `${baseName}.enc`)
      downloadBlob(keyBlob, `${baseName}.key`)

      removeFile(index)
    } catch (error: any) {
      updateFileStatus(index, 'error', 0, error.message || 'Error desconocido')
    }
  }

  const handleEncryptAll = async () => {
    setEncryptionInProgress(true)
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pendiente' || files[i].status === 'error') {
        await encryptFile(files[i], i)
      }
    }
    setEncryptionInProgress(false)
  }

  const retryFile = (index: number) => {
    encryptFile(files[index], index)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow space-y-4">
      <h2 className="text-2xl font-bold">Encriptar múltiples archivos</h2>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={mantenerNombreOriginal}
          onChange={() => setMantenerNombreOriginal(prev => !prev)}
        />
        Mantener nombre original
      </label>

      {!mantenerNombreOriginal && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="NIT"
            value={nit}
            onChange={(e) => setNit(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/2"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/2"
          >
            {tipos.map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
      />

      {files.length > 0 && (
        <>
          <table className="w-full text-sm border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Archivo</th>
                <th className="text-left p-2">Tamaño</th>
                <th className="text-left p-2">Nombre final</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {files.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{item.file.name}</td>
                  <td className="p-2">{(item.file.size / 1024).toFixed(1)} KB</td>
                  <td className="p-2 text-xs">
                    <div>{getFormattedFileName(item.file)}.enc</div>
                    <div>{getFormattedFileName(item.file)}.key</div>
                  </td>
                  <td className="p-2">
                    {item.status === 'pendiente' && <span className="text-gray-600">Pendiente</span>}
                    {item.status === 'enviando' && (
                      <div className="text-blue-600">
                        Enviando...
                        <div className="w-full bg-gray-200 h-2 mt-1 rounded">
                          <div
                            className="bg-blue-500 h-2 rounded"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="text-red-600">
                        Error: {item.message}
                        <div className="w-full bg-gray-200 h-2 mt-1 rounded">
                          <div className="bg-red-500 h-2 rounded w-[5%]" />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {item.status === 'error' && (
                      <button
                        onClick={() => retryFile(i)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleEncryptAll}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mt-4"
            disabled={encryptionInProgress || (!mantenerNombreOriginal && (!nit.trim() || !tipo))}
          >
            {encryptionInProgress ? 'Procesando...' : 'Encriptar todos'}
          </button>
        </>
      )}
    </div>
  )
}

export default EncryptUploader
