import { Chat } from "./components/Chat";
import { DeckUploader } from "./components/DeckUploader";
import { VC_PERSONALITIES } from "./data/vcs";
import { analyzeSlides } from "./utils/analyzeSlides";
import { useState } from "react";

type VCStyle = "skeptic" | "numbers_hawk" | "operator";

function App() {
  const [report, setReport] = useState("");
  const [selectedVCStyle, setSelectedVCStyle] = useState<VCStyle>("skeptic");
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleExtractedSlides = async (slides: string[]) => {
    const result = await analyzeSlides(slides, selectedVCStyle);
    setReport(result);
    setAnalysisComplete(true);
  };

  const handleUploadStart = () => {
    setReport("");
    setAnalysisComplete(false);
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

  const getVCStyleLabel = (style: VCStyle): string => {
    switch (style) {
      case "skeptic":
        return "Skeptic - Challenges assumptions";
      case "numbers_hawk":
        return "Numbers Hawk - Obsessed with unit economics";
      case "operator":
        return "Operator - Focused on execution & traction";
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Pitch Deck Analyzer</h1>

      {/* Investor Personality Dropdown */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <label
          htmlFor="vc-style"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Choose Investor Personality
        </label>
        <select
          id="vc-style"
          value={selectedVCStyle}
          onChange={(e) => setSelectedVCStyle(e.target.value as VCStyle)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          disabled={analysisComplete}
        >
          <option value="skeptic">{getVCStyleLabel("skeptic")}</option>
          <option value="numbers_hawk">
            {getVCStyleLabel("numbers_hawk")}
          </option>
          <option value="operator">{getVCStyleLabel("operator")}</option>
        </select>
        {analysisComplete && (
          <p className="text-xs text-gray-500 mt-1">
            Upload a new deck to change investor personality
          </p>
        )}
      </div>

      <DeckUploader
        onExtract={handleExtractedSlides}
        onUploadStart={handleUploadStart}
      />

      <div className="mt-8 whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded shadow">
        {report || "Upload a deck to get analysis."}
      </div>

      {report && analysisComplete && (
        <>
          <div className="mt-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Now chatting with:</strong>{" "}
              {getVCPersonality(selectedVCStyle).name}{" "}
              {getVCPersonality(selectedVCStyle).avatar}
            </p>
          </div>
          <Chat vc={getVCPersonality(selectedVCStyle)} slideAnalysis={report} />
        </>
      )}
    </div>
  );
}

export default App;
