import * as Sentry from '@sentry/nextjs';
import { sanitizeMonitoringEvent } from '@/lib/monitoring-sanitize';
if (process.env.SENTRY_DSN) Sentry.init({
  dsn: process.env.SENTRY_DSN, tracesSampleRate: 0,
  maxBreadcrumbs: 0, beforeSend: sanitizeMonitoringEvent,
});
