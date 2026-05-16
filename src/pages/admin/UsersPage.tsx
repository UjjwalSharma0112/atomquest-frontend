import { useState } from 'react';
import { Users, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button, Card, Table, Tr, Td, Badge, Skeleton, EmptyState, Select } from '../../components/ui';
import { getErrorMessage, formatDate } from '../../lib/utils';
import { useToast } from '../../lib/toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  managerId: string | null;
  manager: { id: string; name: string } | null;
  createdAt: string;
}

const roleOptions = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

const roleVariant = { EMPLOYEE: 'info', MANAGER: 'warning', ADMIN: 'danger' } as const;

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: '', managerId: '' });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/api/admin/users').then((r) => r.data),
  });

  const managers = users.filter((u) => u.role === 'MANAGER');

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => api.put(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast('success', 'User updated');
      setEditId(null);
    },
    onError: (err) => toast('error', getErrorMessage(err)),
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary">User Management</h1>
        <p className="text-text-muted text-sm mt-1">{users.length} users registered</p>
      </div>

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="No users found" />
        ) : (
          <Table headers={['User', 'Role', 'Manager', 'Created', 'Actions']}>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{user.name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {editId === user.id ? (
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                      className="bg-bg-elevated border border-bg-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                  )}
                </Td>
                <Td>
                  {editId === user.id ? (
                    <select
                      value={editForm.managerId}
                      onChange={(e) => setEditForm((p) => ({ ...p, managerId: e.target.value }))}
                      className="bg-bg-elevated border border-bg-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">No Manager</option>
                      {managers.filter((m) => m.id !== user.id).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-text-muted">{user.manager?.name ?? '—'}</span>
                  )}
                </Td>
                <Td><span className="text-xs font-mono text-text-muted">{formatDate(user.createdAt)}</span></Td>
                <Td>
                  {editId === user.id ? (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        loading={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({
                          id: user.id,
                          data: { role: editForm.role, managerId: editForm.managerId || null }
                        })}
                      >
                        <Save size={12} />
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setEditId(user.id); setEditForm({ role: user.role, managerId: user.managerId ?? '' }); }}
                    >
                      Edit
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
