import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import { getSubscriptionCheckoutStatus } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import styles from './RecruiterSubscriptionCallbackPage.module.scss';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 30; // ~90 seconds

function RecruiterSubscriptionCallbackPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');
  const queryClient = useQueryClient();
  const [attempts, setAttempts] = useState(0);

  const statusQuery = useQuery({
    queryKey: queryKeys.recruiter.subscriptionCheckoutStatus(reference),
    queryFn: async () => {
      const result = await getSubscriptionCheckoutStatus(reference);
      setAttempts((count) => count + 1);
      return result;
    },
    enabled: Boolean(reference),
    refetchInterval: (query) => (query.state.data?.payment.status === 'initialized' ? POLL_INTERVAL_MS : false),
  });

  const payment = statusQuery.data?.payment;
  const isSettled = payment && payment.status !== 'initialized';
  const isSuccess = payment?.status === 'success';
  const timedOut = !isSettled && attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.subscription });
    }
  }, [isSuccess, queryClient]);

  return (
    <>
      <PageHeader title="Subscription payment" />

      <Card>
        {!reference ? (
          <Alert variant="error">No payment reference was provided.</Alert>
        ) : statusQuery.isError ? (
          <Alert variant="error">We could not confirm this payment. Contact support if you were charged.</Alert>
        ) : isSuccess ? (
          <div className={styles.state}>
            <CheckCircle2 size={40} className={styles.iconSuccess} aria-hidden="true" />
            <p className={styles.title}>Your subscription is active</p>
            <p className={styles.body}>Higher-tier talent is now unlocked in your talent pool.</p>
            <Button to="/recruiter/talent-pool">Browse talent</Button>
          </div>
        ) : payment?.status === 'failed' || payment?.status === 'abandoned' ? (
          <div className={styles.state}>
            <XCircle size={40} className={styles.iconError} aria-hidden="true" />
            <p className={styles.title}>Payment was not completed</p>
            <p className={styles.body}>No changes were made to your subscription.</p>
            <Button to="/recruiter/subscription" variant="secondary">
              Back to plans
            </Button>
          </div>
        ) : timedOut ? (
          <div className={styles.state}>
            <p className={styles.title}>Still confirming your payment</p>
            <p className={styles.body}>
              This is taking longer than expected. If you completed the payment, it will apply
              automatically — check back on the subscription page shortly.
            </p>
            <Button to="/recruiter/subscription" variant="secondary">
              Back to plans
            </Button>
          </div>
        ) : (
          <div className={styles.state}>
            <Loader2 size={40} className={styles.spin} aria-hidden="true" />
            <p className={styles.title}>Confirming your payment&hellip;</p>
            <p className={styles.body}>This usually takes a few seconds.</p>
          </div>
        )}
      </Card>
    </>
  );
}

export default RecruiterSubscriptionCallbackPage;
