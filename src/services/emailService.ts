/**
 * Frontend service to interact with our Express backend for sending emails.
 */

const getApiUrl = () => {
  // Use explicitly provided API URL if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  return '';
};

const BASE_URL = getApiUrl();

async function apiFetch(path: string, options: RequestInit) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
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

    const text = await response.text();
    console.error("API Response Error:", { 
      status: response.status, 
      contentType, 
      url,
      body: text.substring(0, 200) 
    });

    if (response.status === 200 && (contentType.includes("text/html") || text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html"))) {
      return { 
        error: `Routing Error: The request to ${url} returned an HTML page instead of API response. ` +
               `This happens when your frontend is at ${window.location.host} but your backend is not reachable at that same domain. ` +
               `If hosting on Hostinger, please set VITE_API_URL in your environment to point to your AI Studio Shared App URL.`
      };
    }

    return { error: `Server communication failed (${response.status}).` };
  } catch (err: any) {
    console.error(`API Fatal Error (${path}):`, err);
    return { error: `Network error: Could not reach the backend at ${url}.` };
  }
}

export const emailService = {
  sendWelcome: async (email: string, name: string) => {
    return apiFetch('/api/email/welcome', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  sendOTP: async (email: string, otp: string, type: 'verification' | '2fa' = 'verification') => {
    return apiFetch('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, type }),
    });
  },

  sendInvoice: async (email: string, orderData: { orderId: string, amount: string, items: any[] }) => {
    return apiFetch('/api/email/invoice', {
      method: 'POST',
      body: JSON.stringify({ email, ...orderData }),
    });
  },

  sendApproval: async (email: string, title: string, type: 'listing' | 'gig') => {
    return apiFetch('/api/email/approval', {
      method: 'POST',
      body: JSON.stringify({ email, title, type }),
    });
  },
  
  sendResetPassword: async (email: string, resetLink: string) => {
    return apiFetch('/api/email/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetLink }),
    });
  }
};
