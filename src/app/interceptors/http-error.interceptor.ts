import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          auth.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          router.navigate(['/auth/login']);
          break;

        case 429:
          console.warn('[http] demasiadas solicitudes — intente más tarde');
          break;

        case 0:
          console.error('[http] sin conexión con el servidor');
          break;

        default:
          if (error.status >= 500) {
            console.error('[http] error del servidor:', error.status, error.message);
          }
      }

      return throwError(() => error);
    })
  );
};
