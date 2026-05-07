import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// Helper for consistent premium email styling
const getEmailTemplate = (title: string, content: string, ctaText?: string, ctaLink?: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { background-color: #f4f7fa; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 24px; overflow: hidden; margin-top: 40px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 20px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; text-decoration: none; display: inline-flex; align-items: center; }
        .content { padding: 48px; }
        h1 { color: #1e293b; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 24px; letter-spacing: -0.02em; line-height: 1.2; }
        p { color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 24px; }
        .button-container { padding: 12px 0 32px; text-align: center; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 16px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
        .highlight { color: #4f46e5; font-weight: 700; }
        .otp-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 20px; padding: 32px; text-align: center; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #0f172a; margin: 32px 0; font-family: 'Courier New', Courier, monospace; }
        .footer { max-width: 600px; margin: 0 auto; padding: 32px 20px; text-align: center; }
        .footer-text { color: #94a3b8; font-size: 13px; line-height: 1.6; }
        .footer-links { margin-top: 16px; }
        .footer-links a { color: #6366f1; text-decoration: none; font-weight: 600; margin: 0 12px; }
        .badge { display: inline-block; padding: 6px 14px; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main">
          <div class="header">
            <a href="https://nextflippers.com" class="logo-text">
              NEXTFLIPPERS
            </a>
          </div>
          <div class="content">
            <div class="badge">Professional Marketplace</div>
            <h1>${title}</h1>
            ${content}
            ${ctaText && ctaLink ? `
              <div class="button-container">
                <a href="${ctaLink}" class="button">${ctaText}</a>
              </div>
            ` : ''}
            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 14px; color: #64748b; margin-bottom: 0;"> Best Regards,<br><strong>The NextFlippers Team</strong></p>
            </div>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">
            © ${new Date().getFullYear()} NextFlippers Marketplace. All rights reserved.<br>
            Empowering digital entrepreneurs worldwide.
          </p>
          <div class="footer-links">
            <a href="https://nextflippers.com/browse">Marketplace</a>
            <a href="https://nextflippers.com/dashboard">Dashboard</a>
            <a href="mailto:support@nextflippers.com">Support</a>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

// 1. Send Welcome Email
app.post("/api/email/welcome", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Email and name are required" });

  try {
    const html = getEmailTemplate(
      `Welcome, ${name}!`,
      `<p>We're thrilled to have you join <span class="highlight">NextFlippers</span>, the premium marketplace for digital assets. You can now browse, buy, and sell verified websites, domains, and tools with global confidence.</p>
       <p>Whether you're looking to acquire your next venture or exit a successful project, we're here to help you every step of the way.</p>`,
      "Explore Marketplace",
      "https://nextflippers.com/browse"
    );

    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: "Welcome to NextFlippers! 🚀",
      html,
    });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 2. Send Invoice Email
app.post("/api/email/invoice", async (req, res) => {
  const { email, orderId, amount, items } = req.body;
  
  try {
    const itemsHtml = items && Array.isArray(items) 
      ? `
        <div style="margin: 24px 0; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; background: #ffffff;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
                <th style="text-align: left; padding: 12px 16px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Asset</th>
                <th style="text-align: right; padding: 12px 16px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 16px; font-size: 15px; font-weight: 600; color: #1e293b;">${item.title}</td>
                  <td style="padding: 16px; text-align: right; font-size: 15px; color: #1e293b;">$${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 16px; font-weight: 700; color: #0f172a; font-size: 16px;">Total Paid</td>
                <td style="padding: 16px; text-align: right; font-weight: 700; color: #4f46e5; font-size: 18px;">$${amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
      : `<div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
           <p style="margin: 0; font-size: 14px;">Total Amount Paid</p>
           <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #0f172a;">$${amount}</p>
         </div>`;

    const html = getEmailTemplate(
      "Payment Confirmation",
      `<p>Thank you for your purchase! We have received your payment for order <span class="highlight">#${orderId}</span>.</p>
       ${itemsHtml}
       <p>You can now manage your assets and start the transfer process from your dashboard. Our support team is ready to assist if you need any help.</p>`,
      "View My Dashboard",
      "https://nextflippers.com/dashboard"
    );

    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: `Order Confirmation #${orderId} - NextFlippers`,
      html,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Failed to send invoice" });
  }
});

// 3. 2FA / Verification OTP
app.post("/api/auth/send-otp", async (req, res) => {
  const { email, otp, type } = req.body;
  
  try {
    const title = type === '2fa' ? "Security Verification" : "Verify Your Email";
    const content = `<p>Please use the following single-use code to ${type === '2fa' ? 'secure your login' : 'complete your registration'} on NextFlippers.</p>
                     <div class="otp-box">${otp}</div>
                     <p style="font-size: 14px; text-align: center;">This code will expire in <span class="highlight">10 minutes</span>. If you didn't request this code, please ignore this email.</p>`;

    const html = getEmailTemplate(title, content);

    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: type === '2fa' ? "NextFlippers: Login Verification Code" : "Verify your account",
      html,
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// 4. Listing/Gig Approval Notification
app.post("/api/email/approval", async (req, res) => {
  const { email, title, type } = req.body;
  
  try {
    const html = getEmailTemplate(
      "Review Approved!",
      `<p>Your ${type} "<span class="highlight">${title}</span>" has been reviewed and approved by our moderation team.</p>
       <p>It is now live on the marketplace and visible to potential buyers globally. We wish you a successful sale!</p>`,
      `View Your ${type}`,
      "https://nextflippers.com/browse"
    );

    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: `Your ${type} is live! 🎉`,
      html,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Failed to send approval email" });
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
