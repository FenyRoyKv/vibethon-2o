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
}

export const DeckUploader: React.FC<DeckUploaderProps> = ({ onExtract }) => {
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

    setError(null);
    setIsProcessing(true);
    setUploadedFile(file);

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
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${isProcessing ? "pointer-events-none opacity-50" : ""}
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

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Processing PDF...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div>
              <p className="text-lg font-medium text-gray-900">
                {uploadedFile ? "Upload another PDF" : "Upload your PDF"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your PDF here, or click to browse
              </p>
            </div>

            {uploadedFile && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
                <p className="text-sm text-green-800">
                  ✓ Uploaded: {uploadedFile.name}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};
