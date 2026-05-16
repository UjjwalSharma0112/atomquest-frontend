import { useState } from 'react';
import { CheckCircle, XCircle, CreditCard as Edit3, Flag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button, Card, Modal, Textarea, Input, Badge, Skeleton, EmptyState, statusBadge } from '../../components/ui';
import { getErrorMessage, formatDate } from '../../lib/utils';
import { useToast } from '../../lib/toast';

interface Goal {
  id: string;
  title: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  description: string | null;
  deadline: string | null;
  employee: { id: string; name: string; email: string };
}

const uomColors: Record<string, string> = {
  MIN: 'text-blue-400', MAX: 'text-green-400', TIMELINE: 'text-yellow-400', ZERO: 'text-purple-400',
};

export default function TeamApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectGoal, setRejectGoal] = useState<Goal | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [comment, setComment] = useState('');
  const [editForm, setEditForm] = useState({ target: '', weightage: '', comment: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['approvals', 'team'],
    queryFn: () => api.get('/api/approvals/team').then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ goalId, comment }: { goalId: string; comment: string }) =>
      api.post(`/api/approvals/${goalId}/approve`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast('success', 'Goal approved and locked');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ goalId, comment }: { goalId: string; comment: string }) =>
      api.post(`/api/approvals/${goalId}/reject`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast('success', 'Goal rejected');
      setRejectGoal(null);
    },
    onError: (err) => { toast('error', getErrorMessage(err)); setApiError(getErrorMessage(err)); },
  });

  const editMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: object }) =>
      api.put(`/api/approvals/${goalId}/edit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast('success', 'Goal updated');
      setEditGoal(null);
    },
    onError: (err) => { setApiError(getErrorMessage(err)); },
  });

  // Group by employee
  const byEmployee = goals.reduce<Record<string, { employee: Goal['employee']; goals: Goal[] }>>((acc, g) => {
    const eid = g.employee.id;
    if (!acc[eid]) acc[eid] = { employee: g.employee, goals: [] };
    acc[eid].goals.push(g);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-56" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Team Approvals</h1>
        <p className="text-text-muted text-sm mt-1">Review and approve pending goals from your team</p>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState icon={<Flag size={40} />} title="No pending approvals" description="All goals have been reviewed — great work!" />
        </Card>
      ) : (
        Object.values(byEmployee).map(({ employee, goals: eGoals }) => (
          <div key={employee.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {employee.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{employee.name}</p>
                <p className="text-xs text-text-muted">{employee.email}</p>
              </div>
              <Badge variant="muted" className="ml-auto">{eGoals.length} pending</Badge>
            </div>

            {eGoals.map((goal) => (
              <Card key={goal.id} className="p-4 ml-11">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="muted">{goal.thrustArea}</Badge>
                      <span className={`text-xs font-mono font-bold ${uomColors[goal.uomType] ?? ''}`}>{goal.uomType}</span>
                    </div>
                    <h3 className="font-semibold text-text-primary">{goal.title}</h3>
                    {goal.description && <p className="text-sm text-text-muted mt-0.5">{goal.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-text-muted">
                      <span>Target: <span className="font-mono text-text-primary">{goal.target}</span></span>
                      <span>Weight: <span className="font-mono text-primary">{goal.weightage}%</span></span>
                      {goal.deadline && <span>Due: <span className="font-mono text-text-primary">{formatDate(goal.deadline)}</span></span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditGoal(goal); setEditForm({ target: String(goal.target), weightage: String(goal.weightage), comment: '' }); setEditErrors({}); setApiError(''); }}>
                      <Edit3 size={13} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => { setRejectGoal(goal); setComment(''); setApiError(''); }}>
                      <XCircle size={13} />
                      Reject
                    </Button>
                    <Button variant="success" size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate({ goalId: goal.id, comment: '' })}>
                      <CheckCircle size={13} />
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))
      )}

      {/* Reject modal */}
      <Modal open={!!rejectGoal} onClose={() => setRejectGoal(null)} title="Reject Goal">
        {rejectGoal && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">Rejecting: <strong className="text-text-primary">{rejectGoal.title}</strong></p>
            <Textarea label="Reason (recommended)" placeholder="Explain why this goal is being rejected..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
            {apiError && <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">{apiError}</div>}
            <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
              <Button variant="secondary" size="sm" onClick={() => setRejectGoal(null)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate({ goalId: rejectGoal.id, comment })}>
                Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editGoal} onClose={() => setEditGoal(null)} title="Edit Goal">
        {editGoal && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">Editing: <strong className="text-text-primary">{editGoal.title}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target" type="number" value={editForm.target} onChange={(e) => { setEditForm((p) => ({ ...p, target: e.target.value })); setEditErrors((p) => ({ ...p, target: '' })); }} error={editErrors.target} />
              <Input label="Weightage (%)" type="number" value={editForm.weightage} onChange={(e) => { setEditForm((p) => ({ ...p, weightage: e.target.value })); setEditErrors((p) => ({ ...p, weightage: '' })); }} min={10} max={100} error={editErrors.weightage} />
            </div>
            <Textarea label="Comment (optional)" value={editForm.comment} onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))} rows={2} />
            {apiError && <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">{apiError}</div>}
            <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
              <Button variant="secondary" size="sm" onClick={() => setEditGoal(null)}>Cancel</Button>
              <Button size="sm" loading={editMutation.isPending} onClick={() => {
                const e: Record<string, string> = {};
                const targetNum = Number(editForm.target);
                if (!editForm.target.trim() || isNaN(targetNum)) e.target = 'Must be a valid number';
                else if (targetNum < 0) e.target = 'Must be 0 or greater';
                const weightNum = Number(editForm.weightage);
                if (!editForm.weightage.trim() || isNaN(weightNum)) e.weightage = 'Must be a valid number';
                else if (weightNum < 10) e.weightage = 'Minimum is 10%';
                else if (weightNum > 100) e.weightage = 'Maximum is 100%';
                setEditErrors(e);
                if (Object.keys(e).length === 0) {
                  editMutation.mutate({ goalId: editGoal.id, data: { target: targetNum, weightage: weightNum, comment: editForm.comment } });
                }
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
