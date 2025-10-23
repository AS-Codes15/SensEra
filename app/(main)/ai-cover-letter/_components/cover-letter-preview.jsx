"use client";

import dynamic from "next/dynamic";
import React from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamically import to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const CoverLetterPreview = ({ content, setContent }) => {
  return (
    <div className="py-4" data-color-mode="dark">
      <MDEditor
        value={content}
        onChange={setContent}
        height={500}
      />
    </div>
  );
};

export default CoverLetterPreview;
