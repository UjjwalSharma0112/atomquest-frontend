import { useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useActiveCycle } from '../../hooks/useCycles';
import { Button, Card, Modal, Select, Input, Table, Tr, Td, Skeleton, EmptyState, statusBadge } from '../../components/ui';
import { getErrorMessage, formatDate } from '../../lib/utils';
import { useToast } from '../../lib/toast';

interface CheckIn {
  id: string;
  goalId: string;
  quarter: string;
  planned: number;
  actual: number;
  status: string;
  managerComment: string | null;
  completionDate: string | null;
  goal: { id: string; title: string; uomType: string; target: number; weightage: number };
  score: string;
}

interface ApprovedGoal {
  id: string;
  title: string;
  uomType: string;
  target: number;
}

const quarterOptions = [
  { value: 'Q1', label: 'Q1' },
  { value: 'Q2', label: 'Q2' },
  { value: 'Q3', label: 'Q3' },
  { value: 'Q4', label: 'Q4' },
  { value: 'GOAL_SETTING', label: 'Goal Setting' },
];

const statusOptions = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ON_TRACK', label: 'On Track' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function CheckInsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cycle } = useActiveCycle();

  const { data: checkIns = [], isLoading } = useQuery<CheckIn[]>({
    queryKey: ['checkins', 'my', cycle?.id],
    queryFn: () => api.get(`/api/checkins/my?cycleId=${cycle!.id}`).then((r) => r.data),
    enabled: !!cycle?.id,
  });

  const { data: allGoals = [] } = useQuery<ApprovedGoal[]>({
    queryKey: ['goals', cycle?.id],
    queryFn: () => api.get(`/api/goals?cycleId=${cycle!.id}`).then((r) => r.data),
    enabled: !!cycle?.id,
    select: (data) => data.filter((g: { status: string }) => g.status === 'APPROVED'),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ApprovedGoal | null>(null);
  const [form, setForm] = useState({ goalId: '', quarter: 'Q1', planned: '', actual: '', status: 'ON_TRACK', completionDate: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  function openModal(goal?: ApprovedGoal) {
    setSelectedGoal(goal ?? null);
    setForm({ goalId: goal?.id ?? '', quarter: 'Q1', planned: '', actual: '', status: 'ON_TRACK', completionDate: '' });
    setFormErrors({});
    setApiError('');
    setModalOpen(true);
  }

  function validateCheckIn(): boolean {
    const e: Record<string, string> = {};
    if (!form.goalId) e.goalId = 'Select a goal';
    if (!form.quarter) e.quarter = 'Select a quarter';
    const plannedNum = Number(form.planned);
    if (!form.planned.trim() || isNaN(plannedNum)) e.planned = 'Must be a valid number';
    else if (plannedNum < 0) e.planned = 'Must be 0 or greater';
    const actualNum = Number(form.actual);
    if (!form.actual.trim() || isNaN(actualNum)) e.actual = 'Must be a valid number';
    else if (actualNum < 0) e.actual = 'Must be 0 or greater';
    if (!form.status) e.status = 'Select a status';
    if (currentGoal?.uomType === 'TIMELINE' && !form.completionDate) e.completionDate = 'Required for TIMELINE goals';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () => api.post('/api/checkins', {
      goalId: form.goalId,
      quarter: form.quarter,
      planned: Number(form.planned),
      actual: Number(form.actual),
      status: form.status,
      completionDate: form.completionDate ? new Date(form.completionDate).toISOString() : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      toast('success', 'Check-in logged successfully');
      setModalOpen(false);
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  const currentGoal = selectedGoal ?? allGoals.find((g) => g.id === form.goalId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">My Check-ins</h1>
          {cycle && <p className="text-text-muted text-sm mt-1">Cycle: <span className="font-mono text-text-primary">{cycle.year} {cycle.phase}</span></p>}
        </div>
        {allGoals.length > 0 && (
          <Button size="sm" onClick={() => openModal()}>
            <Plus size={14} />
            Log Check-in
          </Button>
        )}
      </div>

      <Card>
        {checkIns.length === 0 ? (
          <EmptyState icon={<Activity size={40} />} title="No check-ins yet" description="Check-ins are available once your goals are approved" />
        ) : (
          <Table headers={['Goal', 'Quarter', 'Planned', 'Actual', 'Score', 'Status', 'Manager Comment']}>
            {checkIns.map((ci) => (
              <Tr key={ci.id}>
                <Td>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{ci.goal.title}</p>
                    <p className="text-xs text-text-muted font-mono">{ci.goal.uomType}</p>
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
                  <p className="text-sm text-text-muted max-w-xs truncate">{ci.managerComment ?? '—'}</p>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Check-in">
        <div className="space-y-4">
          <Select
            label="Goal"
            value={form.goalId}
            onChange={(e) => { setForm((p) => ({ ...p, goalId: e.target.value })); setFormErrors((p) => ({ ...p, goalId: '' })); }}
            options={[{ value: '', label: 'Select a goal...' }, ...allGoals.map((g) => ({ value: g.id, label: g.title }))]}
            error={formErrors.goalId}
          />
          <Select
            label="Quarter"
            value={form.quarter}
            onChange={(e) => { setForm((p) => ({ ...p, quarter: e.target.value })); setFormErrors((p) => ({ ...p, quarter: '' })); }}
            options={quarterOptions}
            error={formErrors.quarter}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Planned" type="number" value={form.planned} onChange={(e) => { setForm((p) => ({ ...p, planned: e.target.value })); setFormErrors((p) => ({ ...p, planned: '' })); }} min={0} error={formErrors.planned} />
            <Input label="Actual" type="number" value={form.actual} onChange={(e) => { setForm((p) => ({ ...p, actual: e.target.value })); setFormErrors((p) => ({ ...p, actual: '' })); }} min={0} error={formErrors.actual} />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => { setForm((p) => ({ ...p, status: e.target.value })); setFormErrors((p) => ({ ...p, status: '' })); }}
            options={statusOptions}
            error={formErrors.status}
          />
          {currentGoal?.uomType === 'TIMELINE' && (
            <Input label="Completion Date" type="date" value={form.completionDate} onChange={(e) => { setForm((p) => ({ ...p, completionDate: e.target.value })); setFormErrors((p) => ({ ...p, completionDate: '' })); }} error={formErrors.completionDate} />
          )}
          {apiError && <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">{apiError}</div>}
          <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" loading={mutation.isPending} onClick={() => { if (validateCheckIn()) mutation.mutate(); }}>Submit Check-in</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function scoreBg(score: string) {
  const val = parseFloat(score);
  if (val >= 80) return 'bg-success/10 text-success';
  if (val >= 50) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}
