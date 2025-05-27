import { Trash2 } from 'lucide-react';

type FileListProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <ul className="space-y-2">
      {files.map((file, index) => (
        <li
          key={index}
          className="flex items-center justify-between border border-neutral rounded px-3 py-2 bg-white text-sm"
        >
          <span className="truncate">{file.name}</span>
          <button
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 transition"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
