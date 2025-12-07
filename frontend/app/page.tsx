"use client";

import { useState } from "react";
import { Upload, Merge, Scissors, Stamp, Download } from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf"));
  };

  const merge = async () => {
    if (files.length < 2) return alert("Select 2+ PDFs");
    setLoading(true);
    const form = new FormData();
    files.forEach(f => form.append("files", f));

    const res = await fetch(`${API_URL}/merge`, { method: "POST", body: form });
    setLoading(false);
    if (res.ok) {
      const blob = await res.blob();
      download(blob, "merged.pdf");
    }
  };

  const watermark = async () => {
    if (files.length !== 1) return alert("Select 1 PDF");
    const text = prompt("Enter watermark text:");
    if (!text) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", files[0]);
    form.append("text", text);

    const res = await fetch(`${API_URL}/watermark`, { method: "POST", body: form });
    setLoading(false);
    if (res.ok) {
      const blob = await res.blob();
      download(blob, `watermarked_${text}.pdf`);
    }
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4">PDF Master Pro</h1>
        <p className="text-center text-xl text-gray-400 mb-12">
          No files saved. Ever. 100% private.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-4 border-dashed border-blue-500 rounded-3xl p-20 text-center mb-12 bg-slate-800/50"
        >
          <Upload className="w-24 h-24 mx-auto mb-6 text-blue-400" />
          <p className="text-3xl font-semibold">Drop PDFs Here</p>
          <p className="text-gray-400 mt-4">{files.length} file(s) selected</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <button onClick={merge} disabled={loading} className="bg-blue-600 hover:bg-blue-700 p-8 rounded-2xl transition">
            <Merge className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Merge</h3>
          </button>

          <button onClick={watermark} disabled={loading} className="bg-red-600 hover:bg-red-700 p-8 rounded-2xl transition">
            <Stamp className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Watermark</h3>
          </button>

          <div className="bg-gray-700 p-8 rounded-2xl opacity-50">
            <Scissors className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Split (Soon)</h3>
          </div>

          <div className="bg-gray-700 p-8 rounded-2xl opacity-50">
            <Download className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold">More →</h3>
          </div>
        </div>
      </div>
    </div>
  );
}