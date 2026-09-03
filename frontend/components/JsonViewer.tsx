"use client";

type JsonViewerProps = {
  data: unknown;
  downloadFilename: string;
};

const JsonViewer = ({ data, downloadFilename }: JsonViewerProps) => {
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = downloadFilename;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="px-3 py-1.5 text-sm border border-border rounded-sm text-text hover:bg-surface"
        >
          Copy JSON
        </button>
        <button
          onClick={downloadJson}
          className="px-3 py-1.5 text-sm border border-border rounded-sm text-text hover:bg-surface"
        >
          Download JSON
        </button>
      </div>

      <pre className="border border-border rounded-sm p-4 text-xs font-mono overflow-auto max-h-[500px] bg-surface text-text select-text">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default JsonViewer;