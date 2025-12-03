import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { MatTabsModule } from '@angular/material/tabs';
import { EditUserDialogComponent } from './edit-user.dialog';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, FormsModule, MatCardModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTabsModule, MatSelectModule, MatSnackBarModule, MatIconModule, MatDialogModule],
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
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let r">
                  <div class="row center-between">
                    <span>{{r.nombre}}</span>
                    <span class="chip" [class.chip-green]="r.activo" [class.chip-red]="!r.activo">{{r.activo?'Activo':'Inactivo'}}</span>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let r">{{r.email}}</td>
              </ng-container>
              <ng-container matColumnDef="rol">
                <th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let r">
                  <div class="row gap-xs wrap align-center">
                    <span>{{r.rol}}</span>
                    <span class="spacer"></span>
                    <button mat-stroked-button color="primary" (click)="startEditUser(r)"><mat-icon fontIcon="edit"></mat-icon> Editar</button>
                    <button mat-stroked-button [color]="r.activo ? 'warn' : 'accent'" (click)="toggleUser(r)">
                      <mat-icon fontIcon="power_settings_new"></mat-icon>
                      {{r.activo?'Desactivar':'Activar'}}
                    </button>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="materias">
                <th mat-header-cell *matHeaderCellDef>Materias</th>
                <td mat-cell *matCellDef="let r">{{ (r.materiasNombres || []).join(', ') }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayed"></tr>
              <tr mat-row *matRowDef="let row; columns: displayed;"></tr>
            </table>
            <!-- Modal se crea aparte, aquí no renderizamos panel inline -->
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
              <ng-container *ngIf="nuevo.rol === 'PROFESOR'">
                <mat-form-field appearance="outline">
                  <mat-label>División</mat-label>
                  <mat-select [(ngModel)]="nuevo.divisionId">
                    <mat-option *ngFor="let d of divisiones()" [value]="d.id">{{d.nombre}}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" style="min-width:300px;">
                  <mat-label>Materias</mat-label>
                  <mat-select [(ngModel)]="selectedMaterias" multiple>
                    <mat-option *ngFor="let m of materias()" [value]="m.id">{{m.nombre}}</mat-option>
                  </mat-select>
                </mat-form-field>
              </ng-container>
              <button mat-flat-button color="primary" (click)="crear()">Crear</button>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Divisiones">
          <div class="pad-sm">
            <div class="row gap-sm wrap center-start">
              <mat-form-field appearance="outline" style="min-width:280px;">
                <mat-label>Nueva división</mat-label>
                <input matInput [(ngModel)]="nuevaDivision">
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="crearDivision()">Agregar</button>
            </div>
            <div class="grid-auto sp-sm">
              <mat-card class="card" *ngFor="let d of divisiones()">
                <div *ngIf="editDivision?.id !== d.id; else divEdit">
                  <div class="row center-between">
                    <strong>{{d.nombre}}</strong>
                    <span class="chip" [class.chip-green]="d.activo" [class.chip-red]="!d.activo">{{d.activo?'Activo':'Inactivo'}}</span>
                  </div>
                  <div class="row gap-xs sp-xs">
                    <button mat-stroked-button color="primary" (click)="toggleDivision(d)">{{d.activo?'Desactivar':'Activar'}}</button>
                    <button mat-stroked-button (click)="startEditDivision(d)">Editar</button>
                  </div>
                </div>
                <ng-template #divEdit>
                  <div class="row gap-sm wrap">
                    <mat-form-field appearance="outline" style="flex:1;">
                      <mat-label>Nombre división</mat-label>
                      <input matInput [(ngModel)]="editDivision.nombre">
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="saveDivision()">Guardar</button>
                    <button mat-button type="button" (click)="cancelDivisionEdit()">Cancelar</button>
                  </div>
                </ng-template>
              </mat-card>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Programas">
          <div class="pad-sm">
            <div class="row gap-sm wrap center-start">
              <mat-form-field appearance="outline" style="min-width:280px;">
                <mat-label>Nuevo programa</mat-label>
                <input matInput [(ngModel)]="nuevoPrograma">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>División</mat-label>
                <mat-select [(ngModel)]="selectedDivisionForPrograma">
                  <mat-option *ngFor="let d of divisiones()" [value]="d.id">{{d.nombre}}</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="crearPrograma()">Agregar</button>
            </div>
            <div class="grid-auto sp-sm">
              <mat-card class="card" *ngFor="let p of programas()">
                <div *ngIf="editPrograma?.id !== p.id; else progEdit">
                  <div class="row center-between">
                    <strong>{{p.nombre}}</strong>
                    <span class="chip" [class.chip-green]="p.activo" [class.chip-red]="!p.activo">{{p.activo?'Activo':'Inactivo'}}</span>
                  </div>
                  <div class="row gap-xs sp-xs">
                    <button mat-stroked-button color="primary" (click)="togglePrograma(p)">{{p.activo?'Desactivar':'Activar'}}</button>
                    <button mat-stroked-button (click)="startEditPrograma(p)">Editar</button>
                  </div>
                </div>
                <ng-template #progEdit>
                  <div class="row gap-sm wrap">
                    <mat-form-field appearance="outline" style="flex:1;">
                      <mat-label>Nombre programa</mat-label>
                      <input matInput [(ngModel)]="editPrograma.nombre">
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="savePrograma()">Guardar</button>
                    <button mat-button type="button" (click)="cancelProgramaEdit()">Cancelar</button>
                  </div>
                </ng-template>
              </mat-card>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Materias">
          <div class="pad-sm">
            <div class="row gap-sm wrap center-start">
              <mat-form-field appearance="outline" style="min-width:280px;">
                <mat-label>Nueva materia</mat-label>
                <input matInput [(ngModel)]="nuevaMateria">
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="crearMateria()">Agregar</button>
            </div>
            <div class="grid-auto sp-sm">
              <mat-card class="card" *ngFor="let m of materias()">
                <div *ngIf="editMateria?.id !== m.id; else matEdit">
                  <div class="row center-between">
                    <strong>{{m.nombre}}</strong>
                    <span class="chip" [class.chip-green]="m.activo" [class.chip-red]="!m.activo">{{m.activo?'Activo':'Inactivo'}}</span>
                  </div>
                  <div class="row gap-xs sp-xs">
                    <button mat-stroked-button color="primary" (click)="toggleMateria(m)">{{m.activo?'Desactivar':'Activar'}}</button>
                    <button mat-stroked-button (click)="startEditMateria(m)">Editar</button>
                  </div>
                </div>
                <ng-template #matEdit>
                  <div class="row gap-sm wrap">
                    <mat-form-field appearance="outline" style="flex:1;">
                      <mat-label>Nombre materia</mat-label>
                      <input matInput [(ngModel)]="editMateria.nombre">
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="saveMateria()">Guardar</button>
                    <button mat-button type="button" (click)="cancelMateriaEdit()">Cancelar</button>
                  </div>
                </ng-template>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class UsersComponent implements OnInit {
  rows = signal<any[]>([]);
  displayed = ['nombre', 'email', 'rol', 'materias'];
  all = signal<any[]>([]);
  filterText: string = '';
  nuevo: any = { nombre: '', email: '', rol: 'ALUMNO' };
  private filterTimer: any = null;
  divisiones = signal<any[]>([]);
  programas = signal<any[]>([]);
  materias = signal<any[]>([]);
  nuevaDivision = '';
  nuevoPrograma = '';
  nuevaMateria = '';
  selectedMaterias: number[] = [];
  selectedDivisionForPrograma: number | null = null;
  editDivision: any = null;
  editPrograma: any = null;
  editMateria: any = null;
  editUser: any = null;

  constructor(private http: HttpClient, private snack: MatSnackBar, public auth: AuthService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadCatalogs();
  }

  loadAll() {
    this.http.get<any[]>(`${environment.apiBase}/users`).subscribe(list => {
      const base = (list || []);
      this.all.set(base);
      this.rows.set(base);
      // Enrich profesores with materias names
      base.filter(u => u.rol === 'PROFESOR' && u.id).forEach(u => {
        this.http.get<any[]>(`${environment.apiBase}/profesores/${u.id}/materias`).subscribe(ms => {
          u.materiasNombres = (ms || []).map(m => m.nombre);
          // Trigger signal refresh
          this.rows.set(this.rows().map(r => r.id === u.id ? u : r));
          this.all.set(this.all().map(r => r.id === u.id ? u : r));
        });
      });
    });
  }

  applyFilter() {
    const q = this.filterText.trim().toLowerCase();
    if (!q) { this.rows.set(this.all()); return; }
    this.rows.set(this.all().filter(u =>
      (u.nombre||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q) ||
      ((u.materiasNombres||[]).join(',').toLowerCase().includes(q))
    ));
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
    // Basic validations
    if (!this.nuevo.nombre?.trim()) { this.snack.open('Nombre es obligatorio', 'OK', { duration: 2500 }); return; }
    if (!this.validaEmail(this.nuevo.email)) { this.snack.open('Email institucional válido requerido', 'OK', { duration: 3000 }); return; }
    if (this.nuevo.rol === 'PROFESOR' && !this.nuevo.divisionId) { this.snack.open('Seleccione división para profesor', 'OK', { duration: 2500 }); return; }
    const payload = { ...this.nuevo };
    this.http.post<any>(`${environment.apiBase}/users`, payload).subscribe({
      next: (created) => {
        const onDone = () => {
          this.snack.open('Usuario creado correctamente', 'OK', { duration: 2500 });
          this.nuevo = { nombre: '', email: '', rol: 'ALUMNO' };
          this.selectedMaterias = [];
          this.loadAll();
        };
        if (payload.rol === 'PROFESOR' && this.selectedMaterias.length > 0) {
          const proceed = (profId: number) => {
            // Asignar materias existentes al profesor actualizando su profesorId
            const ops = this.selectedMaterias.map(id => this.http.patch(`${environment.apiBase}/catalog/materias/${id}`, { profesorId: profId }));
            // Ejecutar todas y finalizar sin bloquear por errores individuales
            Promise.all(ops.map(o => o.toPromise().catch(() => null))).then(() => onDone());
          };
          if (created && created.id) {
            proceed(created.id);
          } else {
            this.http.get<any>(`${environment.apiBase}/users/by-email?email=${encodeURIComponent(payload.email)}`).subscribe(u => proceed(u?.id), () => onDone());
          }
        } else {
          onDone();
        }
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : 'Error al crear usuario';
        this.snack.open(msg, 'OK', { duration: 3000 });
      }
    });
  }
  validaEmail(e: string) {
    const re = /^[^\s@]+@uteq\.edu\.mx$/i;
    return !!e && re.test(e.trim());
  }

  loadCatalogs() {
    this.http.get<any[]>(`${environment.apiBase}/catalog/divisiones`).subscribe(list => this.divisiones.set(list || []));
    this.http.get<any[]>(`${environment.apiBase}/catalog/programas`).subscribe(list => this.programas.set(list || []));
    this.http.get<any[]>(`${environment.apiBase}/catalog/materias`).subscribe(list => this.materias.set(list || []));
  }

  crearDivision() {
    const nombre = this.nuevaDivision.trim(); if (!nombre) return;
    this.http.post(`${environment.apiBase}/catalog/divisiones`, { nombre }).subscribe(() => {
      this.nuevaDivision = '';
      this.loadCatalogs();
      this.snack.open('División creada', 'OK', { duration: 2000 });
    });
  }

  crearPrograma() {
    const nombre = this.nuevoPrograma.trim(); if (!nombre) return;
    if (!this.selectedDivisionForPrograma) { this.snack.open('Seleccione la división del programa', 'OK', { duration: 2500 }); return; }
    this.http.post(`${environment.apiBase}/catalog/programas`, { nombre, divisionId: this.selectedDivisionForPrograma }).subscribe(() => {
      this.nuevoPrograma = '';
      this.selectedDivisionForPrograma = null;
      this.loadCatalogs();
      this.snack.open('Programa creado', 'OK', { duration: 2000 });
    });
  }

  crearMateria() {
    const nombre = this.nuevaMateria.trim(); if (!nombre) return;
    this.http.post(`${environment.apiBase}/catalog/materias`, { nombre }).subscribe(() => {
      this.nuevaMateria = '';
      this.loadCatalogs();
      this.snack.open('Materia creada', 'OK', { duration: 2000 });
    });
  }

  // Editing helpers
  startEditDivision(d: any) { this.editDivision = { ...d }; }
  cancelDivisionEdit() { this.editDivision = null; }
  saveDivision() {
    if (!this.editDivision) return;
    const payload: any = { nombre: this.editDivision.nombre, activo: this.editDivision.activo };
    this.http.patch(`${environment.apiBase}/catalog/divisiones/${this.editDivision.id}`, payload).subscribe(() => {
      this.snack.open('División actualizada', 'OK', { duration: 2000 });
      this.editDivision = null; this.loadCatalogs();
    });
  }
  toggleDivision(d: any) {
    this.http.patch(`${environment.apiBase}/catalog/divisiones/${d.id}`, { activo: !d.activo }).subscribe(() => this.loadCatalogs());
  }

  startEditPrograma(p: any) { this.editPrograma = { ...p }; }
  cancelProgramaEdit() { this.editPrograma = null; }
  savePrograma() {
    if (!this.editPrograma) return;
    const payload: any = { nombre: this.editPrograma.nombre, activo: this.editPrograma.activo };
    if (this.editPrograma.divisionId) payload.divisionId = this.editPrograma.divisionId;
    this.http.patch(`${environment.apiBase}/catalog/programas/${this.editPrograma.id}`, payload).subscribe(() => {
      this.snack.open('Programa actualizado', 'OK', { duration: 2000 });
      this.editPrograma = null; this.loadCatalogs();
    });
  }
  togglePrograma(p: any) {
    this.http.patch(`${environment.apiBase}/catalog/programas/${p.id}`, { activo: !p.activo }).subscribe(() => this.loadCatalogs());
  }

  startEditMateria(m: any) { this.editMateria = { ...m }; }
  cancelMateriaEdit() { this.editMateria = null; }
  saveMateria() {
    if (!this.editMateria) return;
    const payload: any = { nombre: this.editMateria.nombre, activo: this.editMateria.activo };
    this.http.patch(`${environment.apiBase}/catalog/materias/${this.editMateria.id}`, payload).subscribe(() => {
      this.snack.open('Materia actualizada', 'OK', { duration: 2000 });
      this.editMateria = null; this.loadCatalogs();
    });
  }
  toggleMateria(m: any) {
    this.http.patch(`${environment.apiBase}/catalog/materias/${m.id}`, { activo: !m.activo }).subscribe(() => this.loadCatalogs());
  }

  startEditUser(u: any) {
    this.editUser = { ...u };
    const ref = this.dialog.open(EditUserDialogComponent, { width: '520px', data: { user: this.editUser, divisiones: this.divisiones() } });
    ref.afterClosed().subscribe(res => {
      if (!res) return; // cancelado
      const payload: any = { nombre: res.nombre, email: res.email, rol: res.rol, activo: res.activo };
      if (res.divisionId) payload.divisionId = res.divisionId;
      if (res.programaId) payload.programaId = res.programaId;
      this.http.patch(`${environment.apiBase}/users/${this.editUser.id}`, payload).subscribe(() => {
        this.snack.open('Usuario actualizado', 'OK', { duration: 2000 });
        this.editUser = null; this.loadAll();
      });
    });
  }
  toggleUser(u: any) {
    this.http.patch(`${environment.apiBase}/users/${u.id}`, { activo: !u.activo }).subscribe(() => this.loadAll());
  }
}
