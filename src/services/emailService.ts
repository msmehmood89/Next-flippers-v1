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
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, otp, type }),
      });
      
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (response.ok && isJson) {
        return await response.json();
      }

      if (!response.ok && isJson) {
        const data = await response.json();
        return { error: data.error || `Server Error (${response.status})` };
      }

      // Handle non-JSON or unexpected responses
      const text = await response.text();
      console.error("API Response Error:", { status: response.status, contentType, body: text.substring(0, 200) });

      if (response.status === 200 && !isJson) {
        return { error: "Network redirection detected. Please refresh the page and try again." };
      }

      return { error: `Server communication failed (${response.status}). Please contact support.` };
    } catch (err: any) {
      console.error("OTP email service fatal error:", err);
      return { error: 'Network error: Connection to server was interrupted. Please check your connection.' };
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
