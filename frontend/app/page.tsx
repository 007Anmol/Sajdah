"use client";

import { useState, useEffect } from "react";
import { Upload, Merge, Scissors, Stamp, Download, X, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const API_URL = "http://localhost:3000";

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const pdfFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      showToast("Please drop PDF files only", "error");
      return;
    }
    setFiles(pdfFiles);
    showToast(`${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''} loaded successfully`, "success");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const pdfFiles = Array.from(e.target.files).filter(f => f.type === "application/pdf");
      if (pdfFiles.length === 0) {
        showToast("Please select PDF files only", "error");
        return;
      }
      setFiles(pdfFiles);
      showToast(`${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''} loaded successfully`, "success");
    }
  };

  const merge = async () => {
    if (files.length < 2) {
      showToast("Please select at least 2 PDFs to merge", "error");
      return;
    }
    setLoading(true);
    const form = new FormData();
    files.forEach(f => form.append("files", f));

    try {
      const res = await fetch(`${API_URL}/merge`, { method: "POST", body: form });
      setLoading(false);
      if (res.ok) {
        const blob = await res.blob();
        download(blob, "merged.pdf");
        showToast("PDFs merged successfully!", "success");
      } else {
        showToast("Failed to merge PDFs", "error");
      }
    } catch (error) {
      setLoading(false);
      showToast("Error merging PDFs", "error");
    }
  };

  const watermark = async () => {
    if (files.length !== 1) {
      showToast("Please select exactly 1 PDF for watermarking", "error");
      return;
    }
    const text = prompt("Enter watermark text:");
    if (!text) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", files[0]);
    form.append("text", text);

    try {
      const res = await fetch(`${API_URL}/watermark`, { method: "POST", body: form });
      setLoading(false);
      if (res.ok) {
        const blob = await res.blob();
        download(blob, `watermarked_${text}.pdf`);
        showToast("Watermark applied successfully!", "success");
      } else {
        showToast("Failed to apply watermark", "error");
      }
    } catch (error) {
      setLoading(false);
      showToast("Error applying watermark", "error");
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-300 animate-in slide-in-from-top ${
          toast.type === 'success' 
            ? 'bg-white border-2 border-emerald-500' 
            : 'bg-white border-2 border-red-500'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <X className="w-6 h-6 text-red-500" />
          )}
          <span className={`font-medium ${toast.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
            {toast.message}
          </span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-3xl shadow-lg">
              <FileText className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            PDF Master Pro
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Professional PDF tools • 100% private • No files saved
          </p>
        </div>

        {/* Drop Zone */}
        <div className="mb-12">
          <input 
            type="file" 
            id="fileInput" 
            multiple 
            accept="application/pdf" 
            onChange={handleFileInput}
            className="hidden"
          />
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('fileInput')?.click()}
            className={`relative border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
            } shadow-lg hover:shadow-xl`}
          >
            <div className={`transition-all duration-300 ${isDragging ? 'scale-110' : ''}`}>
              <div className="inline-block p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-lg">
                <Upload className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Drop your PDFs here
              </h3>
              <p className="text-lg text-gray-500 mb-2">
                or click to browse
              </p>
              <p className="text-sm text-gray-400 font-medium">
                Supports multiple files • PDF only
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-12 bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Selected Files ({files.length})
              </h3>
              <button 
                onClick={() => setFiles([])}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-3">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-2 rounded-xl hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <button 
            onClick={merge} 
            disabled={loading || files.length < 2}
            className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:shadow-lg"
          >
            <div className="flex flex-col items-center">
              <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-md">
                <Merge className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Merge</h3>
              <p className="text-sm text-gray-500 font-medium">Combine PDFs</p>
            </div>
          </button>

          <button 
            onClick={watermark} 
            disabled={loading || files.length !== 1}
            className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:shadow-lg"
          >
            <div className="flex flex-col items-center">
              <div className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-md">
                <Stamp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Watermark</h3>
              <p className="text-sm text-gray-500 font-medium">Add text overlay</p>
            </div>
          </button>

          <div className="group relative bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-200 opacity-60 cursor-not-allowed">
            <div className="flex flex-col items-center">
              <div className="p-5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl mb-4 shadow-md">
                <Scissors className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Split</h3>
              <p className="text-sm text-gray-500 font-medium">Coming soon</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-200 opacity-60 cursor-not-allowed">
            <div className="flex flex-col items-center">
              <div className="p-5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl mb-4 shadow-md">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">More Tools</h3>
              <p className="text-sm text-gray-500 font-medium">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-xl font-semibold text-gray-900">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}