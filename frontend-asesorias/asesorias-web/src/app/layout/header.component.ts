import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink, NgIf],
  template: `
    <mat-toolbar color="primary" style="position:sticky; top:0; z-index:1000;">
      <button mat-button routerLink="/" style="font-weight:600;">
        <mat-icon>school</mat-icon>
        Asesorías UTEQ
      </button>
      <span style="flex:1 1 auto;"></span>

      <ng-container *ngIf="auth.getToken(); else guest">
        <button mat-button [matMenuTriggerFor]="menu">
          <mat-icon>menu</mat-icon>
          Menú
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item *ngIf="auth.hasAnyRole(['ALUMNO'])" routerLink="/alumno">
            <mat-icon>person</mat-icon>
            <span>Alumno</span>
          </button>
          <button mat-menu-item *ngIf="auth.hasAnyRole(['ALUMNO'])" routerLink="/alumno/profesores">
            <mat-icon>group</mat-icon>
            <span>Profesores</span>
          </button>
          <button mat-menu-item *ngIf="auth.hasAnyRole(['PROFESOR'])" routerLink="/profesor">
            <mat-icon>co_present</mat-icon>
            <span>Profesor</span>
          </button>
          <button mat-menu-item *ngIf="auth.hasAnyRole(['ADMINISTRADOR'])" routerLink="/admin/users">
            <mat-icon>admin_panel_settings</mat-icon>
            <span>Administración</span>
          </button>
          <button mat-menu-item *ngIf="auth.hasAnyRole(['COORDINADOR'])" routerLink="/coord/reports">
            <mat-icon>insights</mat-icon>
            <span>Reportes</span>
          </button>
        </mat-menu>

        <button mat-button (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          Salir
        </button>
      </ng-container>

      <ng-template #guest>
        <button mat-button routerLink="/login">Iniciar sesión</button>
      </ng-template>
    </mat-toolbar>
  `
})
export class HeaderComponent {
  constructor(public auth: AuthService, private router: Router) {}
}
