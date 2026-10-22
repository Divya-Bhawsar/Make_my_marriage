'use client';

import React from 'react';
import { WeddingMemberDTO } from '@/modules/member/member.service';
import { MemberInvitationDTO } from '@/modules/member/member-invitation.model';
import { USER_ROLES } from '@/shared/constants';

interface TeamMetricStripProps {
  members: WeddingMemberDTO[];
  invitations: MemberInvitationDTO[];
}

export function TeamMetricStrip({ members, invitations }: TeamMetricStripProps) {
  const totalMembers = members.length;
  const adminCount = members.filter((m) => m.role === USER_ROLES.ADMIN).length;
  const managerCount = members.filter((m) => m.role === USER_ROLES.MANAGER).length;
  const pendingCount = invitations.length;

  const metrics = [
    {
      label: 'Total Committee',
      value: totalMembers,
      icon: '👥',
      subtext: 'Active collaborators',
      color: 'from-amber-50 to-orange-50 border-amber-200/80 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Wedding Admins',
      value: adminCount,
      icon: '👑',
      subtext: 'Full workspace authority',
      color: 'from-rose-50 to-pink-50 border-rose-200/80 text-rose-900',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      label: 'Event Managers',
      value: managerCount,
      icon: '🛡️',
      subtext: 'Checklist & vendor ops',
      color: 'from-blue-50 to-indigo-50 border-blue-200/80 text-blue-900',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Pending Invites',
      value: pendingCount,
      icon: '✉️',
      subtext: 'Awaiting acceptance',
      color: 'from-purple-50 to-fuchsia-50 border-purple-200/80 text-purple-900',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`rounded-2xl border bg-gradient-to-br ${metric.color} p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl" role="img" aria-label={metric.label}>
              {metric.icon}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metric.badgeColor}`}>
              Active
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-zinc-900">
            {metric.value}
          </p>
          <p className="text-xs font-semibold text-zinc-800 mt-0.5">{metric.label}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{metric.subtext}</p>
        </div>
      ))}
    </div>
  );
}
