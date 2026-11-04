import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, RefreshCw, CalendarDays, CreditCard } from 'lucide-react';

import gymService from '../services/gymService';
import { useAuth, canAccessGym } from '../context/AuthContext';

import {
  Badge,
  Empty,
  FormModal,
  Loading,
  Notice,
  Stat,
  buttonClass,
  secondaryClass,
  inputClass,
  panelClass,
  errorMessage,
  formatDate,
  formatMoney,
} from '../components/ui';

function GymAccount() {
  const { pathname } = useLocation();
  const { gym, refresh } = useAuth();

  const section = pathname.split('/')[2];

  const [data, setData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    name: gym?.name || '',
    phone: gym?.phone || '',
    address: gym?.address || '',
  });

  const load = useCallback(async () => {
    if (section === 'settings') return;

    setLoading(true);
    setError('');

    try {
      if (section === 'billing') {
        setData(await gymService.billing());
      } else if (section === 'staff') {
        const result = await gymService.staff();

        const rows = Array.isArray(result)
          ? result
          : result.memberships || result.staff;

        if (!Array.isArray(rows)) {
          throw new Error('Unexpected staff response.');
        }

        setStaff(rows);
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    setMessage('');
    setModal(null);
    load();
  }, [load]);

  async function saveSettings(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await gymService.update({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      setMessage('Gym settings saved.');
      await refresh(false);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function staffModal(member = null) {
    setModal({
      title: member ? 'Edit staff access' : 'Create staff account',
      initialValues: member
        ? {
            role: member.role,
            isActive: member.isActive ? 'true' : 'false',
          }
        : { role: 'receptionist' },
      fields: [
        ...(!member ? [
          {
            name: 'username',
            label: 'Username',
            required: true,
            maxLength: 80,
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            minLength: 12,
            required: true,
          },
        ] : []),
        {
          name: 'role',
          label: 'Role',
          required: true,
          options: [
            { value: 'manager', label: 'Manager' },
            { value: 'receptionist', label: 'Receptionist' },
          ],
        },
        ...(member ? [{
          name: 'isActive',
          label: 'Access',
          required: true,
          options: [
            { value: 'true', label: 'Enabled' },
            { value: 'false', label: 'Disabled' },
          ],
        }] : []),
      ],
      onSubmit: async (values) => {
        if (member) {
          await gymService.updateStaff(member._id, {
            role: values.role,
            isActive: values.isActive === 'true',
          });
        } else {
          await gymService.createStaff({
            username: values.username.trim(),
            password: values.password,
            role: values.role,
          });
        }

        setMessage('Staff account updated.');
        await load();
      },
    });
  }

  const billingGym = data?.gym || gym;
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-5">
      <Notice>{error}</Notice>
      <Notice success>{message}</Notice>

      {section !== 'settings' && (
        <div className="flex justify-end gap-3">
          <button
            onClick={load}
            disabled={loading}
            className={secondaryClass}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          {section === 'staff' && (
            <button onClick={() => staffModal()} className={buttonClass}>
              <Plus size={17} /> Add staff
            </button>
          )}
        </div>
      )}

      {loading ? <Loading /> : (
        <>
          {section === 'billing' && (
            <>
              {!canAccessGym(billingGym) && (
                <Notice>
                  Gym access is currently restricted. Contact the platform
                  administrator to renew access or resolve the gym status.
                </Notice>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Stat
                  label="Software access"
                  value={canAccessGym(billingGym) ? 'Available' : 'Restricted'}
                  icon={CreditCard}
                />
                <Stat
                  label="Access until"
                  value={
                    billingGym?.lifetimeAccess
                      ? 'Lifetime'
                      : formatDate(billingGym?.accessUntil)
                  }
                  icon={CalendarDays}
                />
              </div>

              <div className={`${panelClass} overflow-hidden`}>
                <div className="border-b border-white/10 p-5">
                  <h2 className="font-bold">Software invoice history</h2>
                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    These invoices cover your gym software. Contact the
                    platform administrator to arrange payment.
                  </p>
                </div>

                {invoices.length ? invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 p-5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{invoice.planName}</p>
                      <p className="mt-2 break-all text-xs text-zinc-500">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        {formatDate(invoice.periodStart)} — {
                          invoice.interval === 'one-time'
                            ? 'Lifetime'
                            : formatDate(invoice.periodEnd)
                        }
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="mb-2 font-bold">{formatMoney(invoice.amount)}</p>
                      <Badge good={invoice.status === 'paid'}>{invoice.status}</Badge>
                    </div>
                  </div>
                )) : <Empty text="No software invoices yet." />}
              </div>
            </>
          )}

          {section === 'staff' && (
            <div className={`${panelClass} divide-y divide-white/5`}>
              {!staff.length && <Empty text="No staff accounts found." />}

              {staff.map((member) => (
                <div
                  key={member._id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="font-semibold">
                      {member.userId?.username || 'Account unavailable'}
                    </p>
                    <p className="mt-2 text-xs capitalize text-zinc-500">
                      {member.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge good={member.isActive && member.userId?.isActive !== false}>
                      {member.isActive && member.userId?.isActive !== false
                        ? 'Enabled'
                        : 'Disabled'}
                    </Badge>

                    {member.role !== 'owner' && (
                      <button
                        onClick={() => staffModal(member)}
                        className={secondaryClass}
                      >
                        Edit access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'settings' && (
            <form
              onSubmit={saveSettings}
              className={`${panelClass} max-w-2xl space-y-5 p-6`}
            >
              {[
                ['name', 'Gym name', true, 120],
                ['phone', 'Phone', false, 30],
                ['address', 'Address', false, 500],
              ].map(([name, label, required, maxLength]) => (
                <div key={name}>
                  <label htmlFor={`gym-${name}`} className="mb-2 block text-sm">
                    {label}
                  </label>
                  <input
                    id={`gym-${name}`}
                    value={form[name]}
                    required={required}
                    maxLength={maxLength}
                    disabled={saving}
                    onChange={(event) =>
                      setForm((old) => ({ ...old, [name]: event.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}

              <p className="text-xs text-zinc-500">
                Currency: PKR · Billing timezone: Asia/Karachi
              </p>

              <button disabled={saving} className={buttonClass}>
                {saving ? 'Saving...' : 'Save gym settings'}
              </button>
            </form>
          )}
        </>
      )}

      {modal && (
        <FormModal {...modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

export default GymAccount;