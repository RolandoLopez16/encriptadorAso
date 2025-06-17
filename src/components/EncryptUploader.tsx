import React, { useState } from 'react'

const EncryptUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setMessage('')
    }
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

  const handleEncrypt = async () => {
    if (!selectedFile) {
      setMessage('⚠️ Debes seleccionar un archivo primero.')
      return
    }

    setLoading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error en el servidor.')

      const { encryptedFile, encryptedKey } = await res.json()

      const encBlob = new Blob([Uint8Array.from(atob(encryptedFile), c => c.charCodeAt(0))])
      const keyBlob = new Blob([Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0))])

      // Obtener nombre base + extensión
      const originalName = selectedFile.name
      const baseName = originalName.replace(/\.[^/.]+$/, '')
      const extension = originalName.slice(originalName.lastIndexOf('.'))

      // Descargar automáticamente
      downloadBlob(encBlob, `${baseName}${extension}.enc`)
      downloadBlob(keyBlob, `${baseName}${extension}.key`)

      setMessage('✅ Archivo cifrado exitosamente.')
    } catch (err) {
      console.error(err)
      setMessage('❌ Error al cifrar el archivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md mx-auto bg-white space-y-4">
      <h2 className="text-xl font-semibold">Cifrar archivo</h2>
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full border p-2 rounded"
      />
      <button
        onClick={handleEncrypt}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Cifrando...' : 'Cifrar archivo'}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  )
}

export default EncryptUploader
