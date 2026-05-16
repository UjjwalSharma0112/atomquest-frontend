import { useState } from 'react';
import { Plus, CreditCard as Edit3, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useCycles } from '../../hooks/useCycles';
import { Button, Card, Modal, Input, Select, Table, Tr, Td, Badge, Skeleton, EmptyState, statusBadge } from '../../components/ui';
import { getErrorMessage, formatDateTime, isActiveCycle } from '../../lib/utils';
import { useToast } from '../../lib/toast';

const phaseOptions = [
  { value: 'GOAL_SETTING', label: 'Goal Setting' },
  { value: 'Q1', label: 'Q1' },
  { value: 'Q2', label: 'Q2' },
  { value: 'Q3', label: 'Q3' },
  { value: 'Q4', label: 'Q4' },
];

interface CycleForm {
  year: string;
  phase: string;
  windowOpen: string;
  windowClose: string;
}

const defaultForm: CycleForm = { year: String(new Date().getFullYear()), phase: 'GOAL_SETTING', windowOpen: '', windowClose: '' };

export default function CyclesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cycles = [], isLoading } = useCycles();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCycle, setEditCycle] = useState<string | null>(null);
  const [form, setForm] = useState<CycleForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<CycleForm>>({});
  const [apiError, setApiError] = useState('');

  function openCreate() {
    setForm(defaultForm);
    setEditCycle(null);
    setFormErrors({});
    setApiError('');
    setModalOpen(true);
  }

  function openEdit(c: typeof cycles[0]) {
    setForm({
      year: String(c.year),
      phase: c.phase,
      windowOpen: c.windowOpen.slice(0, 16),
      windowClose: c.windowClose.slice(0, 16),
    });
    setEditCycle(c.id);
    setFormErrors({});
    setApiError('');
    setModalOpen(true);
  }

  function validateCycle(): boolean {
    const e: Partial<CycleForm> = {};
    const yearNum = Number(form.year);
    if (!form.year.trim() || isNaN(yearNum)) e.year = 'Must be a valid year';
    else if (yearNum < 2020 || yearNum > 2035) e.year = 'Must be between 2020 and 2035';
    if (!form.phase) e.phase = 'Required';
    if (!form.windowOpen) e.windowOpen = 'Required';
    if (!form.windowClose) e.windowClose = 'Required';
    else if (form.windowOpen && form.windowClose && new Date(form.windowClose) <= new Date(form.windowOpen)) e.windowClose = 'Must be after Window Open';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        year: Number(form.year),
        phase: form.phase,
        windowOpen: new Date(form.windowOpen).toISOString(),
        windowClose: new Date(form.windowClose).toISOString(),
      };
      return editCycle
        ? api.put(`/api/cycles/${editCycle}`, payload)
        : api.post('/api/cycles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast('success', editCycle ? 'Cycle updated' : 'Cycle created');
      setModalOpen(false);
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Cycle Management</h1>
          <p className="text-text-muted text-sm mt-1">Manage performance review cycles</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          Create Cycle
        </Button>
      </div>

      <Card>
        {cycles.length === 0 ? (
          <EmptyState icon={<Settings size={40} />} title="No cycles yet" description="Create your first performance cycle" />
        ) : (
          <Table headers={['Year', 'Phase', 'Window Open', 'Window Close', 'Status', '']}>
            {cycles.map((cycle) => {
              const active = isActiveCycle(cycle.windowOpen, cycle.windowClose);
              return (
                <Tr key={cycle.id}>
                  <Td><span className="font-mono font-bold text-text-primary">{cycle.year}</span></Td>
                  <Td>{statusBadge(cycle.phase)}</Td>
                  <Td><span className="text-xs font-mono text-text-muted">{formatDateTime(cycle.windowOpen)}</span></Td>
                  <Td><span className="text-xs font-mono text-text-muted">{formatDateTime(cycle.windowClose)}</span></Td>
                  <Td>
                    {active
                      ? <Badge variant="success">ACTIVE</Badge>
                      : <Badge variant="muted">INACTIVE</Badge>
                    }
                  </Td>
                  <Td>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(cycle)}>
                      <Edit3 size={12} />
                      Edit
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCycle ? 'Edit Cycle' : 'Create Cycle'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Year" type="number" value={form.year} onChange={(e) => { setForm((p) => ({ ...p, year: e.target.value })); setFormErrors((p) => ({ ...p, year: '' })); }} min={2020} max={2035} error={formErrors.year} />
            <Select label="Phase" value={form.phase} onChange={(e) => { setForm((p) => ({ ...p, phase: e.target.value })); setFormErrors((p) => ({ ...p, phase: '' })); }} options={phaseOptions} error={formErrors.phase} />
          </div>
          <Input label="Window Open" type="datetime-local" value={form.windowOpen} onChange={(e) => { setForm((p) => ({ ...p, windowOpen: e.target.value })); setFormErrors((p) => ({ ...p, windowOpen: '' })); }} error={formErrors.windowOpen} />
          <Input label="Window Close" type="datetime-local" value={form.windowClose} onChange={(e) => { setForm((p) => ({ ...p, windowClose: e.target.value })); setFormErrors((p) => ({ ...p, windowClose: '' })); }} error={formErrors.windowClose} />
          {apiError && <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">{apiError}</div>}
          <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" loading={mutation.isPending} onClick={() => { if (validateCycle()) mutation.mutate(); }}>{editCycle ? 'Save Changes' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
