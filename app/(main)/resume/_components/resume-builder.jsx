"use client";

import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent || "");
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("edit");
  const [isMarkdownEdited, setIsMarkdownEdited] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  useEffect(() => {
    if (isMarkdownEdited) return;
    if (activeTab === "edit" || resumeMode === "preview") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent || initialContent || "");
    }
  }, [formValues, activeTab, resumeMode, initialContent]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter)
      parts.push(`🐦 [Twitter](${contactInfo.twitter})`);
    return parts.length > 0
      ? `# ${user?.fullName || "Your Name"}\n\n${parts.join(" | ")}`
      : `# ${user?.fullName || "Your Name"}`;
  };

  // ✅ Generate PDF properly from Markdown preview
  const generatePDF = async () => {
  try {
    setIsGenerating(true);

    // Force the preview to render
    setActiveTab("preview");
    setResumeMode("preview");
    await new Promise((r) => setTimeout(r, 800));

    const previewElement = document.querySelector(".wmde-markdown");
    if (!previewElement) {
      toast.error("Resume preview not found.");
      return;
    }

    // Clone node to render offscreen with full height
    const clone = previewElement.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    clone.style.left = "0";
    clone.style.width = "794px"; // A4 width (approx 210mm)
    clone.style.background = "#ffffff";
    clone.style.color = "#000000";
    clone.style.padding = "32px";
    clone.style.overflow = "visible";
    document.body.appendChild(clone);

    // Wait to ensure styles applied
    await new Promise((r) => setTimeout(r, 400));

    // Capture full clone as PNG
    const imgData = await domtoimage.toPng(clone, {
      quality: 1,
      bgcolor: "#ffffff",
      style: { transform: "scale(1)" },
    });

    document.body.removeChild(clone);

    // Generate PDF and fit the full height
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
      // If content exceeds one page, split vertically
      let remainingHeight = pdfHeight;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imgData;

      await new Promise((resolve) => {
        img.onload = async () => {
          const scale = pdfWidth / img.width;
          const scaledHeight = img.height * scale;

          canvas.width = img.width;
          canvas.height = pageHeight / scale;

          while (remainingHeight > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
              img,
              0,
              position / scale,
              img.width,
              canvas.height,
              0,
              0,
              canvas.width,
              canvas.height
            );
            const partImg = canvas.toDataURL("image/png");
            pdf.addImage(partImg, "PNG", 0, 0, pdfWidth, pageHeight);
            remainingHeight -= pageHeight;
            position += pageHeight;
            if (remainingHeight > 0) pdf.addPage();
          }
          resolve();
        };
      });
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("resume.pdf");
    toast.success("PDF downloaded successfully!");
  } catch (err) {
    console.error("PDF Generation Error:", err);
    toast.error("Failed to generate PDF.");
  } finally {
    setIsGenerating(false);
  }
};


  // ✅ Save button logic fixed
  const onSubmit = async () => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
      await saveResumeFn(formattedContent);
      toast.success("Resume saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save resume.");
    }
  };

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className="space-x-2">
          <Button
            variant="destructive"
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>

          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>

        {/* === FORM TAB === */}
        <TabsContent value="edit">
          <form id="resume-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <label>Email</label>
                  <Input {...register("contactInfo.email")} placeholder="your@email.com" />
                </div>
                <div>
                  <label>Mobile</label>
                  <Input {...register("contactInfo.mobile")} placeholder="+91 9876543210" />
                </div>
                <div>
                  <label>LinkedIn</label>
                  <Input {...register("contactInfo.linkedin")} placeholder="https://linkedin.com/in/your-profile" />
                </div>
                <div>
                  <label>Twitter</label>
                  <Input {...register("contactInfo.twitter")} placeholder="https://twitter.com/your-handle" />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => <Textarea {...field} className="h-32" placeholder="Write your professional summary..." />}
              />
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => <Textarea {...field} className="h-32" placeholder="List your key skills..." />}
              />
            </div>

            {/* Experience, Education, Projects */}
            <Controller name="experience" control={control} render={({ field }) => (
              <EntryForm type="Experience" entries={field.value} onChange={field.onChange} />
            )} />
            <Controller name="education" control={control} render={({ field }) => (
              <EntryForm type="Education" entries={field.value} onChange={field.onChange} />
            )} />
            <Controller name="projects" control={control} render={({ field }) => (
              <EntryForm type="Project" entries={field.value} onChange={field.onChange} />
            )} />
          </form>
        </TabsContent>

        {/* === MARKDOWN TAB === */}
        <TabsContent value="preview">
          <div className="mb-2 flex items-center gap-2">
            <Button
              variant="link"
              type="button"
              onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" /> Edit Markdown
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" /> Show Preview
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setPreviewContent(getCombinedContent());
                setIsMarkdownEdited(false);
                toast("Markdown reset to form data");
              }}
            >
              Reset Markdown
            </Button>
          </div>

          <div className="border rounded-lg mb-6 p-4 bg-white">
            <MDEditor
              value={previewContent}
              onChange={(val) => {
                setPreviewContent(val ?? "");
                setIsMarkdownEdited(true);
              }}
              height={400}
              preview={resumeMode}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
