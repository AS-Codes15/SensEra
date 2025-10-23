"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "HIGH" | "MEDIUM" | "LOW",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }

    IMPORTANT:
    - Respond with ONLY valid JSON
    - No explanations, comments, or markdown
    - Include at least 5 roles, 5 skills, and 5 trends
    - Growth rate must be a percentage number
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  try {
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("Failed to parse Gemini response:", cleanedText, err);
    throw new Error("Invalid AI response format");
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  const now = new Date();
  const intervalDays = 7;
  const nextUpdate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  if (!user.industryInsight) {
    // Case 1: No insights yet → create
    const insights = await generateAIInsights(user.industry);
    return await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        lastUpdated: now,
        nextUpdate,
      },
    });
  }

  if (user.industryInsight.nextUpdate < now) {
    // Case 2: Expired → regenerate
    const insights = await generateAIInsights(user.industry);
    return await db.industryInsight.update({
      where: { id: user.industryInsight.id },
      data: {
        ...insights,
        lastUpdated: now,
        nextUpdate,
      },
    });
  }

  // Case 3: Still valid
  return user.industryInsight;
}
