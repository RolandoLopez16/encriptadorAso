// Convierte base64 a ArrayBuffer
function str2ab(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Exportado para otros componentes
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

// Importar clave pública desde .pem (estructura conforme a la guía)
export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDer = str2ab(pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, ''));
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256' // ✅ Esta es la forma correcta de declarar el hash
    },
    true,
    ['encrypt']
  );
}

// Encripta un archivo siguiendo toda la estructura oficial
export async function encryptFile(
  file: File,
  publicKey: CryptoKey,
  nit: string,
  tipo: string,
  mantenerNombreOriginal: boolean
) {
  const fileBuffer = await file.arrayBuffer();

  const extension = file.name.split('.').pop() || 'bin';
  const fileExtension = `.${extension}`;
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const extensionBytes = new TextEncoder().encode(fileExtension);

  // [4 bytes] longitud de la extensión
  const extensionLengthBuffer = new Uint8Array(4);
  new DataView(extensionLengthBuffer.buffer).setUint32(0, extensionBytes.length, false);

  // Construir nombre base para descarga
  const fileNameBase = mantenerNombreOriginal
    ? `${originalName}.${extension}`
    : `${tipo}_${nit}_${originalName}.${extension}`;

  // AES-256-CBC
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    fileBuffer
  );

  // Estructura final del archivo .enc
  const finalEncryptedFile = new Uint8Array(
    4 + extensionBytes.length + iv.length + encryptedContent.byteLength
  );
  finalEncryptedFile.set(extensionLengthBuffer, 0);
  finalEncryptedFile.set(extensionBytes, 4);
  finalEncryptedFile.set(iv, 4 + extensionBytes.length);
  finalEncryptedFile.set(
    new Uint8Array(encryptedContent),
    4 + extensionBytes.length + iv.length
  );

  // Cifrar clave AES con RSA-OAEP
  // ✅ Aquí NO se usa hash explícito, se toma del import (SHA-256)
  const rawKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedAesKey = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP' // 👈 TypeScript no permite 'hash' aquí
    },
    publicKey,
    rawKey
  );

  // Descargar archivos
  downloadFile(finalEncryptedFile.buffer, `${fileNameBase}.enc`);
  downloadFile(encryptedAesKey, `${fileNameBase}.key`);
}

// Utilidad para descargar archivos desde buffer
function downloadFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
