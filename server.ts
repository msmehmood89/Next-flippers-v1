import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Resend with fallback for common user mistakes in naming secrets
const resendApiKey = process.env.RESEND_API_KEY || process.env.STRIPE_SECRET_KEY || process.env.STRIPE;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resend) {
  console.warn("WARNING: Resend API Key is missing. Email features will be disabled.");
}

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  console.log("Health check requested from:", forwardedHost);
  res.json({ 
    status: "ok", 
    emailEnabled: !!resend,
    detectedKeys: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE: !!process.env.STRIPE
    },
    hostname: req.hostname,
    protocol: req.protocol,
    forwardedHost,
    timestamp: new Date().toISOString()
  });
});

// Log all API requests for debugging
app.use("/api", (req, res, next) => {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - From: ${forwardedHost} - IP: ${req.ip}`);
  next();
});

// Check if Resend is configured
const checkResend = () => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured. Please add it to your secrets (Gear Icon -> Secrets).");
  }
};

// --- API ROUTES ---

// Helper for consistent premium email styling
const getEmailTemplate = (title: string, content: string, ctaText?: string, ctaLink?: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { background-color: #f4f7f6; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f6; padding-bottom: 60px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 32px; overflow: hidden; margin-top: 60px; border: 1px solid #e2e8f0; box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 50px 20px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.05em; text-decoration: none; text-transform: uppercase; }
        .content { padding: 60px 50px; }
        .badge { display: inline-block; padding: 8px 16px; background: #f0fdf4; color: #16a34a; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 30px; border: 1px solid #dcfce7; }
        h1 { color: #0f172a; font-size: 32px; font-weight: 900; margin-top: 0; margin-bottom: 24px; letter-spacing: -0.03em; line-height: 1.1; }
        p { color: #4b5563; font-size: 17px; line-height: 1.7; margin-bottom: 28px; }
        .button-container { padding: 10px 0 40px; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 17px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.3); }
        .highlight { color: #4f46e5; font-weight: 800; }
        .divider { border-top: 2px solid #f8fafc; margin-top: 50px; padding-top: 40px; }
        .footer { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        .footer-text { color: #94a3b8; font-size: 13px; font-weight: 500; line-height: 1.6; }
        .footer-links { margin-top: 24px; }
        .footer-links a { color: #64748b; text-decoration: none; font-weight: 700; margin: 0 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <a href="https://nextflippers.com" class="logo-text">NextFlippers</a>
          </div>
          <div class="content">
            <div class="badge">Official Correspondence</div>
            <h1>${title}</h1>
            ${content}
            ${ctaText && ctaLink ? `
              <div class="button-container">
                <a href="${ctaLink}" class="button">${ctaText}</a>
              </div>
            ` : ''}
            <div class="divider">
              <p style="font-size: 15px; color: #475569; margin-bottom: 0;">Best Regards,<br><strong style="color: #0f172a; font-size: 17px;">NextFlippers Team</strong></p>
            </div>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">
            &copy; ${new Date().getFullYear()} NextFlippers Global. All rights reserved.<br>
            The premium destination for the world's finest digital assets.
          </p>
          <div class="footer-links">
            <a href="https://nextflippers.com/privacy">Privacy</a>
            <a href="https://nextflippers.com/terms">Terms</a>
            <a href="https://nextflippers.com/contact">Support</a>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

// 1. Send Welcome Email
app.post("/api/email/welcome", async (req, res) => {
  const { email, name } = req.body;
  
  try {
    checkResend();
    const html = getEmailTemplate(
      `Welcome to the inner circle!`,
      `<p>Hi ${name},</p>
       <p>We're excited to have you at <span class="highlight">NextFlippers</span>. You are now part of a global community of digital entrepreneurs.</p>
       <p>Your account is ready. You can now browse verified listings, setup your portfolio, and start participating in the world's most transparent digital asset marketplace.</p>`,
      "Go to Dashboard",
      "https://nextflippers.com/dashboard"
    );

    const { data, error } = await resend!.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: "Welcome to NextFlippers! 🚀",
      html,
    });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// 5. Password Reset Instructions
app.post("/api/email/reset-password", async (req, res) => {
  const { email, resetLink } = req.body;
  
  try {
    checkResend();
    const html = getEmailTemplate(
      "Password Reset Instructions",
      `<p>Hello,</p>
       <p>We received a request to reset the password associated with your <span class="highlight">NextFlippers</span> account. Security is our top priority, and we're here to help you get back into your account safely.</p>
       <p>Please click the secure link below to proceed with setting a new password. This link will expire in 60 minutes for your protection.</p>
       <p>If you did not initiate this request, please disregard this message or contact our support team if you have concerns about your account security.</p>`,
      "Reset My Password",
      resetLink
    );

    const { data, error } = await resend!.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: "Password Reset Instructions - NextFlippers",
      html,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to send reset email" });
  }
});

// 2. Send Invoice Email
app.post("/api/email/invoice", async (req, res) => {
  const { email, orderId, amount, items } = req.body;
  
  try {
    checkResend();
    const itemsHtml = items && Array.isArray(items) 
      ? `
        <div style="margin: 24px 0; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; background: #ffffff;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
                <th style="text-align: left; padding: 12px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Item Description</th>
                <th style="text-align: right; padding: 12px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 16px; font-size: 14px; font-weight: 500; color: #0f172a;">${item.title}</td>
                  <td style="padding: 16px; text-align: right; font-size: 14px; color: #0f172a;">$${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 16px; font-weight: 600; color: #0f172a;">Total Amount</td>
                <td style="padding: 16px; text-align: right; font-weight: 700; color: #4f46e5; font-size: 18px;">$${amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
      : `<div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
           <p style="margin: 0; font-size: 14px; color: #64748b;">Total Paid</p>
           <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #0f172a;">$${amount}</p>
         </div>`;

    const html = getEmailTemplate(
      "Payment Received",
      `<p>Your payment has been successfully processed for order <span class="highlight">#${orderId}</span>.</p>
       ${itemsHtml}
       <p>The escrow process has been initiated. You can track the progress and communicate with the seller through your transaction dashboard.</p>`,
      "View Order Details",
      "https://nextflippers.com/dashboard"
    );

    const { data, error } = await resend!.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: `Order Confirmation #${orderId} - NextFlippers`,
      html,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to send invoice" });
  }
});

// 3. 2FA / Verification OTP
app.post("/api/auth/send-otp", async (req, res) => {
  const { email, otp, type } = req.body;
  
  try {
    checkResend();
    const title = type === '2fa' ? "Security Code" : "Verification Code";
    const content = `<p>Use the following code to secure your session. This is a sensitive code and should not be shared with anyone.</p>
                     <div class="otp-box">${otp}</div>
                     <p style="font-size: 14px; color: #64748b;">This code is valid for 10 minutes. If you did not initiate this request, please change your password immediately.</p>`;

    const html = getEmailTemplate(title, content);

    const { data, error } = await resend!.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: type === '2fa' ? "NextFlippers Login Code" : "Verify Your Email",
      html,
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    let errorMessage = error.message || error;
    console.error("OTP Email Error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// Send User Feedback Email (Bug Report or Improvement Request)
app.post("/api/email/feedback", async (req, res) => {
  const { type, title, description, userName, userEmail, screenshot } = req.body;
  
  try {
    checkResend();
    
    const feedbackTypeLabel = type === 'bug' ? "Bug Report 🐛" : "Improvement Request 💡";
    const titleEmoji = type === 'bug' ? "🐛" : "💡";
    
    let contentHtml = `
      <p>A new feedback item has been submitted through the NextFlippers platform.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; font-family: sans-serif;">
        <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;"><strong>Submitted By:</strong> ${userName} (${userEmail})</p>
        <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;"><strong>Type:</strong> ${feedbackTypeLabel}</p>
        <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;"><strong>Subject:</strong> ${title}</p>
        <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Description:</strong></p>
        <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #334155;">${description}</div>
      </div>
    `;

    if (screenshot) {
      contentHtml += `
        <div style="margin: 24px 0; font-family: sans-serif;">
          <p style="margin-bottom: 8px; color: #475569; font-size: 14px;"><strong>Attached Screenshot:</strong></p>
          <img src="${screenshot}" style="max-width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; display: block;" alt="Screenshot" />
        </div>
      `;
    }

    const html = getEmailTemplate(
      `${titleEmoji} ${feedbackTypeLabel}`,
      contentHtml,
      "View on Admin Dashboard",
      "https://nextflippers.com/admin"
    );

    const attachments: any[] = [];
    if (screenshot && screenshot.startsWith('data:image/')) {
      const matches = screenshot.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const fileExtension = contentType.split('/')[1] || 'png';
        attachments.push({
          content: base64Data,
          filename: `screenshot_${Date.now()}.${fileExtension}`,
          contentType: contentType
        });
      }
    }

    // Send it to official support and ms.mehmood749@gmail.com
    const { data: emailData, error: emailError } = await resend!.emails.send({
      from: "NextFlippers Feedback <support@nextflippers.com>",
      to: ["support@nextflippers.com", "ms.mehmood749@gmail.com"],
      subject: `[${feedbackTypeLabel.toUpperCase()}] ${title}`,
      html,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    if (emailError) throw emailError;
    res.json({ success: true, data: emailData });
  } catch (error: any) {
    console.error("Feedback Email Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to notify admin via email" });
  }
});

// Global error handler to prevent HTML responses for API errors
app.use("/api", (err: any, req: any, res: any, next: any) => {
  console.error("API error:", err);
  res.status(500).json({ error: "Server Internal Error", details: err.message });
});

// 4. Listing/Gig Approval Notification
app.post("/api/email/approval", async (req, res) => {
  const { email, title, type } = req.body;
  
  try {
    checkResend();
    const html = getEmailTemplate(
      "Your Asset is Live!",
      `<p>Congratulations! Your ${type} "<span class="highlight">${title}</span>" has passed our manual verification process.</p>
       <p>It is now visible to thousands of verified buyers on our global marketplace. Good luck with your sale!</p>`,
      "View My Listing",
      "https://nextflippers.com/browse"
    );

    const { data, error } = await resend!.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: `Your ${type} has been approved! 🎉`,
      html,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to send approval email" });
  }
});

// --- GEMINI AI DESCRIPTION GENERATION ---

let aiClient: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured on the server. Please check your secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

app.post("/api/gemini/generate-description", async (req, res) => {
  const {
    title,
    type,
    category,
    platform,
    askingPrice,
    monthlyRevenue,
    monthlyProfit,
    monthlyTraffic,
    siteAge,
    subscribers,
    watchTime,
    isMonetized,
    followers,
    totalLikes,
    validityPeriod,
    accountType,
    includedAssets,
    extraContext
  } = req.body;

  try {
    const ai = getGeminiClient();
    
    const systemPrompt = `You are an elite, world-class marketplace copywriter specializing in premium digital asset and SaaS acquisitions (such as Flippa, Acquire.com, and Empire Flippers).
Your task is to generate a HIGH-CONVERTING marketplace listing description based on the provided data.

OBJECTIVES:
- Increase buyer interest and instill absolute trust.
- Highlight visual, developmental, and financial strengths professionally.
- Improve perceived value and maximize buyer inquiries.
- Remain STRICTLY factually accurate. Do NOT invent, assume, or extrapolate any numbers or metrics not provided.
- If certain information is omitted, skip those sections completely instead of making assumptions.

WRITING RULES:
- Never invent metrics (revenue, traffic, user count, growth rates).
- Use professional, sophisticated English.
- Focus on benefits and strategic growth opportunities.
- Format content for clean legibility using list points, subheaders, and bolding.
- Prevent sales-pitchy hype (e.g., do NOT say "Mind-blowing", "Insane opportunity", "Get rich quick"). Speak like a trusted advisory broker.`;

    const prompt = `Generate a marketplace listing description for the asset: "${title}"
Platform: ${platform || 'N/A'}
Asset Type: ${type}
Category: ${category || 'N/A'}
Asking Price: ${askingPrice ? '$' + askingPrice : 'Open to offers'}

FINANCIALS & METRICS (Strictly adhere to these if specified):
${monthlyRevenue ? `- Monthly Revenue: $${monthlyRevenue}` : ''}
${monthlyProfit ? `- Monthly Profit: $${monthlyProfit}` : ''}
${monthlyTraffic ? `- Monthly Traffic: ${monthlyTraffic} visitors` : ''}
${siteAge ? `- Asset Age: ${siteAge} years` : ''}
${subscribers ? `- Subscribers: ${subscribers}` : ''}
${watchTime ? `- Watch Time: ${watchTime} hours` : ''}
${isMonetized ? `- Monetization Status: Fully Monetized` : ''}
${followers ? `- Social Followers: ${followers}` : ''}
${totalLikes ? `- Engagement: ${totalLikes} likes/reach` : ''}
${validityPeriod ? `- Period Validity: ${validityPeriod}` : ''}
${accountType ? `- Account Type: ${accountType}` : ''}
${includedAssets && includedAssets.length > 0 ? `- Assets Included: ${includedAssets.join(', ')}` : ''}

USER ADDED CONTEXT:
${extraContext?.businessOverview ? `- Dedicated Business Overview: ${extraContext.businessOverview}` : ''}
${extraContext?.strengths ? `- Strengths: ${extraContext.strengths}` : ''}
${extraContext?.opportunities ? `- Growth Opportunities: ${extraContext.opportunities}` : ''}
${extraContext?.reasonForSelling ? `- Reason for Selling: ${extraContext.reasonForSelling}` : ''}
${extraContext?.idealBuyer ? `- Ideal Buyer Profile: ${extraContext.idealBuyer}` : ''}

Based on this information, generate the description in exactly 5 distinct styles outlined below:

1. Style 1 (Professional Marketplace): Standard top-tier format found on Flippa/Acquire with sections for Short Description, Full Marketplace Description, Key Highlights, Business Overview, Assets Included, Reasons for Selling, and FAQ.
2. Style 3 (Premium Sales Copy): Highly engaging, elegant, persuasive, emphasizing the pain solver, unique value proposition, and customer satisfaction.
3. Style 2 (Investor Focused): Deep analysis of metrics, structural stability, ROI opportunities, operational simplicity, and growth potential.
4. Style 4 (Modern Startup Style): Sleek, minimal, clean typography sections, suitable for SaaS or web3 tech audiences. Consicely highlights Tech stack, Key features, and API capabilities.
5. Style 5 (HTML Rich Listing): Exclusively generate highly structured HTML formatted description using clean metric cards styling with rich CSS, tables, highlight boxes, and colored callouts (compatible with rich description editors). Do NOT output markdown within Style 5 - it must be native HTML inside a wrapper div class="p-6 max-w-4xl mx-auto space-y-6 text-gray-800". Utilize visual cards, highlighted metric headers, key opportunity pills, and high contrast badges.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            style1_professional: { type: Type.STRING, description: "Professional Marketplace listing in Markdown format." },
            style2_investor: { type: Type.STRING, description: "Investor Focused listing in Markdown format." },
            style3_premium: { type: Type.STRING, description: "Premium Sales Copy style in Markdown format." },
            style4_modern: { type: Type.STRING, description: "Modern Startup Style in Markdown format." },
            style5_html: { type: Type.STRING, description: "HTML formatted description utilizing metric layouts, stylized list items and tables." }
          },
          required: ["style1_professional", "style2_investor", "style3_premium", "style4_modern", "style5_html"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(response.text.trim());
    res.json({ success: true, descriptionStyles: data });
  } catch (error: any) {
    console.error("Gemini Description Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI description" });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
