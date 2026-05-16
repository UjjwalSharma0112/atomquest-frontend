import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Target, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useActiveCycle } from '../../hooks/useCycles';
import { Button, Card, Badge, ProgressBar, Skeleton, Modal, Textarea, EmptyState } from '../../components/ui';
import { statusBadge } from '../../components/ui';
import { formatDate, getErrorMessage } from '../../lib/utils';
import { useToast } from '../../lib/toast';

interface Goal {
  id: string;
  title: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  isLocked: boolean;
  deadline: string | null;
  description: string | null;
  approvals: { action: string; comment: string | null; createdAt: string }[];
}

const uomColors: Record<string, string> = {
  MIN: 'text-blue-400',
  MAX: 'text-green-400',
  TIMELINE: 'text-yellow-400',
  ZERO: 'text-purple-400',
};

export default function GoalsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: cycle, isLoading: cycleLoading } = useActiveCycle();
  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ['goals', cycle?.id],
    queryFn: () => api.get(`/api/goals?cycleId=${cycle!.id}`).then((r) => r.data),
    enabled: !!cycle?.id,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post('/api/goals/submit', { cycleId: cycle!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast('success', 'Goals submitted for approval');
      setConfirmSubmit(false);
    },
    onError: (err) => {
      setSubmitError(getErrorMessage(err));
    },
  });

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const draftGoals = goals.filter((g) => g.status === 'DRAFT');
  const hasDrafts = draftGoals.length > 0;

  if (cycleLoading || goalsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={40} className="text-warning mb-4 opacity-60" />
        <h2 className="text-lg font-semibold text-text-primary">No Active Cycle</h2>
        <p className="text-text-muted text-sm mt-2">There is no active performance cycle. Contact your admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">My Goals</h1>
          <p className="text-text-muted text-sm mt-1">
            Cycle: <span className="font-mono text-text-primary">{cycle.year} {cycle.phase}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {hasDrafts && (
            <Button variant="success" size="sm" onClick={() => { setSubmitError(''); setConfirmSubmit(true); }}>
              <Send size={14} />
              Submit All
            </Button>
          )}
          <Button size="sm" onClick={() => navigate('/employee/goals/new')}>
            <Plus size={14} />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Weightage bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Total Weightage</p>
          <span className={`font-mono text-sm font-bold ${totalWeightage === 100 ? 'text-success' : totalWeightage > 100 ? 'text-danger' : 'text-warning'}`}>
            {totalWeightage} / 100%
          </span>
        </div>
        <ProgressBar
          value={totalWeightage}
          max={100}
          color={totalWeightage === 100 ? 'bg-success' : totalWeightage > 100 ? 'bg-danger' : 'bg-primary'}
        />
        {totalWeightage !== 100 && (
          <p className="text-xs text-text-muted mt-2">
            {totalWeightage < 100 ? `${100 - totalWeightage}% remaining to reach 100%` : `${totalWeightage - 100}% over the limit`}
          </p>
        )}
      </Card>

      {/* Goals list */}
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target size={40} />}
            title="No goals yet"
            description="Add your first goal to get started with this cycle"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['goals'] })} />
          ))}
        </div>
      )}

      {/* Submit confirmation modal */}
      <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Submit Goals for Approval">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            You're about to submit <strong className="text-text-primary">{draftGoals.length}</strong> goal(s) for manager approval.
            Total weightage: <span className={`font-mono font-bold ${totalWeightage === 100 ? 'text-success' : 'text-danger'}`}>{totalWeightage}%</span>
          </p>
          {totalWeightage !== 100 && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">
              Total weightage must be exactly 100% before submitting.
            </div>
          )}
          {submitError && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">
              {submitError}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmSubmit(false)}>Cancel</Button>
            <Button
              variant="success"
              size="sm"
              loading={submitMutation.isPending}
              disabled={totalWeightage !== 100}
              onClick={() => submitMutation.mutate()}
            >
              <Send size={14} />
              Confirm Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GoalCard({ goal, onRefresh }: { goal: Goal; onRefresh: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/goals/${goal.id}`),
    onSuccess: () => {
      onRefresh();
      toast('success', 'Goal deleted');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const rejectedApproval = goal.approvals?.find((a) => a.action === 'REJECTED');

  return (
    <Card className="p-4 hover:border-primary/20 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {statusBadge(goal.status)}
            <Badge variant="muted">{goal.thrustArea}</Badge>
            <span className={`text-xs font-mono font-bold ${uomColors[goal.uomType] ?? 'text-text-muted'}`}>{goal.uomType}</span>
            {goal.isLocked && <Badge variant="warning">LOCKED</Badge>}
          </div>
          <h3 className="font-semibold text-text-primary mt-1">{goal.title}</h3>
          {goal.description && <p className="text-sm text-text-muted mt-0.5 line-clamp-2">{goal.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            <span>Target: <span className="font-mono text-text-primary">{goal.target}</span></span>
            <span>Weight: <span className="font-mono text-primary">{goal.weightage}%</span></span>
            {goal.deadline && <span>Due: <span className="font-mono text-text-primary">{formatDate(goal.deadline)}</span></span>}
          </div>
        </div>

        {goal.status === 'DRAFT' && (
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/employee/goals/edit/${goal.id}`)}>Edit</Button>
            <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button>
          </div>
        )}
      </div>

      {rejectedApproval && (
        <div className="mt-3 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm">
          <p className="text-danger font-medium text-xs uppercase tracking-wide mb-1">Rejection Reason</p>
          <p className="text-text-primary">{rejectedApproval.comment || 'No comment provided'}</p>
        </div>
      )}
    </Card>
  );
}
