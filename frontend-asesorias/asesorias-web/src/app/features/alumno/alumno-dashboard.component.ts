import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  standalone: true,
  selector: 'app-alumno-dashboard',
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatTabsModule, MatChipsModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule],
  template: `
    <div class="app-container">
      <mat-card class="card sp-sm">
        <h2>Alumno</h2>
        <div>Bienvenido: <strong>{{ auth.email() }}</strong></div>
      </mat-card>

      <mat-tab-group (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Explorar asesorías">
          <div class="pad-sm">
            <div class="row wrap gap-sm sp-xs">
              <mat-form-field appearance="outline" style="max-width:380px; width:100%;">
                <mat-label>Filtrar por tema o profesorId</mat-label>
                <input matInput [(ngModel)]="asesoriaFilter">
              </mat-form-field>
              <button mat-stroked-button color="primary" (click)="showSolicitud = !showSolicitud">{{ showSolicitud ? 'Cerrar' : 'Solicitar asesoría' }}</button>
            </div>
            <mat-card class="card sp-sm" *ngIf="showSolicitud">
              <div class="row wrap gap-sm">
                <mat-form-field appearance="outline" style="flex:1 1 280px;">
                  <mat-label>Buscar profesor por correo</mat-label>
                  <input matInput [(ngModel)]="solicProfQuery" placeholder="profesor@uteq.edu.mx">
                </mat-form-field>
                <mat-form-field appearance="outline" style="flex:1 1 280px;">
                  <mat-label>Selecciona profesor</mat-label>
                  <mat-select [(ngModel)]="solicProfSelectedId">
                    <mat-option *ngFor="let p of filteredProfesoresByEmail()" [value]="p.id">{{p.email}} — {{p.nombre || 'Profesor'}}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="col" style="flex:1 1 100%;">
                  <mat-label>Tema</mat-label>
                  <textarea matInput [(ngModel)]="solicTema" rows="3" placeholder="Describe el tema o asunto"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Fecha</mat-label>
                  <input matInput [matDatepicker]="picker2" [(ngModel)]="solicFecha">
                  <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
                  <mat-datepicker #picker2></mat-datepicker>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Hora</mat-label>
                  <mat-select [(ngModel)]="solicHora">
                    <mat-option *ngFor="let h of horas" [value]="h">{{h}}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Minutos</mat-label>
                  <mat-select [(ngModel)]="solicMin">
                    <mat-option *ngFor="let m of minutos" [value]="m">{{m}}</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="row gap-sm">
                  <button mat-flat-button color="primary" (click)="solicitarDesdeExplorar()" [disabled]="!solicProfSelectedId">Enviar solicitud</button>
                </div>
              </div>
            </mat-card>
            <div class="grid-auto sp-xs">
              <mat-card class="card" *ngFor="let a of filteredAsesorias()">
                <div class="center-between">
                  <div>#{{a.id}} - Profesor: {{a.profesorId}}</div>
                  <mat-chip-set>
                    <mat-chip [ngClass]="estadoClass(a.estado)">{{a.estado}}</mat-chip>
                  </mat-chip-set>
                </div>
                <div class="muted sp-xxs">Tema: {{a.tema || '-'}} | Fecha: {{a.fecha || '-'}}
                </div>
                <div class="sp-xs">
                  <button mat-flat-button color="primary" (click)="registrarse(a)">Registrarse</button>
                </div>
              </mat-card>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Mis asesorías">
          <div class="pad-sm">
            <div class="row gap-sm wrap sp-xs">
              <button mat-stroked-button [color]="estadoFiltro === '' ? 'primary' : undefined" (click)="estadoFiltro = ''">Todas</button>
              <button mat-stroked-button [color]="estadoFiltro === 'PENDIENTE' ? 'primary' : undefined" (click)="estadoFiltro = 'PENDIENTE'">Pendientes</button>
              <button mat-stroked-button [color]="estadoFiltro === 'APROBADA' ? 'primary' : undefined" (click)="estadoFiltro = 'APROBADA'">Aprobadas</button>
              <button mat-stroked-button [color]="estadoFiltro === 'RECHAZADA' ? 'primary' : undefined" (click)="estadoFiltro = 'RECHAZADA'">Rechazadas</button>
              <button mat-stroked-button [color]="estadoFiltro === 'FINALIZADA' ? 'primary' : undefined" (click)="estadoFiltro = 'FINALIZADA'">Finalizadas</button>
              <span class="muted">Mostrando {{ pendientesFiltradas().length }} asesorías</span>
            </div>
            <div class="sp-sm grid-auto">
              <mat-card class="card" *ngFor="let a of pendientesFiltradas()">
                <div class="center-between">
                  <div>#{{a.id}} - Profesor: {{a.profesorId}}</div>
                  <mat-chip-set>
                    <mat-chip [ngClass]="estadoClass(a.estado)">{{a.estado}}</mat-chip>
                  </mat-chip-set>
                </div>
                <div class="muted sp-xxs">Tema: {{a.tema || '-'}} | Fecha: {{a.fecha || '-'}}
                </div>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class AlumnoDashboardComponent implements OnInit {
  pendientes = signal<any[]>([]);
  alumnoId = signal<number | null>(null);
  profesores = signal<any[]>([]);
  asesorias = signal<any[]>([]);
  profFilter = '';
  asesoriaFilter = '';
  tema = '';
  fecha = '';
  estadoFiltro: '' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'FINALIZADA' = '';
  showSolicitud = false;
  solicProfQuery = '';
  solicProfSelectedId: number | null = null;
  solicTema = '';
  solicFecha: Date | null = null;
  solicHora: string = '';
  solicMin: string = '';
  horas: string[] = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  minutos: string[] = ['00','15','30','45'];

  constructor(private http: HttpClient, public auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const email = this.auth.getEmail();
    if (email) {
      this.http.get<any>(`${environment.apiBase}/users/by-email`, { params: { email } }).subscribe(u => {
        this.alumnoId.set(u?.id ?? null);
        this.loadProfesores();
        this.loadAsesorias();
        this.loadPendientes();
      });
    }
  }

  loadPendientes() {
    const id = this.alumnoId();
    if (!id) return;
    // Combine advisories created by the alumno and registrations
    this.http.get<any[]>(`${environment.apiBase}/advisories/by-alumno`, { params: { alumnoId: String(id) } })
      .subscribe(own => {
        this.http.get<any[]>(`${environment.apiBase}/advisories/registered/by-alumno`, { params: { alumnoId: String(id) } })
          .subscribe(registered => {
            const merged = [...(own || []), ...(registered || [])];
            // De-duplicate by id in case of overlap
            const seen = new Set<number>();
            const unique = merged.filter(a => {
              if (seen.has(a.id)) return false; seen.add(a.id); return true;
            });
            this.pendientes.set(unique);
          });
      });
  }

  loadProfesores() {
    this.http.get<any[]>(`${environment.apiBase}/users`).subscribe(list => {
      this.profesores.set((list || []).filter(u => u.rol === 'PROFESOR'));
    });
  }

  loadAsesorias() {
    this.http.get<any[]>(`${environment.apiBase}/advisories`).subscribe(list => this.asesorias.set(list || []));
  }

  filteredProfesores() {
    const q = this.profFilter.toLowerCase();
    return this.profesores().filter(p => !q || (p.nombre?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)));
  }

  filteredAsesorias() {
    const q = this.asesoriaFilter.toLowerCase();
    return this.asesorias().filter(a => !q || (String(a.profesorId).includes(q) || (a.tema||'').toLowerCase().includes(q)));
  }

  filteredProfesoresByEmail() {
    const q = this.solicProfQuery.toLowerCase();
    return this.profesores().filter(p => p.rol === 'PROFESOR' && (!q || (p.email?.toLowerCase().includes(q))));
  }

  estadoClass(estado: string | undefined) {
    const e = (estado || '').toUpperCase();
    if (e === 'PENDIENTE') return 'chip-pendiente';
    if (e === 'APROBADA' || e === 'PROGRAMADA') return 'chip-aprobada';
    if (e === 'RECHAZADA' || e === 'FINALIZADA') return 'chip-rechazada';
    return '';
  }

  solicitar(profesorId: number) {
    const alumnoId = this.alumnoId();
    if (!alumnoId) return;
    const payload: any = { alumnoId, profesorId };
    if (this.tema) payload.tema = this.tema;
    if (this.fecha) payload.fecha = this.fecha; // yyyy-MM-ddTHH:mm
    this.http.post(`${environment.apiBase}/advisories`, payload).subscribe({
      next: () => {
      this.loadPendientes();
      this.loadAsesorias();
      this.tema = '';
      this.fecha = '';
        this.snack.open('Solicitud enviada', 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('No se pudo solicitar la asesoría', 'OK', { duration: 2500 })
    });
  }

  registrarse(a: any) {
    const alumnoId = this.alumnoId();
    if (!alumnoId) return;
    const ok = window.confirm('¿Confirmas tu registro a esta asesoría?');
    if (!ok) return;
    const payload: any = { alumnoId };
    this.http.post(`${environment.apiBase}/advisories/${a.id}/registrations`, payload).subscribe({
      next: () => {
        this.loadPendientes();
        this.loadAsesorias();
        this.snack.open('Registro completado', 'OK', { duration: 2000 });
      },
      error: (err) => this.snack.open(err?.status === 409 ? 'Ya estás registrado' : 'No se pudo registrar', 'OK', { duration: 2500 })
    });
  }

  pendientesFiltradas() {
    const list = this.pendientes();
    const f = this.estadoFiltro;
    if (!f) return list;
    return list.filter(a => (a.estado || '').toUpperCase() === f);
  }

  onTabChange(evt: any) {
    const idx = evt?.index ?? 0;
    // 1: Mis asesorías (second tab)
    if (idx === 1) this.loadPendientes();
  }

  private composeFecha(): string | null {
    if (!this.solicFecha || this.solicHora === '' || this.solicMin === '') return null;
    const d = new Date(this.solicFecha);
    d.setHours(Number(this.solicHora), Number(this.solicMin), 0, 0);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  solicitarDesdeExplorar() {
    const profesorId = this.solicProfSelectedId;
    if (!profesorId) return;
    const payload: any = { profesorId };
    if (this.solicTema) payload.tema = this.solicTema;
    const f = this.composeFecha();
    if (f) payload.fecha = f;
    this.http.post(`${environment.apiBase}/advisories`, payload).subscribe({
      next: () => {
        this.snack.open('Solicitud enviada', 'OK', { duration: 2000 });
        this.showSolicitud = false;
        this.solicProfQuery = '';
        this.solicProfSelectedId = null;
        this.solicTema = '';
        this.solicFecha = null;
        this.solicHora = '';
        this.solicMin = '';
        this.loadPendientes();
        this.loadAsesorias();
      },
      error: () => this.snack.open('No se pudo enviar la solicitud', 'OK', { duration: 2500 })
    });
  }
}
