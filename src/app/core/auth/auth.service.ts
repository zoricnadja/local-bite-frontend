import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../../shared/models/auth.models';

const TOKEN_KEY = 'lb_token';
const USER_KEY  = 'lb_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE = '/api/auth';

  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = this._user.asReadonly();
  readonly token       = this._token.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._token());
  readonly role        = computed(() => this._user()?.role ?? null);
  readonly id =computed(() => this._user()?.id ?? null)
  readonly farmId      = computed(() => this._user()?.farm_id ?? null);
  readonly isFarmOwner = computed(() => this._user()?.role === 'FarmOwner');
  readonly isCustomer    = computed(() => this._user()?.role === 'Customer');

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/login`, req).pipe(
      tap(res => this.persist(res.token, res.user))
    );
  }

  register(req: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/register`, req).pipe(
      tap(res => this.persist(res.token, res.user))
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.BASE}/me`);
  }

  refreshUser(): Observable<User> {
    return this.me().pipe(
      tap(user => this.setUser(user))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  private persist(token: string, user: User): void {
    this.setToken(token)
    this.setUser(user)
    console.log(token)
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
