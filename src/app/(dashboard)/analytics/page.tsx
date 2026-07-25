"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, Clock, Coins, Activity } from "lucide-react";
import type { AnalyticsData } from "@/types/analytics";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Requests",
      value: data?.summary.total_requests ?? 0,
      icon: Sparkles,
    },
    {
      title: "Total Tokens",
      value: (data?.summary.total_tokens ?? 0).toLocaleString(),
      icon: Activity,
    },
    {
      title: "Total Cost",
      value: formatCurrency(data?.summary.total_cost ?? 0, "USD"),
      icon: Coins,
    },
    {
      title: "Avg Response Time",
      value: `${data?.summary.avg_response_time ?? 0}ms`,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Usage Analytics</h1>
        <p className="text-muted-foreground">Track your AI API usage and costs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.daily_usage.length ?? 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.daily_usage}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Model Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Requests by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.model_usage.length ?? 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.model_usage}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cost by Model */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.model_usage.length ?? 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.model_usage}
                    dataKey="cost"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: $${(value as number).toFixed(4)}`}
                  >
                    {data?.model_usage.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.recent_requests.length ?? 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No requests yet
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-auto">
                {data?.recent_requests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{req.model}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.prompt.slice(0, 60)}...</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">{req.total_tokens} tokens</p>
                      <p className="text-xs text-muted-foreground">{req.response_time_ms}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
