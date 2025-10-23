import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { generateIndustryInsights } from "@/lib/inngest/functions";


export const { GET, POST, PUT } = serve({
     client: inngest,
     functions: [generateIndustryInsights]
 });



// app/api/webhooks/clerk/route.js
// import { db } from "@/lib/prisma";
// import { Webhook } from "svix"; 
// import { headers } from "next/headers";

// export async function POST(req) {
//   const payload = await req.json();
//   const heads = headers();
  
//   const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
//   let event;

//   try {
//     event = wh.verify(JSON.stringify(payload), {
//       "svix-id": heads.get("svix-id"),
//       "svix-timestamp": heads.get("svix-timestamp"),
//       "svix-signature": heads.get("svix-signature"),
//     });
//   } catch (err) {
//     return new Response("Invalid webhook", { status: 400 });
//   }

//   if (event.type === "user.created") {
//     const { id, email_addresses, first_name, last_name } = event.data;

//     await db.user.create({
//       data: {
//         clerkUserId: id,
//         email: email_addresses[0].email_address,
//         name: `${first_name || ""} ${last_name || ""}`,
//       },
//     });
//   }

//   return new Response("Webhook received", { status: 200 });
// }
