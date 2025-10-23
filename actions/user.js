"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    // Check if user exists in DB
    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If not found, create a new one
    if (!user) {
      const clerkUser = await currentUser(); // ✅ fetch Clerk data

      user = await db.user.create({
        data: {
          clerkUserId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
          name: clerkUser?.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`
            : "User",
          imageUrl: clerkUser?.imageUrl || "",
          industry: data.industry || null,
          experience: data.experience || null,
          bio: data.bio || "",
          skills: Array.isArray(data.skills)
            ? data.skills
            : data.skills?.split(",").map((s) => s.trim()) || [],
        },
      });
    }

    // Generate AI insights *before* starting transaction (to avoid timeout)
    let insightsData = null;
    let industryInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    if (!industryInsight) {
      insightsData = await generateAIInsights(data.industry);
    }

    const result = await db.$transaction(async (tx) => {
      // Create insight only if missing
      if (!industryInsight && insightsData) {
        industryInsight = await tx.industryInsight.create({
          data: {
            industry: data.industry,
            ...insightsData,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          industry: data.industry,
          experience: data.experience,
          bio: data.bio,
          skills: Array.isArray(data.skills)
            ? data.skills
            : data.skills?.split(",").map((s) => s.trim()) || [],
        },
      });

      return { updatedUser, industryInsight };
    });

    return { success: true, ...result };
  } catch (error) {
    console.error("Error updating/creating user:", error.message);
    throw new Error("Failed to update profile: " + error.message);
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });

    if (!user) {
      const clerkUser = await currentUser();

      await db.user.create({
        data: {
          clerkUserId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
          name: clerkUser?.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`
            : "User",
          imageUrl: clerkUser?.imageUrl || "",
          industry: null,
          experience: null,
          bio: "",
          skills: [],
        },
      });

      return { isOnboarded: false };
    }

    return { isOnboarded: !!user.industry };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
    throw new Error("Failed to check onboarding status: " + error.message);
  }
}
