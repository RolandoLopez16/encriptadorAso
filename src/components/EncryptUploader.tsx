// EncryptUploader.tsx (nuevo diseño con preview de múltiples archivos)
import React, { useState } from 'react'

type FileStatus = 'pendiente' | 'enviando' | 'completado' | 'error'

interface FileItem {
  file: File
  status: FileStatus
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
    const formData = new FormData()
    formData.append('file', fileItem.file)

    try {
      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Servidor no respondió correctamente.')

      const { encryptedFile, encryptedKey } = await res.json()

      const encBlob = new Blob([Uint8Array.from(atob(encryptedFile), c => c.charCodeAt(0))])
      const keyBlob = new Blob([Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0))])

      const originalName = fileItem.file.name
      const baseName = originalName.replace(/\.[^/.]+$/, '')
      const extension = originalName.slice(originalName.lastIndexOf('.'))

      downloadBlob(encBlob, `${baseName}${extension}.enc`)
      downloadBlob(keyBlob, `${baseName}${extension}.key`)

      updateFileStatus(index, 'completado')
    } catch (error: any) {
      console.error(error)
      updateFileStatus(index, 'error', error.message || 'Error desconocido')
    }
  }

  const updateFileStatus = (index: number, status: FileStatus, message?: string) => {
    setFiles(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], status, message }
      return updated
    })
  }

  const handleEncryptAll = async () => {
    setEncryptionInProgress(true)

    for (let i = 0; i < files.length; i++) {
      updateFileStatus(i, 'enviando')
      await encryptFile(files[i], i)
    }

    setEncryptionInProgress(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow space-y-4">
      <h2 className="text-2xl font-bold">Encriptar múltiples archivos</h2>

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
              </tr>
            </thead>
            <tbody>
              {files.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{item.file.name}</td>
                  <td className="p-2">{(item.file.size / 1024).toFixed(1)} KB</td>
                  <td className="p-2">
                    {item.status === 'pendiente' && <span className="text-gray-600">Pendiente</span>}
                    {item.status === 'enviando' && <span className="text-blue-600">Enviando...</span>}
                    {item.status === 'completado' && <span className="text-green-600">Completado</span>}
                    {item.status === 'error' && (
                      <span className="text-red-600">Error: {item.message}</span>
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
