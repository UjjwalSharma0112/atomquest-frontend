import { useState, useMemo } from 'react';
import { Download, BarChart2, Users, TrendingUp, Filter, FileSpreadsheet, Target, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCycles } from '../../hooks/useCycles';
import { Button, Card, Table, Tr, Td, Badge, Skeleton, EmptyState, Select, ProgressBar } from '../../components/ui';
import { useToast } from '../../lib/toast';

interface AchievementRow {
  employee: string;
  email: string;
  goalTitle: string;
  thrustArea: string;
  uomType: string;
  weightage: number;
  quarter: string;
  planned: number;
  actual: number;
  status: string;
  score: string;
  managerComment: string | null;
}

interface CompletionRow {
  employee: string;
  email: string;
  manager: string;
  totalApprovedGoals: number;
  checkInsCompleted: number;
  completionRate: string;
  status: string;
}

function scoreColor(score: string) {
  const val = parseFloat(score) || 0;
  if (val >= 80) return 'text-success';
  if (val >= 50) return 'text-warning';
  return 'text-danger';
}

function scoreBg(score: string) {
  const val = parseFloat(score) || 0;
  if (val >= 80) return 'bg-success/10 text-success';
  if (val >= 50) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}

function scoreBarColor(score: string) {
  const val = parseFloat(score) || 0;
  if (val >= 80) return 'bg-success';
  if (val >= 50) return 'bg-warning';
  return 'bg-danger';
}

type TabKey = 'overview' | 'achievement';

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: cycles = [] } = useCycles();
  const [cycleId, setCycleId] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const cycleOptions = [
    { value: '', label: 'Select a cycle...' },
    ...cycles.map((c) => ({ value: c.id, label: `${c.year} — ${c.phase}` })),
  ];

  const { data: achievement = [], isLoading: achLoading } = useQuery<AchievementRow[]>({
    queryKey: ['reports', 'achievement', cycleId],
    queryFn: () => api.get(`/api/reports/achievement?cycleId=${cycleId}`).then((r) => r.data),
    enabled: !!cycleId,
  });

  const { data: completion = [], isLoading: compLoading } = useQuery<CompletionRow[]>({
    queryKey: ['reports', 'completion', cycleId, quarterFilter],
    queryFn: () => {
      const params = new URLSearchParams({ cycleId });
      if (quarterFilter) params.set('quarter', quarterFilter);
      return api.get(`/api/reports/completion?${params}`).then((r) => r.data);
    },
    enabled: !!cycleId,
  });

  async function exportExcel() {
    try {
      const res = await api.get(`/api/reports/achievement?cycleId=${cycleId}&format=excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'achievement-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('success', 'Report downloaded');
    } catch {
      toast('error', 'Export failed');
    }
  }

  const completedCount = completion.filter((c) => c.status === 'COMPLETED').length;
  const pendingCount = completion.length - completedCount;
  const avgRate = completion.length
    ? (completion.reduce((s, c) => s + (parseFloat(c.completionRate) || 0), 0) / completion.length).toFixed(1)
    : '0';

  const filteredAch = useMemo(() => {
    let data = achievement;
    if (quarterFilter) data = data.filter((r) => r.quarter === quarterFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter((r) =>
        r.employee.toLowerCase().includes(q) ||
        r.goalTitle.toLowerCase().includes(q) ||
        r.thrustArea.toLowerCase().includes(q)
      );
    }
    return data;
  }, [achievement, quarterFilter, searchTerm]);

  const filteredCompletion = useMemo(() => {
    if (!searchTerm.trim()) return completion;
    const q = searchTerm.toLowerCase();
    return completion.filter((r) =>
      r.employee.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.manager && r.manager.toLowerCase().includes(q))
    );
  }, [completion, searchTerm]);

  const avgScore = filteredAch.length
    ? (filteredAch.reduce((s, r) => s + (parseFloat(r.score) || 0), 0) / filteredAch.length).toFixed(1)
    : null;

  const selectedCycle = cycles.find((c) => c.id === cycleId);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Users size={14} /> },
    { key: 'achievement', label: 'Achievement', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Reports & Analytics</h1>
          <p className="text-text-muted text-sm mt-1">Performance insights and data exports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-56">
            <Select value={cycleId} onChange={(e) => { setCycleId(e.target.value); setSearchTerm(''); }} options={cycleOptions} />
          </div>
          {cycleId && (
            <Button variant="secondary" size="sm" onClick={exportExcel} disabled={achievement.length === 0}>
              <Download size={13} />
              Export
            </Button>
          )}
        </div>
      </div>

      {!cycleId ? (
        <Card className="p-12">
          <EmptyState icon={<BarChart2 size={48} />} title="Select a cycle to begin" description="Choose a performance cycle from the dropdown above to view reports and analytics" />
        </Card>
      ) : (
        <>
          {/* Cycle info banner */}
          {selectedCycle && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
              <FileSpreadsheet size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {selectedCycle.year} — {selectedCycle.phase}
                </p>
                <p className="text-xs text-text-muted">
                  {completion.length} employees &middot; {achievement.length} check-in records
                </p>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Users size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Employees</p>
                <p className="text-xl font-mono font-bold text-text-primary mt-0.5">{completion.length}</p>
              </div>
            </div>
            <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Completed</p>
                <p className="text-xl font-mono font-bold text-success mt-0.5">{completedCount}</p>
              </div>
            </div>
            <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Pending</p>
                <p className="text-xl font-mono font-bold text-warning mt-0.5">{pendingCount}</p>
              </div>
            </div>
            <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Target size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Avg Completion</p>
                <p className="text-xl font-mono font-bold text-primary mt-0.5">{avgRate}%</p>
              </div>
            </div>
          </div>

          {/* Completion rate bar */}
          {completion.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Overall Completion Rate</p>
                <span className="text-sm font-mono font-bold text-primary">{avgRate}%</span>
              </div>
              <ProgressBar value={parseFloat(avgRate)} color={parseFloat(avgRate) >= 80 ? 'bg-success' : parseFloat(avgRate) >= 50 ? 'bg-warning' : 'bg-danger'} />
            </Card>
          )}

          {/* Tabs + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-bg-surface border border-bg-border rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <select
                  value={quarterFilter}
                  onChange={(e) => setQuarterFilter(e.target.value)}
                  className="bg-bg-elevated border border-bg-border text-text-primary rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                >
                  <option value="">All Quarters</option>
                  {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-bg-elevated border border-bg-border text-text-primary placeholder-text-muted rounded-lg pl-3 pr-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <section>
              {compLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                </div>
              ) : filteredCompletion.length === 0 ? (
                <Card>
                  <EmptyState icon={<Users size={40} />} title="No completion data" description="No data available for the selected filters" />
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCompletion.map((row, i) => {
                    const rate = parseFloat(row.completionRate) || 0;
                    return (
                      <Card key={i} className="p-4 hover:border-bg-border/80 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {row.employee.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text-primary text-sm truncate">{row.employee}</p>
                              <p className="text-xs text-text-muted truncate">{row.email}</p>
                            </div>
                          </div>
                          <Badge variant={row.status === 'COMPLETED' ? 'success' : 'warning'}>{row.status === 'COMPLETED' ? 'Done' : 'Pending'}</Badge>
                        </div>

                        {row.manager && (
                          <p className="text-xs text-text-muted mb-3 flex items-center gap-1">
                            <Clock size={10} />
                            Manager: {row.manager}
                          </p>
                        )}

                        <div className="space-y-2.5 text-xs mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-text-muted">Approved Goals</span>
                            <span className="font-mono font-bold text-text-primary">{row.totalApprovedGoals}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-muted">Check-ins Done</span>
                            <span className="font-mono font-bold text-text-primary">{row.checkInsCompleted}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-text-muted text-xs">Completion</span>
                            <span className={`font-mono font-bold text-xs ${scoreColor(row.completionRate)}`}>{row.completionRate}</span>
                          </div>
                          <ProgressBar value={rate} color={scoreBarColor(row.completionRate)} />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'achievement' && (
            <section>
              {avgScore && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs text-text-muted">Avg Score</span>
                    <span className={`font-mono font-bold text-sm ${scoreColor(avgScore)}`}>{avgScore}</span>
                  </div>
                  <div className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 flex items-center gap-2">
                    <Target size={14} className="text-primary" />
                    <span className="text-xs text-text-muted">Records</span>
                    <span className="font-mono font-bold text-sm text-text-primary">{filteredAch.length}</span>
                  </div>
                </div>
              )}

              {achLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : filteredAch.length === 0 ? (
                <Card>
                  <EmptyState icon={<TrendingUp size={40} />} title="No achievement data" description="No check-ins have been logged for this cycle" />
                </Card>
              ) : (
                <Card>
                  <Table headers={['Employee', 'Goal', 'Area', 'Qtr', 'Planned', 'Actual', 'Score', 'Status']}>
                    {filteredAch.map((row, i) => (
                      <Tr key={i}>
                        <Td>
                          <div className="min-w-[120px]">
                            <p className="text-sm font-medium text-text-primary">{row.employee}</p>
                            <p className="text-xs text-text-muted">{row.email}</p>
                          </div>
                        </Td>
                        <Td>
                          <div className="min-w-[140px]">
                            <p className="text-sm text-text-primary">{row.goalTitle}</p>
                            <p className="text-xs font-mono text-text-muted">{row.uomType} &middot; {row.weightage}%</p>
                          </div>
                        </Td>
                        <Td><Badge variant="muted">{row.thrustArea}</Badge></Td>
                        <Td><span className="font-mono text-xs">{row.quarter}</span></Td>
                        <Td><span className="font-mono text-sm">{row.planned}</span></Td>
                        <Td><span className="font-mono text-sm">{row.actual}</span></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${scoreBg(row.score)}`}>{row.score}</span>
                          </div>
                        </Td>
                        <Td>{statusBadge(row.status)}</Td>
                      </Tr>
                    ))}
                  </Table>
                </Card>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'muted' | 'info' | 'default'> = {
    DRAFT: 'muted',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    ON_TRACK: 'success',
    COMPLETED: 'success',
    NOT_STARTED: 'muted',
    PENDING: 'warning',
  };
  return <Badge variant={map[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Badge>;
}
