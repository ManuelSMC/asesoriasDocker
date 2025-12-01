import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, FormsModule, MatCardModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTabsModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="app-container">
      <mat-card class="card sp-sm">
        <h2>Administración - Usuarios</h2>
        <div class="muted sp-xxs">Logeado: <strong>{{ auth.email() }}</strong></div>
        <div class="row gap-sm wrap sp-xs">
          <mat-form-field appearance="outline" style="min-width:280px;">
            <mat-label>Filtrar por nombre o correo</mat-label>
            <input matInput [(ngModel)]="filterText" (ngModelChange)="onFilterChange()" placeholder="juan | juan@uteq.edu.mx">
          </mat-form-field>
          <button mat-stroked-button color="primary" (click)="resetFilter()">Todos</button>
        </div>
      </mat-card>

      <mat-tab-group>
        <mat-tab label="Usuarios">
          <div class="pad-sm">
            <table mat-table [dataSource]="rows()" class="mat-elevation-z1" style="width:100%">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let r">{{r.id}}</td>
              </ng-container>
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let r">{{r.nombre}}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let r">{{r.email}}</td>
              </ng-container>
              <ng-container matColumnDef="rol">
                <th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let r">{{r.rol}}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayed"></tr>
              <tr mat-row *matRowDef="let row; columns: displayed;"></tr>
            </table>
          </div>
        </mat-tab>
        <mat-tab label="Crear">
          <div class="pad-sm">
            <div class="row gap-sm wrap center-start">
              <mat-form-field appearance="outline">
                <mat-label>Nombre</mat-label>
                <input matInput [(ngModel)]="nuevo.nombre">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Email (@uteq.edu.mx)</mat-label>
                <input matInput [(ngModel)]="nuevo.email">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Rol</mat-label>
                <mat-select [(ngModel)]="nuevo.rol">
                  <mat-option value="ALUMNO">ALUMNO</mat-option>
                  <mat-option value="PROFESOR">PROFESOR</mat-option>
                  <mat-option value="ADMINISTRADOR">ADMINISTRADOR</mat-option>
                  <mat-option value="COORDINADOR">COORDINADOR</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="crear()">Crear</button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class UsersComponent implements OnInit {
  rows = signal<any[]>([]);
  displayed = ['id', 'nombre', 'email', 'rol'];
  all = signal<any[]>([]);
  filterText: string = '';
  nuevo: any = { nombre: '', email: '', rol: 'ALUMNO' };
  private filterTimer: any = null;

  constructor(private http: HttpClient, private snack: MatSnackBar, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.http.get<any[]>(`${environment.apiBase}/users`).subscribe(list => {
      this.all.set(list || []);
      this.rows.set(list || []);
    });
  }

  applyFilter() {
    const q = this.filterText.trim().toLowerCase();
    if (!q) { this.rows.set(this.all()); return; }
    this.rows.set(this.all().filter(u => (u.nombre||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q)));
  }

  resetFilter() {
    this.filterText = '';
    this.rows.set(this.all());
  }

  onFilterChange() {
    if (this.filterTimer) clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => this.applyFilter(), 200); // simple debounce
  }

  crear() {
    this.http.post(`${environment.apiBase}/users`, this.nuevo).subscribe({
      next: () => {
        this.snack.open('Usuario creado correctamente', 'OK', { duration: 2500 });
        this.nuevo = { nombre: '', email: '', rol: 'ALUMNO' };
        this.loadAll();
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : 'Error al crear usuario';
        this.snack.open(msg, 'OK', { duration: 3000 });
      }
    });
  }
}
