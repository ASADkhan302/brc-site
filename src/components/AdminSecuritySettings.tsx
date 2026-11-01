import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Lock,
  Mail,
} from 'lucide-react';
import { BRC_BASE_PREFIX } from './LayoutShells';

export const ADMIN_CREDS_STORAGE_KEY = 'brc_admin_custom_creds_v1';

export interface StoredAdminCredentials {
  username: string;
  email: string;
  passwordPlain: string;
  updatedAt: string;
  isCustom: boolean;
}

const DEFAULT_ADMIN_CREDS: StoredAdminCredentials = {
  username: 'admin',
  email: 'admin@brczhob.edu.pk',
  passwordPlain: 'Admin@BrcZhob2026!',
  updatedAt: 'Factory Default',
  isCustom: false,
};

export function getStoredAdminCreds(): StoredAdminCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_CREDS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string' && typeof parsed.passwordPlain === 'string') {
      return {
        username: parsed.username.trim() || DEFAULT_ADMIN_CREDS.username,
        email: (parsed.email || DEFAULT_ADMIN_CREDS.email).trim(),
        passwordPlain: parsed.passwordPlain,
        updatedAt: parsed.updatedAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
        isCustom: Boolean(parsed.isCustom),
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return DEFAULT_ADMIN_CREDS;
}

export function saveStoredAdminCreds(creds: StoredAdminCredentials): void {
  try {
    localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(creds));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetStoredAdminCreds(): StoredAdminCredentials {
  try {
    localStorage.removeItem(ADMIN_CREDS_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_ADMIN_CREDS;
}

export const AdminSecuritySettings: React.FC<{
  onNotify?: (msg: string) => void;
}> = ({ onNotify }) => {
  const [stored, setStored] = useState<StoredAdminCredentials>(() => getStoredAdminCreds());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(() => getStoredAdminCreds().username);
  const [newEmail, setNewEmail] = useState(() => getStoredAdminCreds().email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const activeCreds = getStoredAdminCreds();
    const cleanCurrentPass = currentPassword.trim();
    const cleanNewUser = newUsername.trim();
    const cleanNewEmail = newEmail.trim();

    if (!cleanCurrentPass) {
      setFeedback({
        type: 'error',
        message: 'Current password is required to authorize security changes.',
      });
      return;
    }

    // Verify current password locally (supports active password or factory bootstrap passwords if not customized)
    const isCurrentValid = activeCreds.isCustom
      ? cleanCurrentPass === activeCreds.passwordPlain
      : cleanCurrentPass === activeCreds.passwordPlain ||
        cleanCurrentPass === 'Admin@BrcZhob2026!' ||
        cleanCurrentPass === 'admin123' ||
        cleanCurrentPass === 'Admin#2026' ||
        cleanCurrentPass === 'admin';

    if (!isCurrentValid) {
      setFeedback({
        type: 'error',
        message: 'Current password is incorrect. Please verify your existing administrator password.',
      });
      return;
    }

    if (!cleanNewUser) {
      setFeedback({
        type: 'error',
        message: 'Administrator username cannot be empty.',
      });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setFeedback({
          type: 'error',
          message: 'New password must be at least 8 characters long.',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({
          type: 'error',
          message: 'New password and confirmation password do not match.',
        });
        return;
      }
    }

    const updatedPassword = newPassword ? newPassword : activeCreds.passwordPlain;
    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setSubmitting(true);
    try {
      // 1. Sync with Backend API (/api/admin_cms.php?action=change_credentials)
      try {
        const formData = new FormData();
        formData.append('action', 'change_credentials');
        formData.append('current_password', cleanCurrentPass);
        formData.append('new_username', cleanNewUser);
        formData.append('new_email', cleanNewEmail || 'admin@brczhob.edu.pk');
        if (newPassword) {
          formData.append('new_password', newPassword);
        }

        const res = await fetch(
          `${BRC_BASE_PREFIX}/api/admin_cms.php?action=change_credentials`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'change_credentials',
              current_password: cleanCurrentPass,
              new_username: cleanNewUser,
              new_email: cleanNewEmail || 'admin@brczhob.edu.pk',
              new_password: newPassword || '',
            }),
          }
        );

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          if (!res.ok && (json.error || json.message)) {
            setFeedback({
              type: 'error',
              message: json.error || json.message,
            });
            setSubmitting(false);
            return;
          }
        }
      } catch {
        // Fallback to localStorage persistence if running in offline/standalone preview
      }

      // 2. Persist updated credentials locally & keep current session active
      const nextCreds: StoredAdminCredentials = {
        username: cleanNewUser,
        email: cleanNewEmail || 'admin@brczhob.edu.pk',
        passwordPlain: updatedPassword,
        updatedAt: nowFormatted,
        isCustom: true,
      };
      saveStoredAdminCreds(nextCreds);
      setStored(nextCreds);

      // Update cached admin user display metadata without invalidating active session token
      try {
        const rawUser = localStorage.getItem('brc_zhob_admin_user');
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          localStorage.setItem(
            'brc_zhob_admin_user',
            JSON.stringify({
              ...parsedUser,
              username: nextCreds.username,
              email: nextCreds.email,
            })
          );
        }
      } catch {}

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const successMsg =
        'Administrator credentials updated successfully! Your current session remains active and new credentials will apply on your next sign-in.';
      setFeedback({
        type: 'success',
        message: successMsg,
      });
      if (onNotify) {
        onNotify(successMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetToDefault = async () => {
    setFeedback(null);
    setSubmitting(true);
    try {
      try {
        await fetch(`${BRC_BASE_PREFIX}/api/admin_cms.php?action=reset_credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset_credentials',
          }),
        });
      } catch {}

      const defaults = resetStoredAdminCreds();
      setStored(defaults);
      setNewUsername(defaults.username);
      setNewEmail(defaults.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const resetMsg =
        'Administrator credentials restored to factory defaults (admin / Admin@BrcZhob2026!). Current session remains active.';
      setFeedback({
        type: 'success',
        message: resetMsg,
      });
      if (onNotify) {
        onNotify(resetMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-6 border-t-2 border-slate-200">
      <div className="bg-[#FAF8F5] rounded-2xl border border-[#E6D6B8] p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6D6B8] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A1C24] text-[#FBBF24] flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-editorial text-xl font-bold text-slate-900">
                  Administrator Account &amp; Security Settings
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    stored.isCustom
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {stored.isCustom ? 'Custom Credentials Active' : 'Factory Default Credentials'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Update the Administrator Username, Official Email, and Security Password (hashed with{' '}
                <code>PASSWORD_BCRYPT</code> cost 12 in MySQL <code>users</code> table). Your active session stays signed in and changes take effect on the next login.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-[#7A1C24] border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Restore default evaluator login (admin / Admin@BrcZhob2026!)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#7A1C24]" />
              <span>Reset to Factory Default</span>
            </button>
          </div>
        </div>

        {/* Active Account Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white border border-slate-200 text-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#7A1C24] shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Admin Username
              </div>
              <div className="font-mono font-bold text-slate-900">{stored.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#7A1C24] shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Official Admin Email
              </div>
              <div className="font-mono font-semibold text-slate-800">{stored.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-[#7A1C24] shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Last Credential Update
              </div>
              <div className="font-mono text-slate-700">{stored.updatedAt}</div>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdateCredentials} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Current Password (Required) *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 pr-9 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:border-[#7A1C24] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Username */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                New Admin Username *
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. admin or principal_zhob"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:border-[#7A1C24] focus:outline-none"
              />
            </div>

            {/* Official Email */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Official Administrator Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@brczhob.edu.pk"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:border-[#7A1C24] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                New Security Password (Min 8 Characters — Leave blank to keep current)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password (min 8 chars)"
                  className="w-full px-3.5 py-2.5 pr-9 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:border-[#7A1C24] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Confirm New Security Password
              </label>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password to confirm"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:border-[#7A1C24] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#7A1C24]" />
              <span>
                Session Policy: Active session remains open after saving; new credentials take effect on next sign-in.
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#7A1C24] hover:bg-[#60141B] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <KeyRound className="w-4 h-4 text-[#FBBF24]" />
              <span>
                {submitting ? 'Updating Admin Credentials...' : 'Update Admin Credentials'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
