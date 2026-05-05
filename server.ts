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

// 1. Send Welcome Email
app.post("/api/email/welcome", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Email and name are required" });

  try {
    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: "Welcome to NextFlippers! 🚀",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h1 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">Welcome, ${name}!</h1>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">We're thrilled to have you join NextFlippers, the premium marketplace for digital assets.</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">You can now browse, buy, and sell verified websites, domains, and tools with ease.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://nextflippers.com/browse" style="background: #4f46e5; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Explore Marketplace</a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">Best regards,<br>The NextFlippers Team</p>
        </div>
      `,
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
    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: `Invoice for Order #${orderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Order Confirmation</h2>
          <p>Thank you for your purchase on NextFlippers.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total Amount:</strong> $${amount}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">If you have any questions, reply to this email or visit our support page.</p>
        </div>
      `,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Failed to send invoice" });
  }
});

// 3. 2FA / Verification OTP
app.post("/api/auth/send-otp", async (req, res) => {
  const { email, otp, type } = req.body; // type: 'verification' | '2fa'
  
  try {
    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: type === '2fa' ? "Your Login Backup Code" : "Verify Your Email",
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2 style="color: #4f46e5;">${type === '2fa' ? 'Login Verification' : 'Welcome to NextFlippers'}</h2>
          <p>Your ${type === '2fa' ? 'one-time password' : 'verification code'} is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes.</p>
        </div>
      `,
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
    const { data, error } = await resend.emails.send({
      from: "NextFlippers <support@nextflippers.com>",
      to: [email],
      subject: `Your ${type} has been approved! 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Good News!</h2>
          <p>Your ${type} "<strong>${title}</strong>" has been reviewed and approved by our admin team.</p>
          <p>It is now live on the marketplace and visible to potential buyers.</p>
          <div style="margin: 30px 0;">
            <a href="https://nextflippers.com/browse" style="background: #4f46e5; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View in Marketplace</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Thank you for being a part of NextFlippers!</p>
        </div>
      `,
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
