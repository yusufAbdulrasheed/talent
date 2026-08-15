import { useMutation, useQuery } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMyPayments, initializeTrainingPayment } from '../../../api/endpoints/payments.js';
import { getMyProfile } from '../../../api/endpoints/talent.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { useAuth } from '../../../auth/useAuth.js';
import {
  CANDIDATE_STATUSES,
  getPaymentStatusDetails,
} from '../../../constants/candidateStatus.js';
import { formatCurrency, formatDateTime } from '../../../utils/format.js';
import styles from './TalentPaymentsPage.module.scss';

const PAID_STATUSES = [
  CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
];

function TalentPaymentsPage() {
  const { user } = useAuth();
  const profileQuery = useQuery({ queryKey: queryKeys.talent.profile, queryFn: getMyProfile });
  const paymentsQuery = useQuery({ queryKey: queryKeys.payments.mine, queryFn: getMyPayments });

  const payMutation = useMutation({
    mutationFn: initializeTrainingPayment,
    // Paystack hosts the checkout, so this is a full page handoff. The webhook
    // is what confirms the payment; the return URL only reports the outcome.
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
  });

  const candidate = profileQuery.data;
  const hasPaid = candidate ? PAID_STATUSES.includes(candidate.status) : false;
  const blockers = [];

  if (!user.isEmailVerified) {
    blockers.push('Verify your email address.');
  }

  if (candidate && !candidate.isProfileComplete) {
    blockers.push('Complete every field on your profile.');
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Pay your training fee and review your payment history."
      />

      <QueryBoundary query={profileQuery} loadingLabel="Loading your application">
        {() => (
          <Card
            title="Training fee"
            description={
              hasPaid
                ? 'Your training fee has been received.'
                : 'Payment is handled by Paystack. You will return here once it completes.'
            }
            actions={
              hasPaid ? (
                <StatusBadge tone="success">Paid</StatusBadge>
              ) : (
                <Button
                  onClick={() => payMutation.mutate()}
                  isLoading={payMutation.isPending}
                  disabled={blockers.length > 0}
                >
                  Pay training fee
                </Button>
              )
            }
          >
            {payMutation.isError ? (
              <Alert variant="error">
                {getErrorMessage(payMutation.error, 'Unable to start your payment.')}
              </Alert>
            ) : null}

            {!hasPaid && blockers.length > 0 ? (
              <Alert variant="warning" title="Finish these first">
                <ul className={styles.blockers}>
                  {blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}
          </Card>
        )}
      </QueryBoundary>

      <Card title="Payment history">
        <QueryBoundary query={paymentsQuery} loadingLabel="Loading your payments">
          {(payments) =>
            payments.length === 0 ? (
              <EmptyState
                title="No payments yet"
                description="Once you pay your training fee, every transaction will be listed here."
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <caption className={styles.caption}>Your training fee transactions</caption>
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                      <th scope="col">Paid at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const status = getPaymentStatusDetails(payment.status);

                      return (
                        <tr key={payment.reference}>
                          <td className={styles.reference}>{payment.reference}</td>
                          <td>{formatCurrency(payment.amount, payment.currency)}</td>
                          <td>
                            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                          </td>
                          <td>{formatDateTime(payment.paidAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </QueryBoundary>
      </Card>
    </>
  );
}

export default TalentPaymentsPage;
