import React from 'react';
import { Loader2 } from 'lucide-react';

// Badge
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-blue-500/10 text-blue-400',
  muted: 'bg-bg-elevated text-text-muted',
};
export function Badge({ variant = 'default', children, className = '' }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wide ${badgeStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    DRAFT: 'muted',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    ON_TRACK: 'success',
    COMPLETED: 'success',
    NOT_STARTED: 'muted',
    PENDING: 'warning',
    GOAL_SETTING: 'info',
    Q1: 'info', Q2: 'info', Q3: 'info', Q4: 'info',
  };
  return <Badge variant={map[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Badge>;
}

// Button
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
const btnBase = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base';
const btnSizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
const btnVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white focus:ring-primary',
  secondary: 'bg-bg-elevated hover:bg-bg-border text-text-primary border border-bg-border focus:ring-bg-border',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 focus:ring-danger',
  ghost: 'hover:bg-bg-elevated text-text-muted hover:text-text-primary focus:ring-bg-border',
  success: 'bg-success/10 hover:bg-success/20 text-success border border-success/20 focus:ring-success',
};
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`${btnBase} ${btnSizes[size]} ${btnVariants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// Card
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-surface border border-bg-border rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</label>}
      <input
        className={`bg-bg-elevated border ${error ? 'border-danger' : 'border-bg-border'} text-text-primary placeholder-text-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</label>}
      <textarea
        className={`bg-bg-elevated border ${error ? 'border-danger' : 'border-bg-border'} text-text-primary placeholder-text-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</label>}
      <select
        className={`bg-bg-elevated border ${error ? 'border-danger' : 'border-bg-border'} text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors ${className}`}
        {...props}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 bg-bg-surface border border-bg-border rounded-xl shadow-2xl w-full ${width} animate-in`}>
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-bg-elevated rounded">
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-bg-elevated rounded ${className}`} />;
}

export function SkeletonTable({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Table
export function Table({ headers, children, className = '' }: { headers: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-bg-border ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border bg-bg-elevated">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={`hover:bg-bg-elevated/50 transition-colors ${className}`}>{children}</tr>;
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-text-primary ${className}`}>{children}</td>;
}

// Empty state
export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-text-muted opacity-40">{icon}</div>}
      <p className="text-text-primary font-medium">{title}</p>
      {description && <p className="text-text-muted text-sm mt-1">{description}</p>}
    </div>
  );
}

// Progress bar
export function ProgressBar({ value, max = 100, color = 'bg-primary' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-bg-elevated rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Stats card
export function StatCard({ label, value, sub, color = 'text-primary' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
      <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-2">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}
