"use client";

import { ReactNode } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export function StripeWrapper({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
