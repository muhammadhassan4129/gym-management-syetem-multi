import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  Users,
  Dumbbell,
  CalendarDays,
  Wallet,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';

const management = ['owner', 'manager'];

export const platformNavigation = [
  {
    path: '/platform',
    label: 'Overview',
    title: 'Platform overview',
    description: 'Your gyms, software plans and billing in one place.',
    icon: LayoutDashboard,
  },
  {
    path: '/platform/gyms',
    label: 'Gyms',
    title: 'Gym workspaces',
    description: 'Create gyms and manage their access.',
    icon: Building2,
  },
  {
    path: '/platform/plans',
    label: 'Plans',
    title: 'Software plans',
    description: 'Manage monthly, yearly and one-time pricing.',
    icon: CreditCard,
  },
  {
    path: '/platform/billing',
    label: 'Software billing',
    title: 'Software invoices',
    description: 'Issue invoices and record payments received from gyms.',
    icon: Receipt,
  },
];

export const gymNavigation = [
  {
    path: '/',
    label: 'Dashboard',
    title: 'Gym overview',
    description: 'Memberships, collections and gym performance.',
    icon: LayoutDashboard,
    roles: management,
  },
  {
    path: '/members',
    label: 'Members',
    title: 'Your members',
    description: 'Manage member profiles and account details.',
    icon: Users,
    roles: ['owner', 'manager', 'receptionist'],
  },
  {
    path: '/services',
    label: 'Services & fees',
    title: 'Services & fees',
    description: 'Manage the services your gym offers.',
    icon: Dumbbell,
    roles: management,
  },
  {
    path: '/subscriptions',
    label: 'Subscriptions',
    title: 'Member subscriptions',
    description: 'Manage service assignments and recurring member billing.',
    icon: CalendarDays,
    roles: management,
  },
  {
    path: '/payments',
    label: 'Member payments',
    title: 'Payments & invoices',
    description: 'Record collections and follow outstanding member balances.',
    icon: Receipt,
    roles: ['owner', 'manager', 'receptionist'],
  },
  {
    path: '/expenses',
    label: 'Expenses',
    title: 'Operating expenses',
    description: 'Track the running costs of your gym.',
    icon: Wallet,
    roles: management,
  },
  {
    path: '/reports',
    label: 'Reports',
    title: 'Financial reports',
    description: 'Review financial activity and download reports.',
    icon: BarChart3,
    roles: management,
  },
  {
    path: '/gym/billing',
    label: 'Software subscription',
    title: 'Your software subscription',
    description: 'View access validity and software invoices.',
    icon: CreditCard,
    roles: ['owner'],
  },
  {
    path: '/gym/settings',
    label: 'Gym settings',
    title: 'Gym settings',
    description: 'Update the identity and contact details of your gym.',
    icon: Settings,
    roles: ['owner'],
  },
];

export function getNavigation({ isSuperAdmin, role, gymAllowed }) {
  if (isSuperAdmin) return platformNavigation;

  return gymNavigation.filter((item) => (
    item.roles.includes(role) &&
    (gymAllowed || item.path === '/gym/billing')
  ));
}

export function getPageDetails(pathname) {
  return [...platformNavigation, ...gymNavigation].find(
    (item) => item.path === pathname
  ) || {
    label: 'Workspace',
    title: 'Workspace',
    description: '',
    icon: Dumbbell,
  };
}