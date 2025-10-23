"use client";

import { useState } from "react";
import CoverLetterPreview from "../_components/cover-letter-preview";
import { Button } from "@/components/ui/button";

export default function NewCoverLetterPage() {
  const [content, setContent] = useState("Start typing your cover letter here...");

  const handleSave = () => {
    console.log("Saved content:", content);
    // Here you can call your save API
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <h1 className="text-4xl font-bold gradient-title">Create Cover Letter</h1>

      <CoverLetterPreview content={content} setContent={setContent} />

      <Button onClick={handleSave}>Save / Submit Cover Letter</Button>
    </div>
  );
}


