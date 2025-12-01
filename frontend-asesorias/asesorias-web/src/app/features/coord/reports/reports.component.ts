import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-reports',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, FormsModule, MatFormFieldModule, MatInputModule, NgChartsModule],
  template: `
    <div class="app-container">
      <div class="dashboard-header sp-sm">
        <div class="header-left">
          <h2 class="no-m">Panel de Coordinación</h2>
          <div class="muted small">Visión general de asesorías y usuarios</div>
        </div>
        <div class="header-actions row gap-sm wrap">
          <button mat-stroked-button color="primary" (click)="loadAll()"><mat-icon fontIcon="refresh"></mat-icon> Actualizar</button>
        </div>
      </div>
      <div class="kpi-grid sp-sm">
        <mat-card class="kpi-card" *ngFor="let k of kpis()">
          <div class="row center-between">
            <div class="kpi-icon" [ngClass]="k.color"><mat-icon>{{k.icon}}</mat-icon></div>
            <div class="kpi-value">{{k.value}}</div>
          </div>
          <div class="kpi-label">{{k.label}}</div>
        </mat-card>
      </div>
      <mat-tab-group>
        <mat-tab label="Estados">
          <div class="pad-sm center-box">
            <canvas baseChart class="chart-small"
              [data]="estadoChartData"
              [type]="'pie'"
              [options]="pieOptions">
            </canvas>
          </div>
        </mat-tab>
        <mat-tab label="Por profesor">
          <div class="pad-sm center-box">
            <canvas baseChart class="chart-small"
              [data]="profesorChartData"
              [type]="'bar'"
              [options]="barOptions">
            </canvas>
          </div>
        </mat-tab>
        <mat-tab label="Por alumno">
          <div class="pad-sm center-box">
            <canvas baseChart class="chart-small"
              [data]="alumnoChartData"
              [type]="'bar'"
              [options]="barOptions">
            </canvas>
          </div>
        </mat-tab>
        <mat-tab label="Usuarios">
          <div class="pad-sm">
            <div class="row gap-sm wrap sp-xs">
              <mat-form-field appearance="outline" style="min-width:280px;">
                <mat-label>Filtrar por nombre o correo</mat-label>
                <input matInput [(ngModel)]="userFilter" (ngModelChange)="applyUserFilter()" placeholder="ana | ana@uteq.edu.mx">
              </mat-form-field>
              <button mat-stroked-button (click)="reloadUsers()">Refrescar</button>
              <span class="muted">{{filteredUsers().length}} usuarios</span>
            </div>
            <div class="grid-auto sp-sm">
              <mat-card class="card" *ngFor="let u of filteredUsers()">
                <div class="card-title">{{u.nombre || 'Sin nombre'}}</div>
                <div class="muted">{{u.email}}</div>
                <div>Rol: <b>{{u.rol}}</b></div>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  estado = signal<any[]>([]);
  profesor = signal<any[]>([]);
  alumno = signal<any[]>([]);
  users = signal<any[]>([]);
  userFilter: string = '';
  kpis = signal<{label:string,value:number,icon:string,color:string}[]>([]);

  pieOptions: ChartOptions<'pie'> = { responsive: true, plugins: { legend: { position: 'right' } } };
  barOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { x: {}, y: { beginAtZero: true } } };
  estadoChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [{ data: [], backgroundColor: ['#90CAF9','#A5D6A7','#FFAB91','#CE93D8','#FFF59D','#EF9A9A'] }] };
  profesorChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  alumnoChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  ngOnInit(): void { this.loadAll(); }

  constructor(private http: HttpClient) {}

  loadEstado() {
    this.http.get<any[]>(`${environment.apiBase}/advisories/reports/estado`).subscribe(r => {
      this.estado.set(r || []);
      this.estadoChartData.labels = this.estado().map(e => e.estado);
      this.estadoChartData.datasets[0].data = this.estado().map(e => e.total);
      this.updateKpis();
    });
  }
  loadProfesor() {
    this.http.get<any[]>(`${environment.apiBase}/advisories/reports/profesor-estado`).subscribe(r => {
      this.profesor.set(r || []);
      // Group by estado for stacked dataset idea
      const estados = Array.from(new Set(this.profesor().map(p => p.estado)));
      const profesoresIds = Array.from(new Set(this.profesor().map(p => p.profesorId)));
      this.profesorChartData.labels = profesoresIds.map(id => 'Prof ' + id);
      this.profesorChartData.datasets = estados.map(est => ({
        label: est,
        data: profesoresIds.map(id => {
          const match = this.profesor().find(p => p.profesorId === id && p.estado === est);
          return match ? match.total : 0;
        }),
        backgroundColor: this.colorForEstado(est)
      }));
    });
  }
  loadAlumno() {
    this.http.get<any[]>(`${environment.apiBase}/advisories/reports/alumno-estado`).subscribe(r => {
      this.alumno.set(r || []);
      const estados = Array.from(new Set(this.alumno().map(p => p.estado)));
      const alumnoIds = Array.from(new Set(this.alumno().map(p => p.alumnoId)));
      this.alumnoChartData.labels = alumnoIds.map(id => 'Al ' + id);
      this.alumnoChartData.datasets = estados.map(est => ({
        label: est,
        data: alumnoIds.map(id => {
          const match = this.alumno().find(p => p.alumnoId === id && p.estado === est);
          return match ? match.total : 0;
        }),
        backgroundColor: this.colorForEstado(est)
      }));
    });
  }

  divisionChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  programaChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  loadAll() {
    this.loadEstado();
    this.loadProfesor();
    this.loadAlumno();
    this.reloadUsers();
    this.loadDivisionProgramaBreakdown();
  }

  reloadUsers() {
    this.http.get<any[]>(`${environment.apiBase}/users`).subscribe(list => this.users.set(list || []));
  }

  applyUserFilter() {}
  filteredUsers() {
    const q = this.userFilter.trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u => (u.nombre||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
  }

  private colorForEstado(est: string) {
    const e = est.toUpperCase();
    if (e === 'PENDIENTE') return '#90CAF9';
    if (e === 'APROBADA' || e === 'PROGRAMADA') return '#A5D6A7';
    if (e === 'RECHAZADA') return '#EF9A9A';
    if (e === 'FINALIZADA') return '#CE93D8';
    return '#B0BEC5';
  }

  private updateKpis() {
    const totalAsesorias = this.estado().reduce((acc, r) => acc + (r.total || 0), 0);
    const aprobadas = this.estado().find(e => e.estado === 'APROBADA')?.total || 0;
    const pendientes = this.estado().find(e => e.estado === 'PENDIENTE')?.total || 0;
    const finalizadas = this.estado().find(e => e.estado === 'FINALIZADA')?.total || 0;
    const profesoresUnicos = new Set(this.profesor().map(p => p.profesorId)).size;
    const alumnosUnicos = new Set(this.alumno().map(a => a.alumnoId)).size;
    this.kpis.set([
      { label: 'Total asesorías', value: totalAsesorias, icon: 'fact_check', color: 'kpi-blue' },
      { label: 'Pendientes', value: pendientes, icon: 'schedule', color: 'kpi-cyan' },
      { label: 'Aprobadas', value: aprobadas, icon: 'thumb_up', color: 'kpi-green' },
      { label: 'Finalizadas', value: finalizadas, icon: 'done_all', color: 'kpi-purple' },
      { label: 'Profesores activos', value: profesoresUnicos, icon: 'co_present', color: 'kpi-indigo' },
      { label: 'Alumnos atendidos', value: alumnosUnicos, icon: 'groups', color: 'kpi-orange' }
    ]);
  }

  private loadDivisionProgramaBreakdown() {
    // Using users list: count profesores per division and alumnos per programa
    this.http.get<any[]>(`${environment.apiBase}/users`).subscribe(list => {
      const users = (list || []);
      const byDivision = new Map<number, number>();
      const byPrograma = new Map<number, number>();
      const divisionLabels = new Map<number, string>();
      const programaLabels = new Map<number, string>();
      users.forEach(u => {
        if (u.rol === 'PROFESOR' && u.divisionId) {
          byDivision.set(u.divisionId, (byDivision.get(u.divisionId) || 0) + 1);
        }
        if (u.rol === 'ALUMNO' && u.programaId) {
          byPrograma.set(u.programaId, (byPrograma.get(u.programaId) || 0) + 1);
        }
      });
      // Fetch labels
      this.http.get<any[]>(`${environment.apiBase}/catalog/divisiones`).subscribe(divs => {
        (divs||[]).forEach(d => divisionLabels.set(d.id, d.nombre));
        const ids = Array.from(byDivision.keys());
        this.divisionChartData.labels = ids.map(id => divisionLabels.get(id) || ('División ' + id));
        this.divisionChartData.datasets = [{ label: 'Profesores por división', data: ids.map(id => byDivision.get(id) || 0), backgroundColor: '#90CAF9' }];
      });
      this.http.get<any[]>(`${environment.apiBase}/catalog/programas`).subscribe(progs => {
        (progs||[]).forEach(p => programaLabels.set(p.id, p.nombre));
        const ids = Array.from(byPrograma.keys());
        this.programaChartData.labels = ids.map(id => programaLabels.get(id) || ('Programa ' + id));
        this.programaChartData.datasets = [{ label: 'Alumnos por programa', data: ids.map(id => byPrograma.get(id) || 0), backgroundColor: '#A5D6A7' }];
      });
    });
  }
}
