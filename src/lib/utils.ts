export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function isActiveCycle(windowOpen: string, windowClose: string): boolean {
  const now = new Date();
  return new Date(windowOpen) <= now && new Date(windowClose) >= now;
}

export function scoreColor(score: string): string {
  const val = parseFloat(score);
  if (val >= 80) return 'text-success';
  if (val >= 50) return 'text-warning';
  return 'text-danger';
}

export function scoreBg(score: string): string {
  const val = parseFloat(score);
  if (val >= 80) return 'bg-success/10 text-success';
  if (val >= 50) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}
