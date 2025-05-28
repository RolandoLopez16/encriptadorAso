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

// Cifra un archivo y genera claves + descarga
export async function encryptFile(file: File, publicKey: CryptoKey, nit: string, tipo: string) {
  const data = await file.arrayBuffer();
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data);
  const exportedKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, exportedKey);

  const baseName = `${tipo}_${nit}_${file.name}`;
  downloadFile(encryptedContent, `${baseName}.enc`);
  downloadFile(encryptedKey, `${baseName}.key`);
}


function downloadFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function str2ab(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
