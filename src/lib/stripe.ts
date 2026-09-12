import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function createStripeInstance(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' as any });
}

function getStripeInstance(): Stripe | null {
  if (stripeInstance) return stripeInstance;
  stripeInstance = createStripeInstance();
  return stripeInstance;
}

const notConfiguredError = () => {
  throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing).');
};

// Export a proxy that lazily initializes Stripe when a property is accessed.
// This prevents build-time errors while still surfacing clear runtime errors
// when Stripe features are actually used without configuration.
export const stripe = new Proxy(
  {},
  {
    get(_target, prop) {
      const inst = getStripeInstance();
      if (!inst) {
        // If accessing a property, return a function that will throw when called,
        // and also throw on nested property access to keep behavior explicit.
        const thrower = () => notConfiguredError();
        return new Proxy(thrower, {
          apply() {
            return notConfiguredError();
          },
          get() {
            return thrower;
          },
        });
      }
      return (inst as any)[prop];
    },
  }
) as unknown as Stripe;
