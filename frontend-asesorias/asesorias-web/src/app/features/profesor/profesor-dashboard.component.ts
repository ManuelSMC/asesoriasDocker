import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  standalone: true,
  selector: 'app-profesor-dashboard',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTabsModule, MatChipsModule, MatSnackBarModule, RouterLink, MatDatepickerModule, MatNativeDateModule, MatSelectModule],
  template: `
    <div class="app-container">
      <mat-card class="card sp-sm">
        <h2>Profesor</h2>
      </mat-card>

      <mat-tab-group>
        <mat-tab label="Mis asesorías">
          <div class="pad-sm grid-auto">
            <mat-card class="card" *ngFor="let a of asesorias()" [routerLink]="['/profesor/asesorias', a.id]" style="cursor:pointer;">
              <div class="center-between">
                <div>#{{a.id}} - Alumno: {{a.alumnoId || '-'}}
                </div>
                <mat-chip-set>
                  <mat-chip [ngClass]="estadoClass(a.estado)">{{a.estado}}</mat-chip>
                </mat-chip-set>
              </div>
              <div class="muted sp-xxs">Tema: {{a.tema || '-'}} | Fecha: {{a.fecha || '-'}}
              </div>
            </mat-card>
          </div>
        </mat-tab>
        <mat-tab label="Peticiones">
          <div class="pad-sm grid-auto">
            <mat-card class="card" *ngFor="let a of pendientes()">
              <div class="center-between">
                <div>#{{a.id}} - Alumno: {{a.alumnoId}} - {{a.tema || '-'}} </div>
                <div class="row gap-sm">
                  <button mat-stroked-button color="primary" (click)="cambiarEstado(a.id, 'APROBADA')">Aprobar</button>
                  <button mat-stroked-button color="warn" (click)="cambiarEstado(a.id, 'RECHAZADA')">Rechazar</button>
                </div>
              </div>
            </mat-card>
          </div>
        </mat-tab>
        <mat-tab label="Programar">
          <div class="pad-sm">
            <div class="row gap-sm wrap center-start">
              <mat-form-field appearance="outline">
                <mat-label>Alumno email (opcional)</mat-label>
                <input matInput [(ngModel)]="newAlumnoEmail" placeholder="alumno@uteq.edu.mx">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tema</mat-label>
                <input matInput [(ngModel)]="newTema">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fecha</mat-label>
                <input matInput [matDatepicker]="picker" [(ngModel)]="progFecha">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Hora</mat-label>
                <mat-select [(ngModel)]="progHora">
                  <mat-option *ngFor="let h of horas" [value]="h">{{h}}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Minutos</mat-label>
                <mat-select [(ngModel)]="progMin">
                  <mat-option *ngFor="let m of minutos" [value]="m">{{m}}</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="crearAsesoria()">Publicar</button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class ProfesorDashboardComponent implements OnInit {
  profesorId = signal<number | null>(null);
  asesorias = signal<any[]>([]);
  pendientes = signal<any[]>([]);
  newAlumnoEmail = '';
  newTema = '';
  progFecha: Date | null = null;
  progHora: string = '';
  progMin: string = '';
  horas: string[] = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  minutos: string[] = ['00','15','30','45'];

  constructor(private http: HttpClient, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const email = this.auth.getEmail();
    if (email) {
      this.http.get<any>(`${environment.apiBase}/users/by-email`, { params: { email } }).subscribe(u => {
        this.profesorId.set(u && u.id != null ? Number(u.id) : null);
        this.loadAsesorias();
      });
    }
  }

  loadAsesorias() {
    const id = this.profesorId();
    if (!id) return;
    this.http.get<any[]>(`${environment.apiBase}/advisories/by-profesor`, { params: { profesorId: String(id) } })
      .subscribe(list => {
        const items = list || [];
        this.asesorias.set(items);
        this.pendientes.set(items.filter(a => a.estado === 'PENDIENTE'));
      });
  }

  cambiarEstado(id: number, estado: string) {
    this.http.patch(`${environment.apiBase}/advisories/${id}/estado`, null, { params: { estado } })
      .subscribe({
        next: () => { this.loadAsesorias(); this.snack.open('Estado actualizado', 'OK', { duration: 2000 }); },
        error: () => this.snack.open('No se pudo actualizar el estado', 'OK', { duration: 2500 })
      });
  }

  crearAsesoria() {
    const profesorId = this.profesorId();
    if (!profesorId) return;
    const payload: any = { profesorId };
    if (this.newAlumnoEmail) payload.alumnoEmail = this.newAlumnoEmail;
    if (this.newTema) payload.tema = this.newTema;
    const fechaStr = this.composeFecha();
    if (fechaStr) payload.fecha = fechaStr;
    this.http.post(`${environment.apiBase}/advisories`, payload).subscribe({
      next: () => {
        this.newAlumnoEmail = '';
        this.newTema = '';
        this.progFecha = null;
        this.progHora = '';
        this.progMin = '';
        this.loadAsesorias();
        this.snack.open('Asesoría creada', 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('No se pudo crear la asesoría', 'OK', { duration: 2500 })
    });
  }

  private composeFecha(): string | null {
    if (!this.progFecha || this.progHora === '' || this.progMin === '') return null;
    const d = new Date(this.progFecha);
    d.setHours(Number(this.progHora), Number(this.progMin), 0, 0);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  estadoClass(estado: string | undefined) {
    const e = (estado || '').toUpperCase();
    if (e === 'PENDIENTE') return 'chip-pendiente';
    if (e === 'APROBADA' || e === 'PROGRAMADA') return 'chip-aprobada';
    if (e === 'RECHAZADA' || e === 'FINALIZADA') return 'chip-rechazada';
    return '';
  }
}

