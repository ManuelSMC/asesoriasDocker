import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [MatSidenavModule, MatListModule, MatIconModule, RouterLink, RouterOutlet, NgIf],
  styles: [`
    .container { width: 100%; margin: 0; }
    .content { padding: 16px; height: 100%; box-sizing: border-box; }
    .nav { width: 260px; border-right: 1px solid var(--mat-sys-outline-variant); }
    .mat-mdc-list-item { border-radius: 6px; }
  `],
  template: `
    <div class="container">
      <mat-sidenav-container style="height: calc(100vh - 64px);">
        <mat-sidenav class="nav" mode="side" opened>
          <mat-nav-list>
            <a mat-list-item routerLink="/alumno" *ngIf="auth.hasAnyRole(['ALUMNO'])">
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>Alumno</span>
              <span matListItemLine>Mis asesorías</span>
            </a>
            <a mat-list-item routerLink="/profesor" *ngIf="auth.hasAnyRole(['PROFESOR'])">
              <mat-icon matListItemIcon>co_present</mat-icon>
              <span matListItemTitle>Profesor</span>
              <span matListItemLine>Solicitudes y agenda</span>
            </a>
            <a mat-list-item routerLink="/admin/users" *ngIf="auth.hasAnyRole(['ADMINISTRADOR'])">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Usuarios</span>
              <span matListItemLine>Gestión</span>
            </a>
            <a mat-list-item routerLink="/coord/reports" *ngIf="auth.hasAnyRole(['COORDINADOR'])">
              <mat-icon matListItemIcon>insights</mat-icon>
              <span matListItemTitle>Reportes</span>
              <span matListItemLine>Estadísticas</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>
        <mat-sidenav-content>
          <div class="content">
            <router-outlet />
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `
})
export class ShellComponent {
  constructor(public auth: AuthService) {}
}
