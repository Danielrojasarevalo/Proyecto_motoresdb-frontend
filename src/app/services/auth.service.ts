import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  email: string;
  role: 'administrador';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'inventario_auth_user';
  readonly defaultEmail = 'admin@example.com';
  readonly defaultPassword = '1299';
  readonly defaultRole: AuthUser['role'] = 'administrador';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Promise<boolean> {
    const normalizedEmail = email?.trim().toLowerCase();

    return firstValueFrom(
      this.http
        .post<{ email: string; username: string }>(`${environment.apiUrl}/auth/login/`, {
          email: normalizedEmail,
          password,
        })
        .pipe(
          map(() => {
            const user: AuthUser = { email: normalizedEmail, role: this.defaultRole };
            localStorage.setItem(this.storageKey, JSON.stringify(user));
            return true;
          }),
          catchError(() => of(false))
        )
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.storageKey);
  }

  get currentUser(): AuthUser | null {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  }
}
