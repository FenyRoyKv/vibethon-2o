import React, { useState, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Configure PDF.js worker with multiple fallbacks
if (typeof window !== "undefined") {
  // Try local worker first, then fallback to CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

interface DeckUploaderProps {
  onExtract: (slides: string[]) => void;
  onUploadStart?: () => void;
}

export const DeckUploader: React.FC<DeckUploaderProps> = ({
  onExtract,
  onUploadStart,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test worker configuration on component mount
  React.useEffect(() => {
    console.log("PDF.js worker src:", pdfjsLib.GlobalWorkerOptions.workerSrc);
    console.log("PDF.js version:", pdfjsLib.version);
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string[]> => {
    console.log(
      "Starting PDF extraction for file:",
      file.name,
      "Size:",
      file.size
    );

    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log("ArrayBuffer created, size:", arrayBuffer.byteLength);

      // Try loading with fallback mechanism
      let pdf;
      try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        pdf = await loadingTask.promise;
        console.log("PDF loaded successfully, pages:", pdf.numPages);
      } catch (workerError) {
        console.warn("Local worker failed, trying CDN fallback:", workerError);
        // Fallback to CDN worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        pdf = await loadingTask.promise;
        console.log("PDF loaded with CDN fallback, pages:", pdf.numPages);
      }

      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Extract text items and join them with spaces
          const pageText = textContent.items
            .filter((item): item is TextItem => "str" in item)
            .map((item) => item.str)
            .join(" ")
            .trim();

          pageTexts.push(pageText);
          console.log(
            `Page ${pageNum} processed, text length:`,
            pageText.length
          );
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          pageTexts.push(""); // Add empty string for failed pages
        }
      }

      console.log("PDF extraction completed successfully");
      return pageTexts;
    } catch (error) {
      console.error("PDF extraction failed:", error);
      throw error;
    }
  };

  const handleFileProcessing = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    // File size check (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setUploadedFile(file);

    // Notify parent that upload has started
    onUploadStart?.();

    try {
      const extractedTexts = await extractTextFromPDF(file);
      onExtract(extractedTexts);
    } catch (err) {
      console.error("PDF processing error:", err);
      let errorMessage = "Failed to process PDF. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("Invalid PDF")) {
          errorMessage =
            "This file appears to be corrupted or not a valid PDF.";
        } else if (err.message.includes("Password")) {
          errorMessage = "Password-protected PDFs are not supported.";
        } else if (err.message.includes("worker")) {
          errorMessage =
            "PDF processing service is unavailable. Please refresh and try again.";
        }
      }

      setError(errorMessage);
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileProcessing(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcessing(files[0]);
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isProcessing) {
    return null; // Don't show upload UI during processing
  }

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-16 text-center cursor-pointer
          transition-all duration-200 ease-in-out bg-white
          ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : error
              ? "border-red-300 bg-red-50"
              : uploadedFile
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Drag and drop your PDF here
            </h3>
            <p className="text-gray-600 mb-6">Or click to browse</p>

            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-md text-sm font-medium transition-colors">
              Upload PDF
            </button>
          </div>

          {uploadedFile && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-sm mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-green-500">✓</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};
