"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import CoverLetterPreview from "../_components/cover-letter-preview";
import { getCoverLetter, updateCoverLetter } from "@/actions/cover-letter";

export default function EditCoverLetterPage({ params }) {
  const router = useRouter();

  // Unwrap the params promise
  const resolvedParams = use(params); 
  const { id } = resolvedParams;

  const [coverLetter, setCoverLetter] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchLetter() {
      try {
        const data = await getCoverLetter(id);
        setCoverLetter(data);
        setContent(data?.content || "");
      } catch (err) {
        toast.error(err.message || "Failed to load cover letter");
      } finally {
        setLoading(false);
      }
    }
    fetchLetter();
  }, [id]);

  const handleSave = async () => {
    if (!content) {
      toast.error("Content cannot be empty");
      return;
    }
    try {
      setSaving(true);
      await updateCoverLetter(id, content);
      toast.success("Cover letter updated successfully!");
      router.push("/ai-cover-letter");
    } catch (err) {
      toast.error(err.message || "Failed to update cover letter");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2 mb-6">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <h1 className="text-6xl font-bold gradient-title">
          {coverLetter?.jobTitle} at {coverLetter?.companyName}
        </h1>
      </div>

      <CoverLetterPreview content={content} setContent={setContent} />

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
