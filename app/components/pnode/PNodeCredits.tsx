'use client';

import { Coins, TrendingUp, Calendar, Award } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

// Placeholder values - replace with real data
const CREDITS_DATA = {
  balance: 0,
  earned: 0,
  nextPayout: 'N/A',
  rank: 'N/A',
};

export default function PNodeCredits({ darkMode }: Props) {
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  const stats = [
    {
      icon: Coins,
      label: 'Credit Balance',
      value: CREDITS_DATA.balance.toLocaleString(),
      color: 'text-yellow-400',
    },
    {
      icon: TrendingUp,
      label: 'Earned (24h)',
      value: CREDITS_DATA.earned.toLocaleString(),
      color: 'text-green-400',
    },
    {
      icon: Calendar,
      label: 'Next Payout',
      value: CREDITS_DATA.nextPayout,
      color: 'text-blue-400',
    },
    {
      icon: Award,
      label: 'Network Rank',
      value: CREDITS_DATA.rank,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className={`${cardClass} p-6 rounded-lg border ${borderClass} mb-6`}>
      <h2 className="text-xl font-bold mb-4">Credits & Rewards</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${borderClass}`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className={`text-xs ${mutedClass}`}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={`mt-4 p-4 rounded-lg border ${borderClass} bg-blue-500/10`}>
        <p className="text-sm text-blue-400">
          💡 Credits are earned based on uptime, storage contribution, and network participation.
          Maintain high scores to maximize rewards!
        </p>
      </div>
    </div>
  );
}