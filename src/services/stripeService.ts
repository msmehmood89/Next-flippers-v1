import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const stripeService = {
  createCheckoutSession: async (items: any[], userEmail: string, txIds?: string) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerEmail: userEmail,
          successUrl: `${window.location.origin}/dashboard/purchases?status=success${txIds ? `&txIds=${txIds}` : ''}`,
          cancelUrl: `${window.location.origin}/payment/instructions?status=cancel${txIds ? `&txIds=${txIds}` : ''}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Stripe Service Error:', error);
      throw error;
    }
  },
};
