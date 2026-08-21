import { describe, expect, it } from 'vitest';
import { AppService } from './app.service';
import { AuthGuard, ResultsGuard } from './auth.guard';

describe('route guards', () => {
    const homeTree = { redirect: '/home' };
    const router = { createUrlTree: () => homeTree } as any;

    it('allows test routes only after participant information exists', () => {
        const service = { info: null } as AppService;
        const guard = new AuthGuard(service, router);
        expect(guard.canActivate(null, null)).toBe(homeTree);

        service.info = { alias: 'tester' } as any;
        expect(guard.canActivate(null, null)).toBe(true);
    });

    it('allows Results only when an overall average exists', () => {
        const service = { userAverage: {} } as AppService;
        const guard = new ResultsGuard(service, router);
        expect(guard.canActivate()).toBe(homeTree);

        service.userAverage = { hits: 15 } as any;
        expect(guard.canActivate()).toBe(true);
    });
});
