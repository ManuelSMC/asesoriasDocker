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

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
  <div style="display:flex; justify-content:center; align-items:center; min-height:80vh; padding:16px;">
    <mat-card style="max-width:420px; width:100%;">
      <h2 style="margin:0 0 16px;">Iniciar sesión</h2>
      <form (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" style="width:100%; margin-bottom:12px;">
          <mat-label>Email institucional</mat-label>
          <input matInput [(ngModel)]="email" name="email" placeholder="usuario@uteq.edu.mx" required>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%; margin-bottom:16px;">
          <mat-label>Contraseña</mat-label>
          <input matInput [(ngModel)]="password" type="password" name="password" required>
        </mat-form-field>
        <button mat-flat-button color="primary" style="width:100%;" [disabled]="loading()">Entrar</button>
      </form>
      <div style="margin-top:12px; color:#666; font-size:12px;">Solo se aceptan correos @uteq.edu.mx</div>
    </mat-card>
  </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router, private snack: MatSnackBar) {}

  onSubmit() {
    if (!this.auth.isInstitutional(this.email)) {
      this.snack.open('Use solo correos @uteq.edu.mx', 'OK', { duration: 3000 });
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.saveToken(res.token);
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
}
