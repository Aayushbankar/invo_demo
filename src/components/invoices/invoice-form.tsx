"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreateInvoiceSchema, type CreateInvoiceInput } from "@/schemas/invoice";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

interface InvoiceFormProps {
  initialData?: CreateInvoiceInput;
  onSave: (data: CreateInvoiceInput) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  saving?: boolean;
}

export function InvoiceForm({
  initialData,
  onSave,
  onCancel,
  showCancel,
  saving,
}: InvoiceFormProps) {
  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(CreateInvoiceSchema) as never,
    defaultValues: initialData ?? {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_address: "",
      currency: "INR",
      tax_rate: 18,
      discount: 0,
      notes: "",
      due_date: "",
      status: "draft",
      items: [{ name: "", description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchTaxRate = form.watch("tax_rate");
  const watchDiscount = form.watch("discount");
  const watchCurrency = form.watch("currency");

  const totals = useMemo(
    () => calculateInvoiceTotals(watchItems, watchTaxRate, watchDiscount),
    [watchItems, watchTaxRate, watchDiscount]
  );

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Name *</Label>
            <Input {...form.register("customer_name")} placeholder="Customer name" />
            {form.formState.errors.customer_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.customer_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_email">Email</Label>
            <Input
              {...form.register("customer_email")}
              type="email"
              placeholder="customer@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_phone">Phone</Label>
            <Input {...form.register("customer_phone")} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_address">Address</Label>
            <Input {...form.register("customer_address")} placeholder="123 Main St, City" />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status") ?? "draft"}
              onValueChange={(v) => { if (v) form.setValue("status", v as CreateInvoiceInput["status"]); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.watch("currency") ?? "INR"}
              onValueChange={(v) => { if (v) form.setValue("currency", v); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input {...form.register("due_date")} type="date" />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", description: "", quantity: 1, unit_price: 0 })}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_120px_120px_120px_auto] items-end">
              <div className="space-y-2">
                {index === 0 && <Label>Item Name *</Label>}
                <Input
                  {...form.register(`items.${index}.name`)}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                {index === 0 && <Label>Qty</Label>}
                <Input
                  {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  type="number"
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                {index === 0 && <Label>Unit Price</Label>}
                <Input
                  {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                {index === 0 && <Label>Total</Label>}
                <div className="h-10 px-3 flex items-center border rounded-md bg-muted text-sm font-medium">
                  {formatCurrency(
                    (watchItems[index]?.quantity ?? 0) * (watchItems[index]?.unit_price ?? 0),
                    watchCurrency
                  )}
                </div>
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="h-10 w-10 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {form.formState.errors.items && (
            <p className="text-sm text-destructive">
              {form.formState.errors.items.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tax, Discount & Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  {...form.register("tax_rate", { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <Input
                  {...form.register("discount", { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  {...form.register("notes")}
                  placeholder="Payment terms, thank you note, etc."
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-3 sm:ml-auto sm:w-64">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal, watchCurrency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({watchTaxRate}%)
                </span>
                <span>{formatCurrency(totals.tax_amount, watchCurrency)}</span>
              </div>
              {watchDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">
                    -{formatCurrency(watchDiscount, watchCurrency)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total, watchCurrency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {showCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Invoice"}
        </Button>
      </div>
    </form>
  );
}
