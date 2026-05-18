import { useState } from "react";
import { Users, Save, UserPlus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  Button,
  Card,
  Table,
  Tr,
  Td,
  Badge,
  Skeleton,
  EmptyState,
  Select,
  Modal,
  Input,
} from "../../components/ui";
import { getErrorMessage, formatDate } from "../../lib/utils";
import { useToast } from "../../lib/toast";
import { useAuthStore } from "../../store/authStore";

interface User {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  managerId: string | null;
  manager: { id: string; name: string } | null;
  createdAt: string;
}

const roleOptions = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
];

const roleVariant = {
  EMPLOYEE: "info",
  MANAGER: "warning",
  ADMIN: "danger",
} as const;

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  managerId: "",
};

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: "", managerId: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/api/admin/users").then((r) => r.data),
  });

  const roleOrder: Record<string, number> = {
    ADMIN: 0,
    MANAGER: 1,
    EMPLOYEE: 2,
  };
  const sortedUsers = [...users].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role],
  );
  const managers = users.filter((u) => u.role === "MANAGER");

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.put(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast("success", "User updated");
      setEditId(null);
    },
    onError: (err) => toast("error", getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      role: string;
      managerId?: string;
    }) => api.post("/api/admin/users", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast("success", "User created");
      setCreateOpen(false);
      setCreateForm(emptyForm);
      setCreateError("");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || getErrorMessage(err);
      setCreateError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/admin/users/${userId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast("success", "User deleted");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast("error", getErrorMessage(err));
      setDeleteTarget(null);
    },
  });

  function handleCreate() {
    setCreateError("");
    if (
      !createForm.name.trim() ||
      !createForm.email.trim() ||
      !createForm.password.trim()
    ) {
      setCreateError("Name, email, and password are required");
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }
    if (createForm.role === "EMPLOYEE" && !createForm.managerId) {
      setCreateError("Employees must have a manager assigned");
      return;
    }
    const payload: Record<string, string> = {
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
      role: createForm.role,
    };
    if (createForm.role === "EMPLOYEE" && createForm.managerId)
      payload.managerId = createForm.managerId;
    createMutation.mutate(
      payload as {
        name: string;
        email: string;
        password: string;
        role: string;
        managerId?: string;
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            User Management
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {users.length} users registered
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCreateForm(emptyForm);
            setCreateError("");
            setCreateOpen(true);
          }}
        >
          <UserPlus size={14} />
          Create User
        </Button>
      </div>

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="No users found" />
        ) : (
          <Table headers={["User", "Role", "Manager", "Created", "Actions"]}>
            {sortedUsers.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {editId === user.id ? (
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, role: e.target.value }))
                      }
                      className="bg-bg-elevated border border-bg-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {roleOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                  )}
                </Td>
                <Td>
                  {editId === user.id ? (
                    <select
                      value={editForm.managerId}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          managerId: e.target.value,
                        }))
                      }
                      className="bg-bg-elevated border border-bg-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">No Manager</option>
                      {managers
                        .filter((m) => m.id !== user.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <span className="text-sm text-text-muted">
                      {user.manager?.name ?? "—"}
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="text-xs font-mono text-text-muted">
                    {formatDate(user.createdAt)}
                  </span>
                </Td>
                <Td>
                  {editId === user.id ? (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            id: user.id,
                            data: {
                              role: editForm.role,
                              managerId: editForm.managerId || null,
                            },
                          })
                        }
                      >
                        <Save size={12} />
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditId(user.id);
                          setEditForm({
                            role: user.role,
                            managerId: user.managerId ?? "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create User"
        width="max-w-md"
      >
        <div className="space-y-4">
          {createError && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-danger">
              {createError}
            </div>
          )}
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, name: e.target.value }))
            }
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@test.com"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, email: e.target.value }))
            }
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={createForm.password}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, password: e.target.value }))
            }
          />
          <Select
            label="Role"
            value={createForm.role}
            onChange={(e) =>
              setCreateForm((p) => ({
                ...p,
                role: e.target.value,
                managerId: e.target.value === "EMPLOYEE" ? p.managerId : "",
              }))
            }
            options={roleOptions}
          />
          {createForm.role === "EMPLOYEE" && (
            <Select
              label="Manager"
              value={createForm.managerId}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, managerId: e.target.value }))
              }
              options={[
                { value: "", label: "Select a manager..." },
                ...managers.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          )}
          <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              loading={createMutation.isPending}
              onClick={handleCreate}
            >
              <UserPlus size={13} />
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">
              {deleteTarget?.name}
            </span>
            ? This will also delete all their goals and check-ins.
          </p>
          <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              <Trash2 size={13} />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
