import 'next-auth';
import 'next-auth/jwt';
declare module 'next-auth' {
  interface User { role?: 'ADMIN' | 'MANAGER'; sessionVersion?: number }
  interface Session { staffRole?: 'ADMIN' | 'MANAGER'; staffId?: string; sessionVersion?: number }
}
declare module 'next-auth/jwt' {
  interface JWT { staffRole?: 'ADMIN' | 'MANAGER'; sessionVersion?: number }
}
