import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useActiveCycle } from '../../hooks/useCycles';
import { Button, Input, Textarea, Select, Card } from '../../components/ui';
import { getErrorMessage } from '../../lib/utils';
import { useToast } from '../../lib/toast';

const uomOptions = [
  { value: 'MIN', label: 'MIN — Higher actual is better (revenue, sales)' },
  { value: 'MAX', label: 'MAX — Lower actual is better (cost, defects)' },
  { value: 'TIMELINE', label: 'TIMELINE — Date-based delivery' },
  { value: 'ZERO', label: 'ZERO — Zero incidents = success' },
];

interface GoalForm {
  thrustArea: string;
  title: string;
  description: string;
  uomType: string;
  target: string;
  weightage: string;
  deadline: string;
}

export default function CreateGoalPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editId;

  const { data: cycle } = useActiveCycle();

  const [form, setForm] = useState<GoalForm>({
    thrustArea: '',
    title: '',
    description: '',
    uomType: 'MIN',
    target: '',
    weightage: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<Partial<GoalForm>>({});
  const [apiError, setApiError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useQuery({
    queryKey: ['goal', editId],
    queryFn: () => api.get(`/api/goals/${editId}`).then((r) => r.data),
    enabled: isEdit && !loaded,
    select: (data) => {
      if (!loaded) {
        setForm({
          thrustArea: data.thrustArea ?? '',
          title: data.title ?? '',
          description: data.description ?? '',
          uomType: data.uomType ?? 'MIN',
          target: String(data.target ?? ''),
          weightage: String(data.weightage ?? ''),
          deadline: data.deadline ? data.deadline.slice(0, 10) : '',
        });
        setLoaded(true);
      }
      return data;
    },
  });

  function set(field: keyof GoalForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const e: Partial<GoalForm> = {};
    if (!form.thrustArea.trim()) e.thrustArea = 'Required';
    if (form.thrustArea.trim().length > 50) e.thrustArea = 'Max 50 characters';
    if (!form.title.trim()) e.title = 'Required';
    if (form.title.trim().length > 120) e.title = 'Max 120 characters';
    if (!form.uomType) e.uomType = 'Required';
    const targetNum = Number(form.target);
    if (!form.target.trim() || isNaN(targetNum)) e.target = 'Must be a valid number';
    else if (targetNum < 0) e.target = 'Must be 0 or greater';
    else if (!Number.isFinite(targetNum)) e.target = 'Must be a finite number';
    const weightNum = Number(form.weightage);
    if (!form.weightage.trim() || isNaN(weightNum)) e.weightage = 'Must be a valid number';
    else if (weightNum < 10) e.weightage = 'Minimum weightage is 10%';
    else if (weightNum > 100) e.weightage = 'Maximum weightage is 100%';
    else if (!Number.isInteger(weightNum)) e.weightage = 'Must be a whole number';
    if (form.uomType === 'TIMELINE' && !form.deadline) e.deadline = 'Required for TIMELINE goals';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        cycleId: cycle!.id,
        thrustArea: form.thrustArea,
        title: form.title,
        description: form.description || undefined,
        uomType: form.uomType,
        target: Number(form.target),
        weightage: Number(form.weightage),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };
      return isEdit ? api.put(`/api/goals/${editId}`, payload) : api.post('/api/goals', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast('success', isEdit ? 'Goal updated' : 'Goal created');
      navigate('/employee/goals');
    },
    onError: (err) => {
      setApiError(getErrorMessage(err));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    if (validate()) mutation.mutate();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employee/goals')}>
          <ArrowLeft size={14} />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{isEdit ? 'Edit Goal' : 'Create Goal'}</h1>
          {cycle && (
            <p className="text-text-muted text-sm">
              Cycle: <span className="font-mono text-text-primary">{cycle.year} {cycle.phase}</span>
            </p>
          )}
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Thrust Area"
              placeholder="e.g. Sales, Engineering"
              value={form.thrustArea}
              onChange={(e) => set('thrustArea', e.target.value)}
              error={errors.thrustArea}
            />
            <Input
              label="Goal Title"
              placeholder="e.g. Increase Revenue by 20%"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />
          </div>

          <Textarea
            label="Description (optional)"
            placeholder="Describe the goal in more detail..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
          />

          <Select
            label="Unit of Measurement (UoM)"
            value={form.uomType}
            onChange={(e) => set('uomType', e.target.value)}
            options={uomOptions}
            error={errors.uomType}
          />

          {form.uomType && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm">
              <p className="text-primary font-medium text-xs uppercase tracking-wide mb-1">Formula</p>
              <p className="text-text-muted">
                {form.uomType === 'MIN' && 'Score = (actual / target) × 100, capped at 100%'}
                {form.uomType === 'MAX' && 'Score = (target / actual) × 100, capped at 100%'}
                {form.uomType === 'TIMELINE' && 'Score = 100% if completed on/before deadline, else 0%'}
                {form.uomType === 'ZERO' && 'Score = 100% if actual is 0, else 0%'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target"
              type="number"
              placeholder="e.g. 100"
              value={form.target}
              onChange={(e) => set('target', e.target.value)}
              error={errors.target}
              min={0}
            />
            <Input
              label="Weightage (%)"
              type="number"
              placeholder="e.g. 30"
              value={form.weightage}
              onChange={(e) => set('weightage', e.target.value)}
              error={errors.weightage}
              min={10}
              max={100}
            />
          </div>

          <Input
            label={form.uomType === 'TIMELINE' ? 'Deadline (required)' : 'Deadline (optional)'}
            type="date"
            value={form.deadline}
            onChange={(e) => set('deadline', e.target.value)}
            error={errors.deadline}
          />

          {apiError && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">
              {apiError}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
            <Button variant="secondary" type="button" onClick={() => navigate('/employee/goals')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>
              <Save size={14} />
              {isEdit ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
