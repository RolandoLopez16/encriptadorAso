import React, { useState } from 'react'

type FileStatus = 'pendiente' | 'enviando' | 'completado' | 'error'

interface FileItem {
  file: File
  status: FileStatus
  progress: number
  message?: string
}

const EncryptUploader: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [encryptionInProgress, setEncryptionInProgress] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files)

    const newFileItems: FileItem[] = selectedFiles.map(file => ({
      file,
      status: 'pendiente',
      progress: 0,
    }))

    setFiles(newFileItems)
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

  const encryptFile = async (fileItem: FileItem, index: number) => {
    updateFileStatus(index, 'enviando', 10)

    const formData = new FormData()
    formData.append('file', fileItem.file)

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

      const originalName = fileItem.file.name
      const baseName = originalName.replace(/\.[^/.]+$/, '')
      const extension = originalName.slice(originalName.lastIndexOf('.'))

      // Descargar automáticamente
      downloadBlob(encBlob, `${baseName}${extension}.enc`)
      downloadBlob(keyBlob, `${baseName}${extension}.key`)

      // Marcar como completado y removerlo de la vista
      removeFile(index)
    } catch (error: any) {
      console.error(error)
      updateFileStatus(index, 'error', 0, error.message || 'Error desconocido')
    }
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
        progress: progress !== undefined ? progress : updated[index].progress,
        message,
      }
      return updated
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleEncryptAll = async () => {
    setEncryptionInProgress(true)

    for (let i = 0; i < files.length; i++) {
      const current = files[i]
      if (current.status === 'pendiente' || current.status === 'error') {
        await encryptFile(current, i)
      }
    }

    setEncryptionInProgress(false)
  }

  const retryFile = async (index: number) => {
    await encryptFile(files[index], index)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow space-y-4">
      <h2 className="text-2xl text-green-800 font-bold">🔒 Encriptar múltiples archivos</h2>

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
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {files.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{item.file.name}</td>
                  <td className="p-2">{(item.file.size / 1024).toFixed(1)} KB</td>
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
                          <div
                            className="bg-red-500 h-2 rounded"
                            style={{ width: '5%' }}
                          />
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
            disabled={encryptionInProgress}
          >
            {encryptionInProgress ? 'Procesando...' : 'Encriptar todos'}
          </button>
        </>
      )}
    </div>
  )
}

export default EncryptUploader
