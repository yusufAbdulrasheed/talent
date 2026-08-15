import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import Spinner from '../../../components/ui/Spinner/Spinner.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import { getPaymentStatus } from '../../../api/endpoints/payments.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { getCandidateStatusDetails } from '../../../constants/candidateStatus.js';
import { formatCurrency, formatDateTime } from '../../../utils/format.js';
import styles from './PaymentCallbackPage.module.scss';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90_000;

/**
 * Landing page for the Paystack redirect.
 *
 * The redirect itself proves nothing — it is the webhook that verifies the
 * transaction server-side. So this page polls our own API until the payment
 * is recorded as settled, and reports only what the server confirms.
 */
function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const startedAt = useRef(Date.now());

  // Paystack sends `reference`; `trxref` is its legacy alias.
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');

  const statusQuery = useQuery({
    queryKey: queryKeys.payments.status(reference),
    queryFn: () => getPaymentStatus(reference),
    enabled: Boolean(reference),
    refetchInterval: (query) => {
      const status = query.state.data?.payment?.status;

      if (status && status !== 'initialized') {
        return false;
      }

      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        return false;
      }

      return POLL_INTERVAL_MS;
    },
  });

  const payment = statusQuery.data?.payment;
  const isSettled = Boolean(payment && payment.status !== 'initialized');
  const hasTimedOut = !isSettled && Date.now() - startedAt.current > POLL_TIMEOUT_MS;

  // Once confirmed, other screens are holding stale status and history.
  useEffect(() => {
    if (payment?.status === 'success') {
      queryClient.invalidateQueries({ queryKey: queryKeys.talent.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.mine });
    }
  }, [payment?.status, queryClient]);

  if (!reference) {
    return (
      <>
        <PageHeader title="Payment" />
        <Card>
          <Alert variant="error">
            This page was opened without a payment reference. Check your payment history for the
            latest status.
          </Alert>
          <div>
            <Button to="/talent/payments">Go to payment history</Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Payment result" description={`Reference ${reference}`} />

      <Card>
        {statusQuery.isPending ? (
          <div className={styles.pending}>
            <Spinner label="Checking your payment" />
            <p>Checking your payment…</p>
          </div>
        ) : null}

        {statusQuery.isError ? (
          <Alert variant="error">
            {getErrorMessage(statusQuery.error, 'We could not look up this payment.')}
          </Alert>
        ) : null}

        {payment && !isSettled && !hasTimedOut ? (
          <div className={styles.pending}>
            <Spinner label="Confirming your payment" />
            <p>
              Waiting for confirmation from Paystack. This usually takes a few seconds — you can
              leave this page open.
            </p>
          </div>
        ) : null}

        {payment && !isSettled && hasTimedOut ? (
          <Alert variant="warning" title="Still confirming">
            Your payment has not been confirmed yet. If it was debited, it will appear in your
            payment history shortly. Contact us if it does not.
          </Alert>
        ) : null}

        {payment?.status === 'success' ? (
          <Alert variant="success" title="Payment confirmed">
            Thank you. Your training fee has been received and your application is moving forward.
          </Alert>
        ) : null}

        {payment && ['failed', 'abandoned'].includes(payment.status) ? (
          <Alert variant="error" title="Payment not completed">
            This transaction did not complete. You can try again from your payments page.
          </Alert>
        ) : null}

        {payment ? (
          <dl className={styles.summary}>
            <div>
              <dt>Amount</dt>
              <dd>{formatCurrency(payment.amount, payment.currency)}</dd>
            </div>
            <div>
              <dt>Paid at</dt>
              <dd>{formatDateTime(payment.paidAt)}</dd>
            </div>
            <div>
              <dt>Application status</dt>
              <dd>
                <StatusBadge tone={getCandidateStatusDetails(statusQuery.data.candidateStatus).tone}>
                  {getCandidateStatusDetails(statusQuery.data.candidateStatus).label}
                </StatusBadge>
              </dd>
            </div>
          </dl>
        ) : null}

        <div className={styles.actions}>
          <Button to="/talent">Back to overview</Button>
          <Button to="/talent/payments" variant="secondary">
            Payment history
          </Button>
        </div>
      </Card>
    </>
  );
}

export default PaymentCallbackPage;
