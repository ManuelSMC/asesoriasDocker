import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
  <div class="login-wrap">
    <div class="brand">
      <img src="/favicon.ico" alt="Logo" class="brand-logo" />
      <div class="brand-text">
        <div class="title">Asesorías UTEQ</div>
        <div class="subtitle">Accede con tu correo institucional</div>
      </div>
    </div>
    <mat-card class="login-card">
      <h2 class="login-title">Iniciar sesión</h2>
      <form (ngSubmit)="onSubmit()" class="login-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Email institucional</mat-label>
          <input matInput [(ngModel)]="email" name="email" placeholder="usuario@uteq.edu.mx" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Contraseña</mat-label>
          <input matInput [(ngModel)]="password" type="password" name="password" required>
        </mat-form-field>
        <button mat-flat-button color="primary" class="submit" [disabled]="loading()">Entrar</button>
      </form>
      <div class="hint">Solo se aceptan correos @uteq.edu.mx</div>
    </mat-card>
    <div class="overlay" *ngIf="forceChange">
      <mat-card class="change-card">
        <h3>Cambiar contraseña inicial</h3>
        <div class="muted small">La contraseña temporal debe actualizarse.</div>
        <form (ngSubmit)="submitChange()" class="change-form">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nueva contraseña</mat-label>
            <input matInput [(ngModel)]="newPass" name="newPass" type="password" required>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Confirmar contraseña</mat-label>
            <input matInput [(ngModel)]="confirmPass" name="confirmPass" type="password" required>
          </mat-form-field>
          <button mat-flat-button color="primary" class="submit" [disabled]="changing">Guardar</button>
          <button mat-button type="button" (click)="logout()">Cancelar</button>
        </form>
      </mat-card>
    </div>
  </div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; padding: 24px; display:flex; flex-direction:column; align-items:center; justify-content:center; background: linear-gradient(135deg, #E3F2FD, #F3E5F5); }
    .brand { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .brand-logo { width:36px; height:36px; border-radius:8px; }
    .brand-text .title { font-size:20px; font-weight:600; }
    .brand-text .subtitle { font-size:12px; color:#666; }
    .login-card { width:100%; max-width:440px; padding:16px; border-radius:14px; box-shadow: 0 10px 24px rgba(0,0,0,0.08); }
    .login-title { margin:0 0 12px 0; font-weight:600; }
    .login-form { display:flex; flex-direction:column; gap:12px; }
    .full { width:100%; }
    .submit { width:100%; }
    .hint { margin-top:8px; color:#666; font-size:12px; text-align:center; }
    .overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; padding:16px; }
    .change-card { width:100%; max-width:420px; padding:18px; border-radius:16px; }
    .change-form { display:flex; flex-direction:column; gap:12px; margin-top:12px; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  forceChange = false;
  newPass = '';
  confirmPass = '';
  changing = false;
  private userId: number | null = null;

  constructor(private auth: AuthService, private router: Router, private snack: MatSnackBar, private http: HttpClient) {}

  onSubmit() {
    if (!this.auth.isInstitutional(this.email)) {
      this.snack.open('Use solo correos @uteq.edu.mx', 'OK', { duration: 3000 });
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.saveToken(res.token);
        // decode JWT payload for mustChangePassword
        try {
          const payloadPart = res.token.split('.')[1];
            const json = JSON.parse(atob(payloadPart.replace(/-/g,'+').replace(/_/g,'/')));
          if (json.mustChangePassword) {
            this.forceChange = true;
            // fetch user id
            this.http.get<any>(`${environment.apiBase}/users/by-email?email=${encodeURIComponent(this.email)}`).subscribe(u => this.userId = u?.id || null);
            this.loading.set(false);
            return;
          }
        } catch { /* ignore */ }
        const roles = this.auth.roles();
        if (roles.includes('ADMINISTRADOR')) this.router.navigate(['/admin/users']);
        else if (roles.includes('COORDINADOR')) this.router.navigate(['/coord/reports']);
        else if (roles.includes('PROFESOR')) this.router.navigate(['/profesor']);
        else this.router.navigate(['/alumno']);
      },
      error: (err) => {
        const msg = err?.error?.error || 'Credenciales incorrectas';
        this.snack.open(msg, 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  submitChange() {
    if (!this.newPass || this.newPass.length < 8) { this.snack.open('Min 8 caracteres', 'OK', { duration: 2500 }); return; }
    if (this.newPass !== this.confirmPass) { this.snack.open('No coinciden', 'OK', { duration: 2500 }); return; }
    if (!this.userId) { this.snack.open('Usuario no cargado', 'OK', { duration: 2500 }); return; }
    this.changing = true;
    this.http.patch(`${environment.apiBase}/users/${this.userId}/password`, { password: this.newPass }).subscribe({
      next: () => {
        this.snack.open('Contraseña actualizada', 'OK', { duration: 2500 });
        this.forceChange = false;
        // Redirect according to role
        const roles = this.auth.roles();
        if (roles.includes('ADMINISTRADOR')) this.router.navigate(['/admin/users']);
        else if (roles.includes('COORDINADOR')) this.router.navigate(['/coord/reports']);
        else if (roles.includes('PROFESOR')) this.router.navigate(['/profesor']);
        else this.router.navigate(['/alumno']);
      },
      error: () => {
        this.snack.open('Error al cambiar contraseña', 'OK', { duration: 3000 });
        this.changing = false;
      }
    });
  }

  logout() {
    this.auth.logout();
    this.forceChange = false;
    this.loading.set(false);
  }
}
