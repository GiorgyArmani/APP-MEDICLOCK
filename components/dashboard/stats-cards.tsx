"use client"

import type { Shift } from "@/lib/supabase/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle2, Clock, Users } from "lucide-react"

interface StatsCardsProps {
  shifts: Shift[]
}

export function StatsCards({ shifts }: StatsCardsProps) {
  const stats = {
    total: shifts.length,
    new: shifts.filter((s) => s.status === "new").length,
    free: shifts.filter((s) => s.status === "free" || s.status === "free_pending").length,
    confirmed: shifts.filter((s) => s.status === "confirmed").length,
  }

  const cards = [
    {
      title: "Total Shifts",
      value: stats.total,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "New Assigned",
      value: stats.new,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Free Available",
      value: stats.free,
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Confirmed",
      value: stats.confirmed,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{card.title}</CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
