import { useState } from 'react';
import { Unlock, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCycles } from '../../hooks/useCycles';
import { Button, Card, Table, Tr, Td, Badge, Skeleton, EmptyState, Select, statusBadge } from '../../components/ui';
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
  isLocked: boolean;
  deadline: string | null;
  employee: { id: string; name: string; email: string };
  cycle: { id: string; year: number; phase: string };
}

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminGoalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cycles = [] } = useCycles();
  const [cycleId, setCycleId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['admin', 'goals', cycleId, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (cycleId) params.set('cycleId', cycleId);
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/api/admin/goals?${params}`).then((r) => r.data);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (goalId: string) => api.post(`/api/admin/goals/${goalId}/unlock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'goals'] });
      toast('success', 'Goal unlocked');
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  const cycleOptions = [
    { value: '', label: 'All Cycles' },
    ...cycles.map((c) => ({ value: c.id, label: `${c.year} — ${c.phase}` })),
  ];

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">All Goals</h1>
          <p className="text-text-muted text-sm mt-1">{goals.length} goals found</p>
        </div>
        <div className="flex gap-2">
          <div className="w-48">
            <Select value={cycleId} onChange={(e) => setCycleId(e.target.value)} options={cycleOptions} />
          </div>
          <div className="w-48">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusFilterOptions} />
          </div>
        </div>
      </div>

      <Card>
        {goals.length === 0 ? (
          <EmptyState icon={<Target size={40} />} title="No goals found" description="No goals match the current filters" />
        ) : (
          <Table headers={['Employee', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weight', 'Status', 'Locked', '']}>
            {goals.map((goal) => (
              <Tr key={goal.id}>
                <Td>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{goal.employee.name}</p>
                    <p className="text-xs text-text-muted">{goal.employee.email}</p>
                  </div>
                </Td>
                <Td>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{goal.title}</p>
                    <p className="text-xs font-mono text-text-muted">{goal.cycle.year} {goal.cycle.phase}</p>
                  </div>
                </Td>
                <Td><Badge variant="muted">{goal.thrustArea}</Badge></Td>
                <Td><span className="font-mono text-xs text-text-muted">{goal.uomType}</span></Td>
                <Td><span className="font-mono">{goal.target}</span></Td>
                <Td><span className="font-mono text-primary font-bold">{goal.weightage}%</span></Td>
                <Td>{statusBadge(goal.status)}</Td>
                <Td>
                  {goal.isLocked
                    ? <Badge variant="warning">LOCKED</Badge>
                    : <span className="text-text-muted text-xs">—</span>
                  }
                </Td>
                <Td>
                  {goal.isLocked && (
                    <Button variant="secondary" size="sm" loading={unlockMutation.isPending} onClick={() => unlockMutation.mutate(goal.id)}>
                      <Unlock size={12} />
                      Unlock
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
