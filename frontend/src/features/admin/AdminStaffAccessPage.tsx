import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Shield,
  UserMinus,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  status: string;
  createdAt: string;
}

export const AdminStaffAccessPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<{ staff: StaffMember[]; instruction?: string; revocationNote?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Invite Admin Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [isInviting, setIsInviting] = useState(false);

  // Change Role Modal state
  const [changeRoleTarget, setChangeRoleTarget] = useState<StaffMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Revoke Access Modal state
  const [revokeTarget, setRevokeTarget] = useState<StaffMember | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkRevokeModalOpen, setIsBulkRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const res = await api.get('/admin/staff');
      setData(res.data);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load staff list.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setFeedback(null);
    try {
      const res = await api.post('/admin/staff/invite', {
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim() || undefined,
        lastName: inviteLastName.trim() || undefined,
        role: inviteRole,
      });

      setFeedback({
        type: 'success',
        message: res.data?.message || `Admin access granted to ${inviteEmail}.`,
      });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteRole('ADMIN');
      fetchStaff();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to grant admin access.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenChangeRole = (member: StaffMember) => {
    setChangeRoleTarget(member);
    setSelectedRole(member.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN');
  };

  const handleSaveChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRoleTarget) return;

    setIsSavingRole(true);
    setFeedback(null);
    try {
      await api.patch(`/admin/staff/${changeRoleTarget.id}/role`, {
        role: selectedRole,
      });
      setFeedback({
        type: 'success',
        message: `Role for ${changeRoleTarget.firstName} ${changeRoleTarget.lastName} updated to ${selectedRole}.`,
      });
      setChangeRoleTarget(null);
      fetchStaff();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to change role.',
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;

    setIsRevoking(true);
    setFeedback(null);
    try {
      const res = await api.delete(`/admin/staff/${revokeTarget.id}`);
      setFeedback({
        type: 'success',
        message:
          res.data?.message ||
          'Revoking access removes this person’s administration permissions.',
      });
      setRevokeTarget(null);
      fetchStaff();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to revoke administration access.',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const revokableStaff = (data?.staff || []).filter((s) => s.id !== currentUser?.id);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === revokableStaff.length && revokableStaff.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(revokableStaff.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const executeBulkRevokeStaff = async () => {
    if (selectedIds.length === 0) return;
    setIsRevoking(true);
    setFeedback(null);
    try {
      const res = await api.post('/admin/staff/bulk-revoke', { ids: selectedIds });
      setFeedback({
        type: 'success',
        message: `Successfully revoked administrative access for ${res.data.revokedCount} staff members.`,
      });
      setSelectedIds([]);
      setIsBulkRevokeModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to revoke staff access.',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Admin access</h2>
          <p className="text-xs text-gray-600">
            Grant staff only the access they need.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs cursor-pointer"
            title="Refresh staff list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-[#102641] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Invite admin
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-[#e3f4ed] border-[#c4ded6] text-[#087b63]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'staff member' : 'staff members'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Deselect all
            </button>
            <button
              onClick={() => setIsBulkRevokeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Revoke Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Staff List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sterling-navy"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={revokableStaff.length > 0 && selectedIds.length === revokableStaff.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.staff?.map((s) => {
                  const isCurrent = s.id === currentUser?.id;
                  const initial = (s.firstName?.[0] || s.email?.[0] || 'A').toUpperCase();

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 transition ${
                        selectedIds.includes(s.id) ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 w-10 text-center">
                        {!isCurrent ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => handleToggleSelectOne(s.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#102641] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>
                                {s.firstName} {s.lastName}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            s.role === 'SUPER_ADMIN'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-[#102641] border border-slate-200'
                          }`}
                        >
                          {s.role === 'SUPER_ADMIN'
                            ? 'Super Admin'
                            : s.role === 'ADMIN'
                            ? 'Content Admin'
                            : s.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleOpenChangeRole(s)}
                            className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            title="Change staff role"
                          >
                            <Shield className="w-3 h-3 mr-1 text-[#087b63]" /> Change role
                          </button>
                          {!isCurrent ? (
                            <button
                              onClick={() => setRevokeTarget(s)}
                              className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                              title="Revoke admin access"
                            >
                              <UserMinus className="w-3 h-3 mr-1" /> Revoke access
                            </button>
                          ) : (
                            <span
                              className="text-[10px] text-slate-400 italic px-2"
                              title="You cannot revoke your own admin permissions"
                            >
                              Current session
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Invite Admin Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite admin"
        description="Grant staff only the access they need."
        maxWidth="md"
      >
        <form onSubmit={handleInviteAdmin} className="space-y-4 pt-2">
          <Input
            label="Staff email address"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@sterling.org"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name (optional)"
              type="text"
              value={inviteFirstName}
              onChange={(e) => setInviteFirstName(e.target.value)}
              placeholder="e.g. Jane"
            />
            <Input
              label="Last name (optional)"
              type="text"
              value={inviteLastName}
              onChange={(e) => setInviteLastName(e.target.value)}
              placeholder="e.g. Doe"
            />
          </div>

          <Select
            label="Administrative Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')}
            options={[
              { value: 'ADMIN', label: 'Content Admin — Manage opportunities, assessments & rules' },
              { value: 'SUPER_ADMIN', label: 'Super Admin — Full system administration' },
            ]}
          />

          <p className="text-[11px] text-[#627086] leading-relaxed">
            Staff will receive administrator access upon invite. If the user does not yet have an account, a staff account will be provisioned.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isInviting}
            >
              Invite admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Change Role Modal */}
      <Modal
        isOpen={Boolean(changeRoleTarget)}
        onClose={() => setChangeRoleTarget(null)}
        title="Change role"
        description="Grant staff only the access they need."
        maxWidth="sm"
      >
        {changeRoleTarget && (
          <form onSubmit={handleSaveChangeRole} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Staff Member
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {changeRoleTarget.firstName} {changeRoleTarget.lastName}
              </span>
              <span className="text-slate-500 text-[11px]">{changeRoleTarget.email}</span>
            </div>

            <Select
              label="Select New Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')}
              options={[
                { value: 'ADMIN', label: 'Content Admin — Manage opportunities, assessments & rules' },
                { value: 'SUPER_ADMIN', label: 'Super Admin — Full system administration' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setChangeRoleTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingRole}
              >
                Change role
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 3. Revoke Access Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleConfirmRevoke}
        title="Revoke access"
        description="Revoking access removes this person’s administration permissions."
        confirmLabel="Revoke access"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isRevoking}
      />
      {/* Bulk Revoke Access Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkRevokeModalOpen}
        onClose={() => setIsBulkRevokeModalOpen(false)}
        onConfirm={executeBulkRevokeStaff}
        title={`Revoke access for ${selectedIds.length} staff members?`}
        description={`Are you sure you want to revoke administrative permissions for these ${selectedIds.length} selected staff members? They will be demoted to standard user accounts.`}
        confirmLabel={isRevoking ? 'Revoking...' : `Revoke ${selectedIds.length} Members`}
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isRevoking}
      />
    </div>
  );
};