import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, YAxis as YAxisH,
} from 'recharts';
import { Users, Target, CheckCircle2, Clock, Activity, TrendingUp, BarChart2, PieChart as PieChartIcon, Flame, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCycles, useActiveCycle, useAnalyticsOverview, useAnalyticsQoQ, useAnalyticsDistribution, useAnalyticsHeatmap, useAnalyticsManagers } from '../../hooks/useCycles';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, Select, Skeleton, EmptyState, Badge, ProgressBar } from '../../components/ui';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];
const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#22c55e', PENDING_APPROVAL: '#f59e0b', DRAFT: '#64748b', REJECTED: '#ef4444',
};

function heatColor(val: number) {
  if (val >= 80) return 'bg-success/20 text-success';
  if (val >= 50) return 'bg-warning/20 text-warning';
  if (val > 0) return 'bg-orange-500/20 text-orange-400';
  return 'bg-bg-elevated text-text-muted';
}

function rateColor(rate: string) {
  const val = parseFloat(rate) || 0;
  if (val >= 80) return 'text-success';
  if (val >= 50) return 'text-warning';
  return 'text-danger';
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { data: cycles = [] } = useCycles();
  const { data: activeCycle } = useActiveCycle();
  const [cycleId, setCycleId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const effectiveCycleId = cycleId || activeCycle?.id || '';

  const cycleOptions = [
    { value: '', label: 'Active Cycle' },
    ...cycles.map((c) => ({ value: c.id, label: `${c.year} — ${c.phase}` })),
  ];

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(effectiveCycleId || undefined);
  const { data: qoq, isLoading: qoqLoading } = useAnalyticsQoQ(effectiveCycleId || undefined, selectedEmployeeId || undefined);
  const { data: distribution, isLoading: distLoading } = useAnalyticsDistribution(effectiveCycleId || undefined);
  const { data: heatmap, isLoading: heatLoading } = useAnalyticsHeatmap(effectiveCycleId || undefined);
  const { data: managers, isLoading: mgrLoading } = useAnalyticsManagers(isAdmin ? (effectiveCycleId || undefined) : undefined);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/api/admin/users').then((r) => r.data),
    enabled: isAdmin,
  });
  const employees = allUsers.filter((u: { role: string }) => u.role === 'EMPLOYEE');

  const employeeOptions = [
    { value: '', label: 'All Employees (aggregate)' },
    ...employees.map((e: { id: string; name: string }) => ({ value: e.id, label: e.name })),
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-muted text-sm mt-1">Organisation performance insights</p>
        </div>
        <div className="w-56">
          <Select value={cycleId} onChange={(e) => setCycleId(e.target.value)} options={cycleOptions} />
        </div>
      </div>

      {/* ── OVERVIEW CARDS ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-primary" />
          <h2 className="font-semibold text-text-primary text-sm">Overview</h2>
        </div>
        {overviewLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatIconCard icon={<Users size={16} />} label="Employees" value={overview.totalEmployees} color="text-primary" />
            <StatIconCard icon={<Target size={16} />} label="Total Goals" value={overview.goals.total} color="text-primary" />
            <StatIconCard icon={<CheckCircle2 size={16} />} label="Approved" value={overview.goals.approved} color="text-success" />
            <StatIconCard icon={<Clock size={16} />} label="Pending" value={overview.goals.pending} color="text-warning" />
            <StatIconCard icon={<Activity size={16} />} label="Check-ins" value={overview.checkIns.total} color="text-primary" />
            <StatIconCard icon={<TrendingUp size={16} />} label="Completion" value={overview.checkIns.completionRate} color="text-primary" />
          </div>
        ) : (
          <Card className="p-8"><EmptyState icon={<Activity size={40} />} title="No overview data" description="Select a cycle to view analytics" /></Card>
        )}
      </section>

      {/* ── QoQ TREND ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-semibold text-text-primary text-sm">Quarter-on-Quarter Trend</h2>
          </div>
          <div className="w-56">
            <Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} options={employeeOptions} />
          </div>
        </div>
        {qoqLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : qoq?.qoq?.length ? (
          <Card className="p-5">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={qoq.qoq} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: number, name: string) => [name === 'averageScore' ? `${value}%` : value, name === 'averageScore' ? 'Avg Score' : 'Goals Checked In']}
                />
                <Line type="monotone" dataKey="averageScore" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5, fill: '#6366f1', stroke: '#12121a', strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-3 text-xs text-text-muted">
              {qoq.qoq.map((q: { quarter: string; goalsCheckedIn: number }) => (
                <span key={q.quarter}>{q.quarter}: <span className="font-mono text-text-primary">{q.goalsCheckedIn}</span> goals</span>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8"><EmptyState icon={<TrendingUp size={40} />} title="No QoQ data" description="Select an employee to view quarter trends" /></Card>
        )}
      </section>

      {/* ── DISTRIBUTION CHARTS ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon size={16} className="text-primary" />
          <h2 className="font-semibold text-text-primary text-sm">Goal Distribution</h2>
        </div>
        {distLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
          </div>
        ) : distribution ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* By UoM - Pie */}
            <Card className="p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">By UoM Type</h3>
              {distribution.byUom.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">No data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={distribution.byUom} dataKey="count" nameKey="uomType" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} stroke="none">
                        {distribution.byUom.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {distribution.byUom.map((d: { uomType: string; count: number; percentage: number }, i: number) => (
                      <span key={d.uomType} className="flex items-center gap-1.5 text-xs text-text-muted">
                        <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.uomType} <span className="font-mono text-text-primary">{d.count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* By Status - Bar */}
            <Card className="p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">By Status</h3>
              {distribution.byStatus.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distribution.byStatus} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distribution.byStatus.map((d: { status: string }) => <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#6366f1'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* By Thrust Area - Horizontal Bar */}
            <Card className="p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">By Thrust Area</h3>
              {distribution.byThrustArea.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">No data</p>
              ) : (
                <div className="space-y-2">
                  {distribution.byThrustArea.map((d: { thrustArea: string; count: number; percentage: number }) => (
                    <div key={d.thrustArea}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted truncate mr-2">{d.thrustArea}</span>
                        <span className="font-mono text-text-primary shrink-0">{d.count}</span>
                      </div>
                      <ProgressBar value={d.percentage} color="bg-primary" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="p-8"><EmptyState icon={<BarChart2 size={40} />} title="No distribution data" /></Card>
        )}
      </section>

      {/* ── TEAM HEATMAP ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-primary" />
          <h2 className="font-semibold text-text-primary text-sm">Team Completion Heatmap</h2>
        </div>
        {heatLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : heatmap?.length ? (
          <div className="space-y-6">
            {heatmap.map((mgr: {
              managerId: string; managerName: string; teamSize: number; teamAverageCompletionRate: number;
              employees: { employeeId: string; employeeName: string; totalApprovedGoals: number; overallCompletionRate: number; quarterStats: { quarter: string; checkInsLogged: number; completionRate: number }[] }[];
            }) => (
              <Card key={mgr.managerId} className="overflow-hidden">
                <div className="px-4 py-3 bg-bg-elevated border-b border-bg-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {mgr.managerName.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{mgr.managerName}</span>
                    <Badge variant="muted">{mgr.teamSize} reports</Badge>
                  </div>
                  <span className="text-xs text-text-muted">Team avg: <span className="font-mono font-bold text-primary">{mgr.teamAverageCompletionRate.toFixed(1)}%</span></span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-bg-border">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Employee</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Q1</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Q2</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Q3</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Q4</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Overall</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border">
                      {mgr.employees.map((emp) => {
                        const qMap: Record<string, number> = {};
                        emp.quarterStats.forEach((qs) => { qMap[qs.quarter] = qs.completionRate; });
                        return (
                          <tr key={emp.employeeId} className="hover:bg-bg-elevated/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                                  {emp.employeeName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm text-text-primary font-medium">{emp.employeeName}</p>
                                  <p className="text-xs text-text-muted">{emp.totalApprovedGoals} goals</p>
                                </div>
                              </div>
                            </td>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                              const val = qMap[q] ?? 0;
                              return (
                                <td key={q} className="px-3 py-3 text-center">
                                  <span className={`inline-block w-14 text-center py-1.5 rounded-md text-xs font-mono font-bold ${heatColor(val)}`}>
                                    {val}%
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-block w-14 text-center py-1.5 rounded-md text-xs font-mono font-bold ${heatColor(emp.overallCompletionRate)}`}>
                                {emp.overallCompletionRate.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8"><EmptyState icon={<Flame size={40} />} title="No heatmap data" description="No team completion data available" /></Card>
        )}
      </section>

      {/* ── MANAGER EFFECTIVENESS (ADMIN only) ── */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={16} className="text-primary" />
            <h2 className="font-semibold text-text-primary text-sm">Manager Effectiveness</h2>
          </div>
          {mgrLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : managers?.length ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-border bg-bg-elevated">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Manager</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Team Size</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Goals Approved</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Approval Rate</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Check-ins Commented</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Comment Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border">
                    {managers.map((m: {
                      managerId: string; managerName: string; managerEmail: string;
                      teamSize: number; totalApprovedGoals: number;
                      approvalRate: string; checkInsWithManagerComment: number;
                      checkInCommentRate: string;
                    }) => (
                      <tr key={m.managerId} className="hover:bg-bg-elevated/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {m.managerName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{m.managerName}</p>
                              <p className="text-xs text-text-muted">{m.managerEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-text-primary">{m.teamSize}</td>
                        <td className="px-3 py-3 text-center font-mono text-text-primary">{m.totalApprovedGoals}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-mono font-bold text-xs ${rateColor(m.approvalRate)}`}>{m.approvalRate}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-text-primary">{m.checkInsWithManagerComment}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-mono font-bold text-xs ${rateColor(m.checkInCommentRate)}`}>{m.checkInCommentRate}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8"><EmptyState icon={<UserCheck size={40} />} title="No manager data" description="Manager effectiveness data is not available" /></Card>
          )}
        </section>
      )}
    </div>
  );
}

function StatIconCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">{label}</p>
        <p className={`text-xl font-mono font-bold ${color} mt-0.5`}>{value}</p>
      </div>
    </div>
  );
}
