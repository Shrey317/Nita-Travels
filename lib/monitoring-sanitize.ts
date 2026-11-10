import type { ErrorEvent } from '@sentry/nextjs';
export function sanitizeMonitoringEvent(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id, timestamp: event.timestamp, platform: event.platform, level: 'error',
    exception: { values: (event.exception?.values || []).map(value => ({
      type: /^[A-Za-z]+Error$/.test(value.type || '') ? value.type : 'ApplicationError',
      value: 'Application failure. Review private runtime logs for details.',
      stacktrace: value.stacktrace ? { frames: value.stacktrace.frames?.map(frame => ({
        filename: frame.filename?.split(/[?#]/)[0], function: frame.function, lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app,
      })) } : undefined,
    })) },
  };
}
