import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Stripe (Lazy initialization is better, but this handles basic setup)
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

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
      <style>
        .container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; }
        .logo { font-size: 24px; font-weight: 800; color: #4f46e5; text-decoration: none; margin-bottom: 30px; display: block; letter-spacing: -0.02em; }
        .card { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); }
        h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.02em; }
        p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; transition: all 0.2s; }
        .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer-text { color: #94a3b8; font-size: 13px; line-height: 1.4; }
        .highlight { color: #4f46e5; font-weight: 600; }
        .otp-box { background: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e293b; margin: 30px 0; border: 1px dashed #e2e8f0; }
      </style>
    </head>
    <body style="background-color: #f8fafc; margin: 0; padding: 0;">
      <div class="container">
        <a href="https://nextflippers.com" class="logo">NextFlippers</a>
        <div class="card">
          <h1>${title}</h1>
          ${content}
          ${ctaText && ctaLink ? `
            <div style="margin-top: 32px; text-align: center;">
              <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p class="footer-text">
            © ${new Date().getFullYear()} NextFlippers Marketplace. All rights reserved.<br>
            If you have any questions, contact us at support@nextflippers.com
          </p>
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

// 5. Stripe Checkout Session
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  const { items, successUrl, cancelUrl, customerEmail } = req.body;
  console.log(`[Stripe] Creating session for ${customerEmail}. Items:`, items?.length);
  
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    console.error("[Stripe] Secret key not found.");
    return res.status(500).json({ error: "Stripe configuration missing on server." });
  }

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided for checkout.");
    }

    const lineItems = items.map((item: any, index: number) => {
      const priceVal = parseFloat(item.price);
      if (isNaN(priceVal) || priceVal <= 0) {
        throw new Error(`Invalid price for item ${index + 1}: ${item.title || 'Unknown'}`);
      }
      
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title || "Digital Asset",
            images: item.image && item.image.startsWith('http') && item.image.length < 2000 ? [item.image] : [],
          },
          unit_amount: Math.round(priceVal * 1.07 * 100), 
        },
        quantity: 1,
      };
    });

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
    });

    console.log(`[Stripe] Session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe] Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to create Stripe session" });
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
