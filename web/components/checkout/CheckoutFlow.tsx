"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CheckoutProgress from "./CheckoutProgress";
import CheckoutSidebar from "./CheckoutSidebar";
import CheckoutStep1, { type Step1Data } from "./CheckoutStep1";
import CheckoutStep2, { type Step2Data } from "./CheckoutStep2";
import CheckoutStep3 from "./CheckoutStep3";

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  serviceSlug: string;
  serviceName: string;
  servicePrice: number;
  recurring?: boolean;
  product?: string;
}

type CheckoutData = Step1Data & Step2Data;

const INITIAL_STEP1: Step1Data = {
  name: "",
  email: "",
  phone: "",
};

const INITIAL_STEP2: Step2Data = {
  company_name: "",
  company_website: "",
  company_sector: "",
  project_description: "",
  project_objectives: "",
  timeline: "",
};

export default function CheckoutFlow({
  isOpen,
  onClose,
  serviceSlug,
  serviceName,
  servicePrice,
  recurring,
}: CheckoutFlowProps) {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>(INITIAL_STEP1);
  const [step2Data, setStep2Data] = useState<Step2Data>(INITIAL_STEP2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, loading, onClose]);

  // Save partial progress
  const saveProgress = useCallback(
    async (currentStep: number) => {
      try {
        await fetch("/api/checkout-flow", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: currentStep,
            ...step1Data,
            ...step2Data,
            service_slug: serviceSlug,
          }),
        });
      } catch {
        // Silently fail — partial progress is best-effort
      }
    },
    [step1Data, step2Data, serviceSlug]
  );

  const handleStep1Next = useCallback(() => {
    setStep(2);
    void saveProgress(1);
  }, [saveProgress]);

  const handleStep2Next = useCallback(() => {
    setStep(3);
    void saveProgress(2);
  }, [saveProgress]);

  const handleStep2Back = useCallback(() => {
    setStep(1);
  }, []);

  const handleStep3Back = useCallback(() => {
    setStep(2);
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1Data,
          ...step2Data,
          service_slug: serviceSlug,
          service_name: serviceName,
          service_price: servicePrice,
          recurring: recurring ?? false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          (result as { error?: string }).error || "Error al crear la sesion de pago"
        );
      }

      const { url } = result as { url: string };

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No se recibio la URL de pago");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado. Intentalo de nuevo."
      );
      setLoading(false);
    }
  }, [step1Data, step2Data, serviceSlug, serviceName, servicePrice, recurring]);

  // Reset on close
  const handleClose = useCallback(() => {
    if (loading) return;
    setStep(1);
    setStep1Data(INITIAL_STEP1);
    setStep2Data(INITIAL_STEP2);
    setError(null);
    onClose();
  }, [loading, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-4 mt-8 mb-8 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-3xl bg-pacame-black border border-white/[0.06] shadow-apple-xl"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-pacame-white/50 hover:text-pacame-white transition-colors disabled:opacity-30"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left — Form area */}
          <div className="flex-1 p-8 lg:p-12">
            <CheckoutProgress currentStep={step} />

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-alert/10 border border-rose-alert/20 text-sm font-body text-rose-alert"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <CheckoutStep1
                  data={step1Data}
                  onChange={setStep1Data}
                  onNext={handleStep1Next}
                />
              )}
              {step === 2 && (
                <CheckoutStep2
                  data={step2Data}
                  onChange={setStep2Data}
                  onNext={handleStep2Next}
                  onBack={handleStep2Back}
                />
              )}
              {step === 3 && (
                <CheckoutStep3
                  data={{
                    name: step1Data.name,
                    email: step1Data.email,
                    phone: step1Data.phone,
                    company_name: step2Data.company_name,
                    company_sector: step2Data.company_sector,
                    timeline: step2Data.timeline,
                  }}
                  serviceName={serviceName}
                  servicePrice={servicePrice}
                  recurring={recurring}
                  onBack={handleStep3Back}
                  onConfirm={handleConfirm}
                  loading={loading}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Right — Sidebar (hidden on mobile for step 1, shown for steps 2+3) */}
          <div
            className={`lg:w-[360px] shrink-0 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-white/[0.06] ${
              step === 1 ? "hidden lg:block" : "block"
            }`}
          >
            <CheckoutSidebar
              serviceName={serviceName}
              servicePrice={servicePrice}
              recurring={recurring}
              collapsed={step === 1}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
