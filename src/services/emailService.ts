/**
 * Frontend service to interact with our Express backend for sending emails.
 */

export const emailService = {
  /**
   * Sends a welcome email to a new user.
   */
  sendWelcome: async (email: string, name: string) => {
    try {
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      return await response.json();
    } catch (err) {
      console.error("Welcome email service error:", err);
      return { error: true };
    }
  },

  /**
   * Sends an OTP for verification or 2FA.
   */
  sendOTP: async (email: string, otp: string, type: 'verification' | '2fa' = 'verification') => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, type }),
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
          return { error: data.error || 'Failed to send OTP' };
        }
        return data;
      } else {
        // Fallback for HTML error pages (e.g. 404/500 from server)
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 500));
        return { error: `Server error (${response.status}). Please try again later.` };
      }
    } catch (err: any) {
      console.error("OTP email service error:", err);
      return { error: 'Network error: Please check your internet connection' };
    }
  },

  /**
   * Sends an invoice after a successful order.
   */
  sendInvoice: async (email: string, orderData: { orderId: string, amount: string, items: any[] }) => {
    try {
      const response = await fetch('/api/email/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...orderData }),
      });
      return await response.json();
    } catch (err) {
      console.error("Invoice email service error:", err);
      return { error: true };
    }
  },

  /**
   * Sends an approval notification for a listing or gig.
   */
  sendApproval: async (email: string, title: string, type: 'listing' | 'gig') => {
    try {
      const response = await fetch('/api/email/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, title, type }),
      });
      return await response.json();
    } catch (err) {
      console.error("Approval email service error:", err);
      return { error: true };
    }
  }
};
