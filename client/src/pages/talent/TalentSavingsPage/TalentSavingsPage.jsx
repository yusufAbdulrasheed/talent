import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CircleDollarSign, PiggyBank, TrendingUp } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMySavings, requestWithdrawal, setSavingsParticipation } from '../../../api/endpoints/savings.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format.js';
import styles from './TalentSavingsPage.module.scss';

const PARTICIPATION_DETAILS = {
  active: { label: 'Active', tone: 'success' },
  discontinued: { label: 'Discontinued', tone: 'warning' },
  not_started: { label: 'Not started', tone: 'neutral' },
};

const WITHDRAWAL_STATUS_TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

function StatTile({ label, value, icon, tone = 'default' }) {
  const Icon = icon;

  return (
    <div className={`${styles.stat} ${tone === 'urgent' ? styles.statUrgent : ''}`}>
      <span className={styles.iconBadge} aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function ParticipationCard({ savings, queryClient }) {
  const isActive = savings.status === 'active';

  const toggleMutation = useMutation({
    mutationFn: setSavingsParticipation,
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.talent.savings, updated),
  });

  return (
    <Card
      title="Participation"
      description={
        isActive
          ? 'Your savings are actively accruing every month.'
          : 'Your savings are paused. Your balance is safe and you can resume any time.'
      }
      actions={<StatusBadge tone={PARTICIPATION_DETAILS[savings.status].tone}>{PARTICIPATION_DETAILS[savings.status].label}</StatusBadge>}
    >
      {toggleMutation.isError ? (
        <Alert variant="error">{getErrorMessage(toggleMutation.error, 'Unable to update your savings.')}</Alert>
      ) : null}

      <Button
        variant={isActive ? 'secondary' : 'primary'}
        isLoading={toggleMutation.isPending}
        onClick={() => toggleMutation.mutate({ status: isActive ? 'discontinued' : 'active' })}
      >
        {isActive ? 'Discontinue savings' : 'Resume savings'}
      </Button>
    </Card>
  );
}

function WithdrawalRequestCard({ savings, queryClient }) {
  const [amount, setAmount] = useState('');

  const requestMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.talent.savings, updated);
      setAmount('');
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    requestMutation.mutate({ amount: Number(amount) });
  };

  const blocked = !savings.eligibleForWithdrawal || savings.hasPendingWithdrawal;

  return (
    <Card
      title="Request a withdrawal"
      description={`You may request up to ${formatCurrency(savings.maxWithdrawable)} (90% of your balance).`}
    >
      {requestMutation.isError ? (
        <Alert variant="error">{getErrorMessage(requestMutation.error, 'Unable to submit your request.')}</Alert>
      ) : null}
      {requestMutation.isSuccess ? <Alert variant="success">Your withdrawal request has been submitted.</Alert> : null}

      {!savings.eligibleForWithdrawal ? (
        <Alert variant="info">
          Withdrawals open up once six months of savings have been posted — {savings.monthsUntilEligible} to go.
        </Alert>
      ) : null}
      {savings.eligibleForWithdrawal && savings.hasPendingWithdrawal ? (
        <Alert variant="info">You already have a withdrawal request awaiting a decision.</Alert>
      ) : null}

      <form onSubmit={handleSubmit} className={styles.withdrawalForm}>
        <TextField
          label="Amount"
          type="number"
          min="1"
          max={savings.maxWithdrawable}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={blocked}
          required
        />
        <Button type="submit" isLoading={requestMutation.isPending} disabled={blocked || !amount}>
          Request withdrawal
        </Button>
      </form>
    </Card>
  );
}

function SavingsDashboard({ savings, queryClient }) {
  const accrualHistory = savings.ledger.filter((entry) => entry.type === 'accrual');

  return (
    <>
      <div className={styles.stats}>
        <StatTile label="Balance" value={formatCurrency(savings.balance)} icon={PiggyBank} />
        <StatTile
          label="Monthly accrual"
          value={savings.monthlyAccrualAmount ? formatCurrency(savings.monthlyAccrualAmount) : '—'}
          icon={TrendingUp}
        />
        <StatTile
          label="Eligibility"
          value={savings.eligibleForWithdrawal ? 'Eligible now' : `In ${savings.monthsUntilEligible} mo.`}
          icon={CalendarClock}
        />
        <StatTile label="Months saved" value={savings.accrualCount} icon={CircleDollarSign} />
      </div>

      <div className={styles.grid}>
        <ParticipationCard savings={savings} queryClient={queryClient} />
        <WithdrawalRequestCard savings={savings} queryClient={queryClient} />
      </div>

      <Card title="Accrual history">
        {accrualHistory.length === 0 ? (
          <EmptyState title="No accruals yet" description="Your first monthly accrual will appear here." />
        ) : (
          <DataTable
            caption="Monthly savings accruals"
            columns={[
              { key: 'period', header: 'Month' },
              { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
              { key: 'balanceAfter', header: 'Balance after', render: (row) => formatCurrency(row.balanceAfter) },
            ]}
            rows={accrualHistory}
            getRowKey={(row) => `${row.period}-${row.type}`}
          />
        )}
      </Card>

      <Card title="Withdrawal requests">
        {savings.withdrawalRequests.length === 0 ? (
          <EmptyState title="No withdrawal requests" description="Requests you submit will be tracked here." />
        ) : (
          <DataTable
            caption="Your withdrawal requests"
            columns={[
              { key: 'requestedAt', header: 'Requested', render: (row) => formatDate(row.requestedAt) },
              { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <StatusBadge tone={WITHDRAWAL_STATUS_TONE[row.status] ?? 'neutral'}>
                    {row.status[0].toUpperCase() + row.status.slice(1)}
                  </StatusBadge>
                ),
              },
              { key: 'decidedAt', header: 'Decided', render: (row) => formatDateTime(row.decidedAt) },
            ]}
            rows={savings.withdrawalRequests}
            getRowKey={(row) => row.id}
          />
        )}
      </Card>
    </>
  );
}

function TalentSavingsPage() {
  const queryClient = useQueryClient();
  const savingsQuery = useQuery({ queryKey: queryKeys.talent.savings, queryFn: getMySavings });

  return (
    <>
      <PageHeader
        title="Savings"
        description="A share of your salary is set aside every month once you are placed, at a rate your administrator sets."
      />

      <QueryBoundary query={savingsQuery} loadingLabel="Loading your savings">
        {(savings) =>
          savings.status === 'not_started' ? (
            <EmptyState
              icon={PiggyBank}
              title="Your savings account has not started yet"
              description="Once you are placed and your employer details are confirmed, our team will set up your monthly savings."
            />
          ) : (
            <SavingsDashboard savings={savings} queryClient={queryClient} />
          )
        }
      </QueryBoundary>
    </>
  );
}

export default TalentSavingsPage;
