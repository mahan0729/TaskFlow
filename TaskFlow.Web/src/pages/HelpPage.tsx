/**
 * HelpPage — user guide and (for admins) admin guide, in two tabs.
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Tab = 'user' | 'admin';

export default function HelpPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('user');

  return (
    <div className="max-w-3xl space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help</h1>
        <p className="text-sm text-gray-500 mt-1">Everything you need to know about TaskFlow.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <TabBtn active={tab === 'user'} onClick={() => setTab('user')}>User Guide</TabBtn>
        {user?.role === 'Admin' && (
          <TabBtn active={tab === 'admin'} onClick={() => setTab('admin')}>Admin Guide</TabBtn>
        )}
      </div>

      {tab === 'user' ? <UserGuide /> : <AdminGuide />}
    </div>
  );
}

function UserGuide() {
  return (
    <div className="space-y-8">

      <Section title="What is TaskFlow?">
        <p>
          TaskFlow is a project and task management tool. You organize work into <strong>Projects</strong>,
          break each project into <strong>Tasks</strong>, and move those tasks through a simple
          3-column Kanban board as work progresses from idea to done.
        </p>
      </Section>

      <Section title="Getting Started">
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to <strong>Projects</strong> and click <strong>+ New Project</strong> to create your first project.</li>
          <li>Go to <strong>Tasks</strong> and click <strong>+ New Task</strong>, selecting the project you just created.</li>
          <li>Your task appears in the <strong>To Do</strong> column. Move it through the stages as work progresses.</li>
        </ol>
      </Section>

      <Section title="The Kanban Workflow">
        <p className="mb-3">Tasks move left to right across 3 columns:</p>
        <div className="space-y-2">
          <Stage color="bg-gray-200 text-gray-700"     name="To Do"       desc="Work that is queued and ready to be started." />
          <Stage color="bg-blue-100 text-blue-700"     name="In Progress"  desc="Work that is actively being worked on right now." />
          <Stage color="bg-green-100 text-green-700"   name="Done"         desc="Completed work. Nothing left to do." />
        </div>
      </Section>

      <Section title="Tasks">
        <ul className="space-y-2 text-gray-700">
          <li><strong>Create:</strong> Click <strong>+ New Task</strong>, choose a project, fill in the title, priority, status, and optional due date.</li>
          <li><strong>Edit:</strong> Click <strong>Edit</strong> on any task card to update its details or move it to a different status column.</li>
          <li><strong>Delete:</strong> Click <strong>×</strong> on a task card to permanently remove it.</li>
          <li><strong>Priority:</strong> Tasks are tagged <strong>Low</strong>, <strong>Medium</strong>, or <strong>High</strong>. High priority tasks need immediate attention.</li>
          <li><strong>Assign to me:</strong> Click <strong>Assign to me</strong> on any task card to take ownership. Click <strong>Unassign</strong> to release it.</li>
          <li><strong>Filters:</strong> Use the filter bar at the top to narrow tasks by project, status, or priority. Toggle <strong>Assigned to me</strong> to see only your tasks.</li>
        </ul>
      </Section>

      <Section title="Projects">
        <ul className="space-y-2 text-gray-700">
          <li><strong>Create:</strong> Click <strong>+ New Project</strong>, give it a name, an optional description, and pick a color.</li>
          <li><strong>Edit:</strong> Click <strong>Edit</strong> on a project card to update its name, description, or color.</li>
          <li><strong>Delete:</strong> Click <strong>Delete</strong> to permanently remove the project and all its tasks. This cannot be undone.</li>
          <li>The task count shown on each card reflects the total tasks in that project.</li>
        </ul>
      </Section>

      <Section title="Profile & Account">
        <ul className="space-y-2 text-gray-700">
          <li>Click your name in the sidebar to open your <strong>Profile</strong> page.</li>
          <li>Update your <strong>first and last name</strong> at any time from the Profile page.</li>
          <li>Change your <strong>password</strong> from the Change Password section on the Profile page.</li>
          <li>Forgot your password? Use the <strong>Forgot password?</strong> link on the login page — a 6-digit code will be emailed to you.</li>
        </ul>
      </Section>

      <Section title="Billing">
        <ul className="space-y-2 text-gray-700">
          <li><strong>Free plan:</strong> Up to 10 tasks, unlimited projects, all core features.</li>
          <li><strong>Pro plan ($9/mo):</strong> Unlimited tasks, unlimited projects, priority support.</li>
          <li>Click <strong>Billing</strong> in the sidebar to view your plan or upgrade. Payments are handled securely by Stripe.</li>
        </ul>
      </Section>

    </div>
  );
}

function AdminGuide() {
  return (
    <div className="space-y-8">

      <Section title="Admin Panel Overview">
        <p>
          The <strong>Admin Panel</strong> is only visible to users with the Admin role.
          It shows platform-wide statistics and gives you full control over all user accounts.
        </p>
        <p className="mt-2">
          Access it via the <strong>Admin Panel</strong> link at the bottom of the sidebar navigation.
        </p>
      </Section>

      <Section title="Platform Stats">
        <p>The stat cards at the top of the Admin Panel show:</p>
        <ul className="mt-2 space-y-1 text-gray-700">
          <li><strong>Total Users</strong> — all registered accounts</li>
          <li><strong>Free Users</strong> — accounts on the Free plan</li>
          <li><strong>Pro Users</strong> — accounts on the Pro plan</li>
          <li><strong>Total Projects</strong> — projects across all users</li>
          <li><strong>Total Tasks</strong> — tasks across all users</li>
        </ul>
      </Section>

      <Section title="Creating a User">
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Click <strong>+ Create User</strong> in the top-right of the Admin Panel.</li>
          <li>Enter the user's email address and a temporary password (minimum 8 characters).</li>
          <li>Select a role: <strong>User</strong> (standard) or <strong>Admin</strong> (full admin access).</li>
          <li>Click <strong>Create</strong>. The account is pre-verified — the user can log in immediately.</li>
          <li>Share the temporary password with the user. They can change it from their Profile page.</li>
        </ol>
      </Section>

      <Section title="Editing a User">
        <p>Click <strong>Edit</strong> next to any user in the table to update their first and last name. This is useful for accounts created before names were collected.</p>
      </Section>

      <Section title="Managing Roles">
        <ul className="space-y-2 text-gray-700">
          <li>Click <strong>Make Admin</strong> to grant a user full admin access, including the Admin Panel and all admin API endpoints.</li>
          <li>Click <strong>Remove Admin</strong> to revoke admin access and return the user to the standard User role.</li>
          <li><em>Be careful — admins can delete users and change plans.</em></li>
        </ul>
      </Section>

      <Section title="Managing Plans">
        <ul className="space-y-2 text-gray-700">
          <li>Click <strong>Set Pro</strong> to manually upgrade a user to the Pro plan without requiring payment. Useful for comping a user or internal testing.</li>
          <li>Click <strong>Set Free</strong> to downgrade a user back to the Free plan. Their Stripe subscription ID is cleared.</li>
          <li>Hover over the <strong>Plan badge</strong> in the table to see the user's Stripe Subscription ID (if they subscribed via Stripe).</li>
        </ul>
      </Section>

      <Section title="Deleting a User">
        <p>
          Click <strong>Delete</strong> next to a user to permanently remove their account and all associated projects and tasks.
          You will be asked to confirm before anything is deleted. <em>This cannot be undone.</em>
        </p>
      </Section>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

function Stage({ color, name, desc }: { color: string; name: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`badge mt-0.5 flex-shrink-0 ${color}`}>{name}</span>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
