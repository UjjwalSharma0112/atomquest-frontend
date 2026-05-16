import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Table, Tr, Td, Badge, Skeleton, EmptyState, Input } from '../../components/ui';
import { formatDateTime } from '../../lib/utils';

interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  changedBy: string;
  goalId: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: string;
  changer: { id: string; name: string; role: string };
}

const roleVariant: Record<string, string> = { EMPLOYEE: 'info', MANAGER: 'warning', ADMIN: 'danger' };

export default function AuditPage() {
  const [goalIdFilter, setGoalIdFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['audit', goalIdFilter],
    queryFn: () => {
      const params = goalIdFilter ? `?goalId=${goalIdFilter}` : '';
      return api.get(`/api/admin/audit${params}`).then((r) => r.data);
    },
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Audit Log</h1>
          <p className="text-text-muted text-sm mt-1">{entries.length} entries</p>
        </div>
        <div className="w-72">
          <Input
            placeholder="Filter by Goal ID..."
            value={goalIdFilter}
            onChange={(e) => setGoalIdFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {entries.length === 0 ? (
          <EmptyState icon={<FileText size={40} />} title="No audit entries" description="No changes have been recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border bg-bg-elevated">
                  {['', 'Entity', 'Changed By', 'Changes', 'Timestamp'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {entries.map((entry) => (
                  <>
                    <Tr key={entry.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                      <Td className="w-8">
                        {expandedId === entry.id
                          ? <ChevronDown size={14} className="text-text-muted" />
                          : <ChevronRight size={14} className="text-text-muted" />
                        }
                      </Td>
                      <Td>
                        <div>
                          <Badge variant="muted">{entry.entityType}</Badge>
                          <p className="text-xs font-mono text-text-dim mt-1 max-w-[180px] truncate">{entry.entityId}</p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {entry.changer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{entry.changer.name}</p>
                            <Badge variant={(roleVariant[entry.changer.role] ?? 'muted') as 'info' | 'warning' | 'danger' | 'muted'}>{entry.changer.role}</Badge>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex gap-3 text-xs">
                          {Object.keys(entry.after).map((k) => (
                            <span key={k} className="text-text-muted">
                              <span className="text-text-primary">{k}</span>:{' '}
                              <span className="font-mono text-danger">{String(entry.before?.[k] ?? '—')}</span>
                              {' → '}
                              <span className="font-mono text-success">{String(entry.after[k])}</span>
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td><span className="text-xs font-mono text-text-muted">{formatDateTime(entry.createdAt)}</span></Td>
                    </Tr>
                    {expandedId === entry.id && (
                      <tr key={`${entry.id}-detail`} className="bg-bg-elevated/50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-danger uppercase mb-2">Before</p>
                              <pre className="text-xs font-mono text-text-muted bg-bg-base rounded-lg p-3 overflow-auto max-h-40">
                                {JSON.stringify(entry.before, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-success uppercase mb-2">After</p>
                              <pre className="text-xs font-mono text-text-muted bg-bg-base rounded-lg p-3 overflow-auto max-h-40">
                                {JSON.stringify(entry.after, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
