import {
  BarChart3,
  Calendar,
  Sparkles,
  Tablet,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Rental } from '../types';

interface WeeklyRentalChartProps {
  rentals: Rental[];
}

export const WeeklyRentalChart: React.FC<WeeklyRentalChartProps> = ({ rentals }) => {
  // Compute the past 7 days statistics
  const { chartData, totalWeekCount, totalWeekQuantity, avgCount, peakDay } = useMemo(() => {
    const days: {
      dateKey: string;
      label: string;
      fullDate: string;
      count: number;
      quantity: number;
      cart1Count: number;
      cart2Count: number;
      isToday: boolean;
    }[] = [];

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${date}`;
      const dayOfWeek = dayNames[d.getDay()];

      days.push({
        dateKey,
        label: `${month}.${date}(${dayOfWeek})`,
        fullDate: `${year}.${month}.${date}`,
        count: 0,
        quantity: 0,
        cart1Count: 0,
        cart2Count: 0,
        isToday: i === 0,
      });
    }

    const dayMap = new Map(days.map((item) => [item.dateKey, item]));

    // Aggregate rentals into the 7 days
    rentals.forEach((rental) => {
      if (!rental.createdAt) return;
      try {
        const rDate = new Date(rental.createdAt);
        if (isNaN(rDate.getTime())) return;

        const rKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(rDate.getDate()).padStart(2, '0')}`;
        const dayStat = dayMap.get(rKey);
        if (dayStat) {
          dayStat.count += 1;
          dayStat.quantity += rental.quantity || 1;
          if (rental.cartUsed === '보관함 1' || rental.cartUsed === 'A보관함') {
            dayStat.cart1Count += 1;
          } else {
            dayStat.cart2Count += 1;
          }
        }
      } catch (e) {
        // Ignore date parsing error
      }
    });

    const totalCount = days.reduce((sum, d) => sum + d.count, 0);
    const totalQty = days.reduce((sum, d) => sum + d.quantity, 0);
    const avg = (totalCount / 7).toFixed(1);

    let peak = days[0];
    days.forEach((d) => {
      if (d.count > peak.count) peak = d;
    });

    return {
      chartData: days,
      totalWeekCount: totalCount,
      totalWeekQuantity: totalQty,
      avgCount: avg,
      peakDay: peak,
    };
  }, [rentals]);

  // Custom recharts tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md space-y-1">
          <div className="font-black text-slate-200 flex items-center gap-1.5 border-b border-slate-700/80 pb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{data.fullDate} ({data.label.split('(')[1]}</span>
            {data.isToday && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                오늘
              </span>
            )}
          </div>
          <div className="pt-0.5 space-y-1">
            <div className="flex items-center justify-between gap-4 font-bold">
              <span className="text-slate-300">총 대여 건수:</span>
              <span className="text-amber-400 text-sm font-black">{data.count}건</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">대여 태블릿 수:</span>
              <span className="text-emerald-400 font-bold">{data.quantity}대</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400 pt-0.5 border-t border-slate-800">
              <span>1 보관함: {data.cart1Count}건</span>
              <span>2 보관함: {data.cart2Count}건</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden select-none">
      {/* Chart Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-inner shrink-0">
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>최근 일주일 태블릿 대여 건수 추이</span>
              <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                실시간 통계
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              최근 7일간 일별 스마트 태블릿 대여 신청 건수 및 활용 패턴
            </p>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">7일간 총 대여:</span>
            <strong className="text-blue-700 font-black">{totalWeekCount}건</strong>
            <span className="text-slate-400 font-bold">({totalWeekQuantity}대)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hidden md:flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">일평균:</span>
            <strong className="text-slate-800 font-black">{avgCount}건</strong>
          </div>
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-3.5 sm:p-5">
        <div className="w-full h-52 sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                unit="건"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? '#2563eb' : entry.count > 0 ? '#60a5fa' : '#cbd5e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Metrics Row */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span>오늘 ({chartData[chartData.length - 1]?.count || 0}건)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <span>이전 일자 (대여 발생)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
              <span>대여 없음 (0건)</span>
            </div>
          </div>

          {peakDay && peakDay.count > 0 && (
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>최다 대여일: <strong>{peakDay.label}</strong> ({peakDay.count}건)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
