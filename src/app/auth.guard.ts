import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AppService } from './app.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private appService: AppService, private router: Router) { }
    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean | UrlTree {
        if (this.appService.info) {
            return true;
        }
        return this.router.createUrlTree(['/home']);
    }
}

@Injectable()
export class ResultsGuard implements CanActivate {
    constructor(private appService: AppService, private router: Router) { }
    canActivate(): boolean | UrlTree {
        if (this.appService.userAverage && Object.keys(this.appService.userAverage).length > 0) {
            return true;
        }
        return this.router.createUrlTree(['/home']);
    }
}
