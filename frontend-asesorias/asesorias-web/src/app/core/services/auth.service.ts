import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

type TokenResponse = { token: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'asesorias_token';
  private readonly emailKey = 'asesorias_email';
  roles = signal<string[]>([]);
  email = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token) this.decodeAndSet(token);
  }

  login(email: string, password: string) {
    return this.http.post<TokenResponse>(`${environment.apiBase}/auth/login`, { email, password });
  }

  saveToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.decodeAndSet(token);
  }

  private decodeAndSet(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const roles = Array.isArray(payload.roles) ? payload.roles.map((r: any) => String(r))
        : payload.roles ? [String(payload.roles)] : [];
      const email = String(payload.sub || payload.subject || '');
      this.roles.set(roles);
      this.email.set(email);
      if (email) localStorage.setItem(this.emailKey, email);
    } catch (_) {
      this.roles.set([]);
      this.email.set(null);
    }
  }

  isInstitutional(email: string) {
    return /@uteq\.edu\.mx$/i.test(email);
  }

  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  getEmail(): string | null { return this.email() ?? localStorage.getItem(this.emailKey); }

  hasAnyRole(required: string[]): boolean {
    const current = this.roles();
    return required.some(r => current.includes(r));
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.emailKey);
    this.roles.set([]);
    this.email.set(null);
    this.router.navigate(['/login']);
  }
}
