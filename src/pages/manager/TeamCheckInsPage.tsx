import { useState } from 'react';
import { MessageSquare, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useActiveCycle } from '../../hooks/useCycles';
import { Button, Card, Modal, Textarea, Table, Tr, Td, Badge, Skeleton, EmptyState, statusBadge } from '../../components/ui';
import { getErrorMessage } from '../../lib/utils';
import { useToast } from '../../lib/toast';

interface CheckIn {
  id: string;
  goalId: string;
  employeeId: string;
  quarter: string;
  planned: number;
  actual: number;
  status: string;
  managerComment: string | null;
  goal: { id: string; title: string; uomType: string; target: number; weightage: number };
  employee: { id: string; name: string; email: string };
  score: string;
}

function scoreBg(score: string) {
  const val = parseFloat(score);
  if (val >= 80) return 'bg-success/10 text-success';
  if (val >= 50) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}

export default function TeamCheckInsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cycle } = useActiveCycle();
  const [quarterFilter, setQuarterFilter] = useState('');
  const [commentModal, setCommentModal] = useState<CheckIn | null>(null);
  const [comment, setComment] = useState('');

  const { data: checkIns = [], isLoading } = useQuery<CheckIn[]>({
    queryKey: ['checkins', 'team', cycle?.id, quarterFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (cycle?.id) params.set('cycleId', cycle.id);
      if (quarterFilter) params.set('quarter', quarterFilter);
      return api.get(`/api/checkins/team?${params}`).then((r) => r.data);
    },
    enabled: !!cycle?.id,
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      api.post(`/api/checkins/${id}/comment`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      toast('success', 'Comment added');
      setCommentModal(null);
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  // Group by employee
  const byEmployee = checkIns.reduce<Record<string, { employee: CheckIn['employee']; checkIns: CheckIn[] }>>((acc, ci) => {
    const eid = ci.employee.id;
    if (!acc[eid]) acc[eid] = { employee: ci.employee, checkIns: [] };
    acc[eid].checkIns.push(ci);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-56" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Team Check-ins</h1>
          {cycle && <p className="text-text-muted text-sm mt-1">Cycle: <span className="font-mono text-text-primary">{cycle.year} {cycle.phase}</span></p>}
        </div>
        <select
          value={quarterFilter}
          onChange={(e) => setQuarterFilter(e.target.value)}
          className="bg-bg-elevated border border-bg-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="">All Quarters</option>
          {['Q1', 'Q2', 'Q3', 'Q4', 'GOAL_SETTING'].map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>

      {checkIns.length === 0 ? (
        <Card>
          <EmptyState icon={<Activity size={40} />} title="No check-ins found" description="No check-ins have been logged yet" />
        </Card>
      ) : (
        Object.values(byEmployee).map(({ employee, checkIns: eCIs }) => (
          <div key={employee.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {employee.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{employee.name}</p>
                <p className="text-xs text-text-muted">{employee.email}</p>
              </div>
            </div>
            <Card className="ml-11">
              <Table headers={['Goal', 'Quarter', 'Planned', 'Actual', 'Score', 'Status', 'Comment', '']}>
                {eCIs.map((ci) => (
                  <Tr key={ci.id}>
                    <Td>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{ci.goal.title}</p>
                        <p className="text-xs font-mono text-text-muted">{ci.goal.uomType}</p>
                      </div>
                    </Td>
                    <Td><span className="font-mono text-xs">{ci.quarter}</span></Td>
                    <Td><span className="font-mono">{ci.planned}</span></Td>
                    <Td><span className="font-mono">{ci.actual}</span></Td>
                    <Td>
                      <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${scoreBg(ci.score)}`}>{ci.score}</span>
                    </Td>
                    <Td>{statusBadge(ci.status)}</Td>
                    <Td>
                      <p className="text-xs text-text-muted max-w-[160px] truncate">{ci.managerComment ?? '—'}</p>
                    </Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => { setCommentModal(ci); setComment(ci.managerComment ?? ''); }}>
                        <MessageSquare size={13} />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </Card>
          </div>
        ))
      )}

      <Modal open={!!commentModal} onClose={() => setCommentModal(null)} title="Add Manager Comment">
        {commentModal && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">Goal: <strong className="text-text-primary">{commentModal.goal.title}</strong></p>
            <Textarea label="Comment" placeholder="Provide feedback..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
            <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
              <Button variant="secondary" size="sm" onClick={() => setCommentModal(null)}>Cancel</Button>
              <Button size="sm" loading={commentMutation.isPending} onClick={() => commentMutation.mutate({ id: commentModal.id, comment })}>Save Comment</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
