"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, CreditCard } from "lucide-react";

interface PaymentSectionProps {
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  isSubmitting: boolean;
}

export default function PaymentSection({ onPaymentMethodCreated, isSubmitting }: PaymentSectionProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleCreatePaymentMethod() {
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setProcessing(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message || "カード情報の登録に失敗しました");
      setProcessing(false);
    } else if (paymentMethod) {
      onPaymentMethodCreated(paymentMethod.id);
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-[#c2185b]" />
        <h4 className="text-sm font-bold text-gray-900">クレジットカード情報の登録</h4>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        ご予約の確定にはカードの登録が必要です。施術完了まで決済は行われません。
      </p>

      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: { color: "#9e2146" },
            },
          }}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleCreatePaymentMethod}
        disabled={processing || isSubmitting}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : "カードを保存して次へ"}
      </button>
    </div>
  );
}
