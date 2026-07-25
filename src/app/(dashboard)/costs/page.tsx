"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, Server, Users, FileText } from "lucide-react";
import type { CostBreakdown } from "@/types/costs";

export default function CostsPage() {
  const [inputs, setInputs] = useState({
    server_yearly_cost: 13000,
    monthly_ai_requests: 100,
    avg_tokens_per_request: 500,
    num_users: 10,
    invoices_per_month: 50,
    selected_model: "gpt-4o-mini",
  });
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    const params = new URLSearchParams(
      Object.entries(inputs).map(([k, v]) => [k, String(v)])
    );
    const res = await fetch(`/api/costs?${params}`);
    if (res.ok) {
      setResult(await res.json());
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Cost Calculator</h1>
        <p className="text-muted-foreground">
          Estimate your AI and infrastructure costs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>Adjust the parameters to estimate costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select
                value={inputs.selected_model}
                onValueChange={(v) => { if (v) setInputs({ ...inputs, selected_model: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Server className="h-3 w-3" /> Server Yearly Cost (₹)
              </Label>
              <Input
                type="number"
                value={inputs.server_yearly_cost}
                onChange={(e) =>
                  setInputs({ ...inputs, server_yearly_cost: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Monthly AI Requests</Label>
              <Input
                type="number"
                value={inputs.monthly_ai_requests}
                onChange={(e) =>
                  setInputs({ ...inputs, monthly_ai_requests: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Avg Tokens per Request</Label>
              <Input
                type="number"
                value={inputs.avg_tokens_per_request}
                onChange={(e) =>
                  setInputs({ ...inputs, avg_tokens_per_request: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="h-3 w-3" /> Number of Users
              </Label>
              <Input
                type="number"
                value={inputs.num_users}
                onChange={(e) =>
                  setInputs({ ...inputs, num_users: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> Invoices per Month
              </Label>
              <Input
                type="number"
                value={inputs.invoices_per_month}
                onChange={(e) =>
                  setInputs({ ...inputs, invoices_per_month: Number(e.target.value) })
                }
              />
            </div>

            <Button onClick={calculate} disabled={loading} className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              {loading ? "Calculating..." : "Calculate Costs"}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Configure parameters and click Calculate
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Costs */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-primary">AI Costs</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per Request</span>
                      <span>${result.ai.cost_per_request.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per Month</span>
                      <span>${result.ai.cost_per_month.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per User/Month</span>
                      <span>${result.ai.cost_per_user.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per Invoice</span>
                      <span>${result.ai.cost_per_invoice.toFixed(6)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Infrastructure Costs */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-primary">Infrastructure Costs</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Server Cost</span>
                      <span>₹{result.infrastructure.monthly_server_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per User/Month</span>
                      <span>₹{result.infrastructure.cost_per_user.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per Invoice</span>
                      <span>₹{result.infrastructure.cost_per_invoice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-destructive">Total</h3>
                  <div className="space-y-2 text-sm font-medium">
                    <div className="flex justify-between">
                      <span>Monthly Total</span>
                      <span className="text-lg">${result.total.monthly.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Per User/Month</span>
                      <span>${result.total.per_user.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Per Invoice</span>
                      <span>${result.total.per_invoice.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
