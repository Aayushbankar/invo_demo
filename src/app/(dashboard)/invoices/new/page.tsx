"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { VoiceInput } from "@/components/ai/voice-input";
import { Sparkles, PenLine } from "lucide-react";
import { toast } from "sonner";
import type { CreateInvoiceInput } from "@/schemas/invoice";

const EXAMPLE_PROMPTS = [
  "Generate an invoice for Ruturaj Rathod. Items: Bicycle ₹500, Helmet ₹200. Tax 18%. Payment due in 15 days.",
  "Create an invoice for Acme Corp. 10 hours of consulting at $150/hour. Tax 10%. Net 30.",
  "Invoice for John Smith - Website redesign $2500, Logo design $500. No tax. Due in 7 days.",
];

export default function NewInvoicePage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<CreateInvoiceInput | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const { data, usage } = await res.json();

      const invoiceData: CreateInvoiceInput = {
        customer_name: data.customer.name,
        customer_email: data.customer.email ?? "",
        customer_phone: data.customer.phone ?? "",
        customer_address: data.customer.address ?? "",
        currency: data.currency,
        tax_rate: data.tax,
        discount: data.discount,
        notes: data.notes ?? "",
        due_date: new Date(
          Date.now() + data.payment_due_days * 86400000
        )
          .toISOString()
          .split("T")[0],
        status: "draft",
        items: data.items.map(
          (item: { name: string; description: string | null; price: number; quantity: number }) => ({
            name: item.name,
            description: item.description ?? "",
            quantity: item.quantity,
            unit_price: item.price,
          })
        ),
      };

      setGeneratedData(invoiceData);
      toast.success(
        `Invoice generated! Used ${usage.total_tokens.toLocaleString()} tokens`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  function handleVoiceTranscript(text: string) {
    setPrompt((prev) => (prev ? prev + " " + text : text));
  }

  async function handleSave(data: CreateInvoiceInput) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Failed to save invoice");
      return;
    }

    const invoice = await res.json();
    toast.success("Invoice saved!");
    router.push(`/invoices/${invoice.id}`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">AI Invoice Generator</h1>
        <p className="text-muted-foreground">
          Describe your invoice in natural language or use voice input
        </p>
      </div>

      {!generatedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Invoice
            </CardTitle>
            <CardDescription>
              Describe the invoice details and AI will extract the structured data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="e.g., Generate an invoice for Ruturaj Rathod. Items: Bicycle ₹500, Helmet ₹200. Tax 18%. Payment due in 15 days."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <div className="absolute bottom-3 right-3">
                <VoiceInput onTranscript={handleVoiceTranscript} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPrompt(example)}
                >
                  <PenLine className="mr-1 h-3 w-3" />
                  Example {i + 1}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Invoice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {(generatedData || !generating) && (
        <InvoiceForm
          initialData={generatedData ?? undefined}
          onSave={handleSave}
          onCancel={() => setGeneratedData(null)}
          showCancel={!!generatedData}
        />
      )}
    </div>
  );
}
