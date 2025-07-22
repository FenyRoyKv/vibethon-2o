import { Chat } from "./components/Chat";
import { DeckUploader } from "./components/DeckUploader";
import { VC_PERSONALITIES } from "./data/vcs";
import { analyzeSlides } from "./utils/analyzeSlides";
import { useState } from "react";

function App() {
  const [report, setReport] = useState("");

  const handleExtractedSlides = async (slides: string[]) => {
    const result = await analyzeSlides(slides);
    setReport(result);
  };

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Pitch Deck Analyzer</h1>
      <DeckUploader onExtract={handleExtractedSlides} />
      <div className="mt-8 whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded shadow">
        {report || "Upload a deck to get analysis."}
      </div>
      {report && <Chat vc={VC_PERSONALITIES.skeptic} />}
    </div>
  );
}

export default App;
