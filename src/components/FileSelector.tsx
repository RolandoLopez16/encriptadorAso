type FileSelectorProps = {
  onFilesSelected: (files: File[]) => void;
  resetKey: string;
};

export default function FileSelector({ onFilesSelected, resetKey }: FileSelectorProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const files = Array.from(fileList);
      onFilesSelected(files);
    }
  };

  return (
    <input
      key={resetKey}
      type="file"
      multiple
      onChange={handleFileChange}
      className="block w-full text-sm text-text-main border border-neutral rounded px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
    />
  );
}
