import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  Building2,
  CreditCard,
  Receipt,
  Wallet,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

import platformService from '../services/platformService';
import { getId, canAccessGym } from '../context/AuthContext';

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

function readList(data, key) {
  const rows = Array.isArray(data) ? data : data?.[key];

  if (!Array.isArray(rows)) {
    throw new Error(`Unexpected ${key} response.`);
  }

  return rows;
}

function Platform() {
  const { pathname } = useLocation();

  const section = pathname.split('/')[2] || 'overview';

  const [gyms, setGyms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [gymData, planData, invoiceData] = await Promise.all([
        platformService.getGyms(),
        platformService.getPlans(),
        platformService.getInvoices(),
      ]);

      setGyms(readList(gymData, 'gyms'));
      setPlans(readList(planData, 'plans'));
      setInvoices(readList(invoiceData, 'invoices'));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSearch('');
    setMessage('');
    setModal(null);
  }, [pathname]);

  async function mutate(action, successMessage) {
    await action();

    setMessage(successMessage);

    // A refresh failure must not imply that the mutation failed.
    await load();
  }

  function createGymModal() {
    setModal({
      title: 'Create gym workspace',
      description: 'Create a gym and assign its owner account.',
      submitLabel: 'Create gym',
      initialValues: { trialDays: '7' },
      fields: [
        { name: 'name', label: 'Gym name', required: true, maxLength: 120 },
        {
          name: 'slug',
          label: 'Unique gym slug',
          required: true,
          placeholder: 'fitness-zone',
          hint: 'Lowercase letters, numbers and hyphens.',
        },
        { name: 'phone', label: 'Phone', maxLength: 30 },
        { name: 'address', label: 'Address', maxLength: 500 },
        {
          name: 'ownerUsername',
          label: 'Owner username',
          required: true,
          maxLength: 80,
        },
        {
          name: 'ownerPassword',
          label: 'Owner password',
          type: 'password',
          minLength: 12,
          hint: 'Required for a new account. Leave empty when assigning an existing owner account.',
        },
        {
          name: 'trialDays',
          label: 'Initial access days',
          type: 'number',
          min: 0,
          max: 30,
          step: 1,
          required: true,
        },
      ],
      onSubmit: (values) => {
        const payload = {
          name: values.name.trim(),
          slug: values.slug.trim().toLowerCase(),
          phone: values.phone || '',
          address: values.address || '',
          ownerUsername: values.ownerUsername.trim(),
          trialDays: Number(values.trialDays),
        };

        if (values.ownerPassword) {
          payload.ownerPassword = values.ownerPassword;
        }

        return mutate(
          () => platformService.createGym(payload),
          'Gym workspace created successfully.'
        );
      },
    });
  }

  function planModal(plan = null) {
    setModal({
      title: plan ? 'Edit software plan' : 'Create software plan',
      description: plan
        ? 'Existing invoices retain their original price.'
        : 'Choose the software price and billing interval.',
      initialValues: plan
        ? { name: plan.name, price: plan.price }
        : { interval: 'monthly' },
      fields: [
        { name: 'name', label: 'Plan name', required: true, maxLength: 100 },
        {
          name: 'price',
          label: 'Price (PKR)',
          type: 'number',
          min: 0.01,
          max: 1000000000,
          step: '0.01',
          required: true,
        },
        ...(!plan ? [{
          name: 'interval',
          label: 'Billing interval',
          required: true,
          options: [
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
            { value: 'one-time', label: 'One-time / lifetime access' },
          ],
        }] : []),
      ],
      onSubmit: (values) => mutate(
        () => {
          const payload = {
            name: values.name.trim(),
            price: Number(values.price),
          };

          return plan
            ? platformService.updatePlan(plan._id, payload)
            : platformService.createPlan({
                ...payload,
                interval: values.interval,
              });
        },
        'Software plan saved.'
      ),
    });
  }

  function invoiceModal(gym = null) {
    setModal({
      title: 'Issue software invoice',
      description: 'This invoice bills a gym for software access.',
      submitLabel: 'Issue invoice',
      initialValues: { gymId: gym?._id || '' },
      fields: [
        {
          name: 'gymId',
          label: 'Gym',
          required: true,
          options: gyms.map((item) => ({
            value: item._id,
            label: item.name,
          })),
        },
        {
          name: 'planId',
          label: 'Plan',
          required: true,
          options: plans.filter((item) => item.isActive).map((item) => ({
            value: item._id,
            label: `${item.name} — ${formatMoney(item.price)} / ${item.interval}`,
          })),
        },
      ],
      onSubmit: (values) => mutate(
        () => platformService.issueInvoice(values.gymId, values.planId),
        'Software invoice is ready.'
      ),
    });
  }

  function statusModal(gym) {
    setModal({
      title: `Manage ${gym.name}`,
      description: 'Changing status does not extend the software access period.',
      initialValues: { status: gym.status },
      fields: [{
        name: 'status',
        label: 'Gym status',
        required: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' },
          { value: 'closed', label: 'Closed' },
        ],
      }],
      onSubmit: (values) => mutate(
        () => platformService.updateGymStatus(gym._id, values.status),
        'Gym status updated.'
      ),
    });
  }

  function resetPasswordModal(gym) {
    const userId = getId(gym.ownerId);

    if (!userId) {
      setError('Owner account ID is missing.');
      return;
    }

    setModal({
      title: 'Reset owner password',
      description: `Reset ${gym.name}'s owner password. Existing owner sessions will be invalidated.`,
      submitLabel: 'Reset password',
      fields: [{
        name: 'newPassword',
        label: 'New password',
        type: 'password',
        minLength: 12,
        required: true,
      }],
      onSubmit: (values) => mutate(
        () => platformService.resetPassword(userId, values.newPassword),
        'Owner password reset.'
      ),
    });
  }

  function payModal(invoice) {
    // Stable across modal retries and refreshes for this invoice.
    const idempotencyKey = `platform-payment-${invoice._id}`;

    setModal({
      title: 'Record software payment',
      description: `Confirm only after receiving ${formatMoney(invoice.amount)}. This records the full payment and applies the invoice access period.`,
      submitLabel: 'Confirm payment received',
      fields: [{
        name: 'reference',
        label: 'Payment reference',
        maxLength: 200,
        placeholder: 'Bank reference or cash receipt',
      }],
      onSubmit: (values) => mutate(
        () => platformService.payInvoice(invoice._id, {
          idempotencyKey,
          reference: values.reference || '',
        }),
        'Software payment recorded. Access period updated.'
      ),
    });
  }

  function confirmModal(title, description, action, successMessage) {
    setModal({
      title,
      description,
      fields: [],
      submitLabel: 'Confirm',
      onSubmit: () => mutate(action, successMessage),
    });
  }

  const query = search.toLowerCase().trim();

  const visibleGyms = gyms.filter((gym) =>
    `${gym.name} ${gym.slug} ${gym.ownerId?.username || ''}`
      .toLowerCase()
      .includes(query)
  );

  const visibleInvoices = invoices.filter((invoice) =>
    `${invoice.invoiceNumber} ${invoice.gymId?.name || ''} ${invoice.status}`
      .toLowerCase()
      .includes(query)
  );

  const totalCollected = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((total, invoice) => total + Number(invoice.amount), 0);

  const totalPending = invoices
    .filter((invoice) => invoice.status === 'unpaid')
    .reduce((total, invoice) => total + Number(invoice.amount), 0);

  return (
    <div className="space-y-6">
      <Notice>{error}</Notice>
      <Notice success>{message}</Notice>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {section === 'overview'
            ? 'Current platform snapshot'
            : `${section.charAt(0).toUpperCase()}${section.slice(1)} management`}
        </p>

        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className={secondaryClass}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {section === 'gyms' && (
            <button onClick={createGymModal} className={buttonClass}>
              <Plus size={17} /> Create gym
            </button>
          )}

          {section === 'plans' && (
            <button onClick={() => planModal()} className={buttonClass}>
              <Plus size={17} /> Create plan
            </button>
          )}

          {section === 'billing' && (
            <button onClick={() => invoiceModal()} className={buttonClass}>
              <Plus size={17} /> Issue invoice
            </button>
          )}
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          {section === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total gyms" value={gyms.length} icon={Building2} />
                <Stat
                  label="Gyms with access"
                  value={gyms.filter(canAccessGym).length}
                  icon={CreditCard}
                />
                <Stat
                  label="Software collections · all time"
                  value={formatMoney(totalCollected)}
                  icon={Wallet}
                />
                <Stat
                  label="Unpaid software invoices"
                  value={formatMoney(totalPending)}
                  icon={Receipt}
                />
              </div>

              <div className={`${panelClass} p-6 sm:p-8`}>
                <p className="text-xs font-bold uppercase tracking-widest text-lime-300">
                  Grow your platform
                </p>
                <h2 className="mt-4 text-2xl font-bold">
                  A dedicated workspace for every gym.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                  Create a gym, assign its owner, then issue a software
                  invoice using one of your plans.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={createGymModal} className={buttonClass}>
                    <Plus size={17} /> Create gym
                  </button>
                  <Link to="/platform/billing" className={secondaryClass}>
                    Open billing
                  </Link>
                </div>
              </div>
            </>
          )}

          {(section === 'gyms' || section === 'billing') && (
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-500" />
              <input
                aria-label={`Search ${section}`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${section}...`}
                className={`${inputClass} pl-10`}
              />
            </div>
          )}

          {section === 'gyms' && (
            <div className="grid gap-4 xl:grid-cols-2">
              {!visibleGyms.length && <Empty text="No gyms found." />}

              {visibleGyms.map((gym) => (
                <div key={gym._id} className={`${panelClass} p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{gym.name}</h2>
                      <p className="mt-1 text-xs text-zinc-500">{gym.slug}</p>
                    </div>
                    <Badge good={canAccessGym(gym)}>
                      {canAccessGym(gym) ? 'Access active' : 'Access restricted'}
                    </Badge>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs text-zinc-500">Owner</dt>
                      <dd className="mt-1">{gym.ownerId?.username || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Status</dt>
                      <dd className="mt-1 capitalize">{gym.status}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Access until</dt>
                      <dd className="mt-1">
                        {gym.lifetimeAccess ? 'Lifetime' : formatDate(gym.accessUntil)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Phone</dt>
                      <dd className="mt-1">{gym.phone || '—'}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                    <button onClick={() => statusModal(gym)} className={secondaryClass}>
                      Manage status
                    </button>
                    {!gym.lifetimeAccess && (
                      <button onClick={() => invoiceModal(gym)} className={secondaryClass}>
                        Issue invoice
                      </button>
                    )}
                    <button onClick={() => resetPasswordModal(gym)} className={secondaryClass}>
                      Reset password
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'plans' && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {!plans.length && <Empty text="Create your first software plan." />}

              {plans.map((plan) => (
                <div key={plan._id} className={`${panelClass} p-6`}>
                  <div className="flex items-center justify-between">
                    <CreditCard className="text-lime-300" size={25} />
                    <Badge good={plan.isActive}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <h2 className="mt-6 text-lg font-bold">{plan.name}</h2>
                  <p className="mt-4 text-3xl font-bold text-lime-300">
                    {formatMoney(plan.price)}
                  </p>
                  <p className="mt-2 text-xs capitalize text-zinc-500">
                    {plan.interval}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button onClick={() => planModal(plan)} className={secondaryClass}>
                      Edit
                    </button>
                    <button
                      className={secondaryClass}
                      onClick={() => confirmModal(
                        plan.isActive ? 'Deactivate plan?' : 'Activate plan?',
                        'Existing invoices will remain unchanged.',
                        () => platformService.updatePlan(plan._id, {
                          isActive: !plan.isActive,
                        }),
                        'Plan status updated.'
                      )}
                    >
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'billing' && (
            <div className={`${panelClass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                    <tr>
                      {['Invoice / Gym', 'Plan', 'Coverage', 'Amount', 'Status', 'Action'].map((label) => (
                        <th key={label} className="px-5 py-4">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {visibleInvoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td className="px-5 py-4">
                          <p className="max-w-[230px] break-all text-xs text-lime-300">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="mt-2 font-medium">
                            {invoice.gymId?.name ||
                              gyms.find((gym) => gym._id === getId(invoice.gymId))?.name ||
                              'Gym'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {invoice.planName}
                          <p className="mt-1 text-xs text-zinc-500">{invoice.interval}</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-400">
                          {formatDate(invoice.periodStart)}
                          <br />
                          {invoice.interval === 'one-time'
                            ? 'Lifetime'
                            : `to ${formatDate(invoice.periodEnd)}`}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {formatMoney(invoice.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge good={invoice.status === 'paid'}>{invoice.status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          {invoice.status === 'unpaid' && (
                            <div className="flex gap-2">
                              <button onClick={() => payModal(invoice)} className={buttonClass}>
                                Record payment
                              </button>
                              <button
                                className={secondaryClass}
                                onClick={() => confirmModal(
                                  'Void this invoice?',
                                  'This unpaid software invoice will no longer be payable.',
                                  () => platformService.voidInvoice(invoice._id),
                                  'Invoice voided.'
                                )}
                              >
                                Void
                              </button>
                            </div>
                          )}
                          {invoice.status === 'paid' && (
                            <span className="text-xs text-zinc-500">
                              {formatDate(invoice.paidAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!visibleInvoices.length && <Empty text="No software invoices found." />}
            </div>
          )}
        </>
      )}

      {modal && (
        <FormModal
          {...modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default Platform;