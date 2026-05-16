import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useActiveCycle } from '../../hooks/useCycles';
import { Card, Table, Tr, Td, Badge, Skeleton, EmptyState, Select, statusBadge } from '../../components/ui';
import { Layers } from 'lucide-react';
import { formatDate } from '../../lib/utils';

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
}

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AllTeamGoalsPage() {
  const { data: cycle } = useActiveCycle();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['approvals', 'team', 'all', cycle?.id],
    queryFn: () => api.get(`/api/approvals/team/all?cycleId=${cycle!.id}`).then((r) => r.data),
    enabled: !!cycle?.id,
  });

  const filtered = statusFilter ? goals.filter((g) => g.status === statusFilter) : goals;

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-56" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">All Team Goals</h1>
          {cycle && <p className="text-text-muted text-sm mt-1">Cycle: <span className="font-mono text-text-primary">{cycle.year} {cycle.phase}</span></p>}
        </div>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusFilterOptions}
          />
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<Layers size={40} />} title="No goals found" description="No goals match the current filters" />
        ) : (
          <Table headers={['Employee', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weight', 'Status', 'Locked', 'Deadline']}>
            {filtered.map((goal) => (
              <Tr key={goal.id}>
                <Td>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{goal.employee.name}</p>
                    <p className="text-xs text-text-muted">{goal.employee.email}</p>
                  </div>
                </Td>
                <Td><span className="text-sm font-medium text-text-primary">{goal.title}</span></Td>
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
                <Td><span className="text-xs font-mono text-text-muted">{formatDate(goal.deadline)}</span></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
