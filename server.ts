import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";

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
  res.json({ 
    status: "ok", 
    emailEnabled: !!resend,
    detectedKeys: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE: !!process.env.STRIPE
    },
    timestamp: new Date().toISOString()
  });
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
        body { background-color: #f8fafc; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 20px; overflow: hidden; margin-top: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 40px 20px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.04em; text-decoration: none; text-transform: uppercase; }
        .content { padding: 48px 40px; }
        .badge { display: inline-block; padding: 6px 12px; background: #f1f5f9; color: #475569; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
        h1 { color: #0f172a; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 20px; letter-spacing: -0.02em; line-height: 1.2; }
        p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .button-container { padding: 8px 0 32px; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
        .highlight { color: #4f46e5; font-weight: 700; }
        .otp-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0f172a; margin: 32px 0; font-family: 'Courier New', Courier, monospace; }
        .footer { max-width: 600px; margin: 0 auto; padding: 32px 20px; text-align: center; }
        .footer-text { color: #94a3b8; font-size: 13px; line-height: 1.6; }
        .footer-links { margin-top: 16px; }
        .footer-links a { color: #64748b; text-decoration: none; font-weight: 500; margin: 0 10px; font-size: 13px; }
        .divider { border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 32px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <a href="https://nextflippers.com" class="logo-text">NEXTFLIPPERS</a>
          </div>
          <div class="content">
            <div class="badge">Marketplace Update</div>
            <h1>${title}</h1>
            ${content}
            ${ctaText && ctaLink ? `
              <div class="button-container">
                <a href="${ctaLink}" class="button">${ctaText}</a>
              </div>
            ` : ''}
            <div class="divider">
              <p style="font-size: 14px; color: #94a3b8; margin-bottom: 0;">Kind Regards,<br><strong>Team NextFlippers</strong></p>
            </div>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">
            &copy; ${new Date().getFullYear()} NextFlippers. All rights reserved.<br>
            The premium destination for digital asset acquisitions.
          </p>
          <div class="footer-links">
            <a href="https://nextflippers.com/privacy">Privacy Policy</a>
            <a href="https://nextflippers.com/terms">Terms</a>
            <a href="https://nextflippers.com/contact">Contact Us</a>
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
    console.error("OTP Email Error:", error.message || error);
    res.status(500).json({ error: error.message || "Failed to send verification email" });
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
