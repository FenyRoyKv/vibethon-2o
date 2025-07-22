import { Chat } from "./components/Chat";
import { DeckUploader } from "./components/DeckUploader";
import { VC_PERSONALITIES } from "./data/vcs";
import { analyzeSlides } from "./utils/analyzeSlides";
import { useState } from "react";

type VCStyle = "skeptic" | "numbers_hawk" | "operator";
type AppState = "upload" | "analyzing" | "summary" | "chat";

function App() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [report, setReport] = useState("");
  const [selectedVCStyle, setSelectedVCStyle] = useState<VCStyle>("skeptic");

  const handleExtractedSlides = async (slides: string[]) => {
    setAppState("analyzing");
    try {
      const result = await analyzeSlides(slides, selectedVCStyle);
      setReport(result);
      setAppState("summary");
    } catch (error) {
      console.error("Analysis failed:", error);
      setAppState("upload");
    }
  };

  const handleUploadStart = () => {
    setReport("");
    setAppState("analyzing");
  };

  const getVCPersonality = (vcStyle: VCStyle) => {
    switch (vcStyle) {
      case "skeptic":
        return VC_PERSONALITIES.skeptic;
      case "numbers_hawk":
        return VC_PERSONALITIES.numbersHawk;
      case "operator":
        return VC_PERSONALITIES.operator;
    }
  };

  const resetToHome = () => {
    setAppState("upload");
    setReport("");
  };

  const goToChat = () => {
    setAppState("chat");
  };

  const goToSummary = () => {
    setAppState("summary");
  };

  const renderNavigation = () => {
    if (appState === "upload" || appState === "analyzing") {
      return null;
    }

    return (
      <nav className="hidden md:flex space-x-8">
        <button
          onClick={resetToHome}
          className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
        >
          Home
        </button>
        {appState !== "summary" && (
          <button
            onClick={goToSummary}
            className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
          >
            Summaries
          </button>
        )}
        {appState !== "chat" && (
          <button
            onClick={goToChat}
            className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
          >
            Chat
          </button>
        )}
      </nav>
    );
  };

  const renderUserProfile = () => {
    if (appState === "upload" || appState === "analyzing") {
      return null;
    }

    return (
      <div className="flex items-center space-x-4">
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium">U</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📄</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {appState === "analyzing" ? "File Insights" : "PDF Analyzer"}
                </span>
              </div>
            </div>

            {/* Navigation */}
            {renderNavigation()}

            {/* User Profile */}
            {renderUserProfile()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24 py-16">
        {appState === "upload" && (
          <div className="text-center py-20">
            <div className="mb-16">
              <h1 className="text-5xl font-bold text-gray-900 mb-8">
                Upload your PDF
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Drag and drop your PDF file here, or click to select a file from
                your computer.
              </p>
            </div>

            {/* VC Personality Selector */}
            <div className="mb-16">
              <label
                htmlFor="vc-style"
                className="block text-lg font-medium text-gray-700 mb-6"
              >
                Choose Investor Personality
              </label>
              <select
                id="vc-style"
                value={selectedVCStyle}
                onChange={(e) => setSelectedVCStyle(e.target.value as VCStyle)}
                className="mx-auto block w-80 px-6 py-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-base"
              >
                <option value="skeptic">
                  The Skeptic - Challenges assumptions
                </option>
                <option value="numbers_hawk">
                  Numbers Hawk - Obsessed with metrics
                </option>
                <option value="operator">
                  The Operator - Focused on execution
                </option>
              </select>
            </div>

            <div className="max-w-4xl mx-auto">
              <DeckUploader
                onExtract={handleExtractedSlides}
                onUploadStart={handleUploadStart}
              />
            </div>
          </div>
        )}

        {appState === "analyzing" && (
          <div className="text-center py-32">
            <h1 className="text-4xl font-bold text-gray-900 mb-16">
              Analyzing your file
            </h1>

            <div className="max-w-3xl mx-auto mb-12">
              <div className="mb-8">
                <p className="text-lg font-medium text-gray-700 mb-4">
                  Analyzing file...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gray-800 h-3 rounded-full w-1/2 transition-all duration-1000"></div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  This may take a few minutes
                </p>
              </div>
            </div>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're processing your document to provide you with insights and
              enable chat functionality. Please wait while we analyze the
              content.
            </p>
          </div>
        )}

        {appState === "summary" && report && (
          <div className="py-16">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                PDF Summary
              </h1>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm">
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
                    {report}
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <button
                  onClick={goToChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-base font-medium transition-colors"
                >
                  Start Chatting
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === "chat" && report && (
          <div className="py-16">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Chat with your PDF
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Ask questions about the content of your PDF and get instant
                answers.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <Chat
                  vc={getVCPersonality(selectedVCStyle)}
                  slideAnalysis={report}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
