// Convierte un archivo a ArrayBuffer
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

// Carga la llave pública PEM y la convierte a CryptoKey
export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDer = str2ab(pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, ''));
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}

// Cifra un archivo y genera claves + descarga (.enc y .key)
export async function encryptFile(file: File, publicKey: CryptoKey, nit: string, tipo: string) {
  const fileBuffer = await file.arrayBuffer();
  const fileExtension = `.${file.name.split('.').pop()}`;
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  const fileNameBase = `${tipo}_${nit}_${fileNameWithoutExt}`;

  // Convertir extensión a bytes
  const extensionBytes = new TextEncoder().encode(fileExtension);
  const extensionLengthBuffer = new Uint8Array(4);
  new DataView(extensionLengthBuffer.buffer).setUint32(0, extensionBytes.length, false);

  // AES-CBC requiere clave de 32 bytes y IV de 16 bytes
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // Cifrar archivo con AES-CBC
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    fileBuffer
  );

  // Unir: [longitud extensión][extensión][IV][contenido cifrado]
  const fullEncryptedBuffer = new Uint8Array(
    4 + extensionBytes.length + iv.length + encryptedContent.byteLength
  );
  fullEncryptedBuffer.set(extensionLengthBuffer, 0);
  fullEncryptedBuffer.set(extensionBytes, 4);
  fullEncryptedBuffer.set(iv, 4 + extensionBytes.length);
  fullEncryptedBuffer.set(new Uint8Array(encryptedContent), 4 + extensionBytes.length + iv.length);

  // Exportar y cifrar la clave AES con RSA pública
  const rawKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawKey);

  // Descargar archivos .enc y .key
  downloadFile(fullEncryptedBuffer.buffer, `${fileNameBase}.enc`);
  downloadFile(encryptedKey, `${fileNameBase}.key`);
}

// Descarga archivo desde un buffer
function downloadFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Base64 a ArrayBuffer
function str2ab(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
