import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of, map, catchError } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  standalone: true,
  selector: 'app-advisory-detail',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatSnackBarModule, MatFormFieldModule, MatInputModule, FormsModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule, MatChipsModule, MatDividerModule],
  template: `
    <div class="app-container" style="padding-top:8px;">
      <a routerLink="/profesor" mat-stroked-button color="primary">← Volver</a>
      <mat-card style="margin:16px 0; padding:16px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div>
            <h2 style="margin:0 0 4px 0;">Asesoría #{{advisory()?.id}}</h2>
            <div style="color:#666">Profesor: {{advisory()?.profesorId}}</div>
          </div>
          <mat-chip-set>
            <mat-chip [ngClass]="estadoClass(advisory()?.estado)">{{advisory()?.estado}}</mat-chip>
          </mat-chip-set>
        </div>
      </mat-card>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
        <mat-card style="padding:12px 16px;">
          <h3 style="margin:4px 0 8px 0;">Alumnos Registrados</h3>
          <mat-divider></mat-divider>
          <div *ngIf="registrados().length === 0" style="color:#666; padding:12px 0;">Sin registrados</div>
          <div *ngFor="let r of registrados()" style="padding:12px 0; display:flex; flex-direction:column; gap:2px;">
            <div style="font-weight:600;">{{r.nombre || ('Alumno ' + r.alumnoId)}}</div>
            <div style="color:#666;">{{r.email || 'Sin correo'}}</div>
            <mat-divider></mat-divider>
          </div>
        </mat-card>

        <mat-card style="padding:12px 16px;">
          <h3 style="margin:4px 0 8px 0;">Gestionar</h3>
          <mat-divider></mat-divider>
          <div style="display:flex; flex-direction:column; gap:14px; padding-top:12px;">
            <mat-form-field appearance="outline">
              <mat-label>Tema</mat-label>
              <input matInput [(ngModel)]="tema">
            </mat-form-field>
            <div style="display:flex; gap:12px;">
              <mat-form-field appearance="outline" style="flex:1;">
                <mat-label>Fecha</mat-label>
                <input matInput [matDatepicker]="picker" [(ngModel)]="fechaDate">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" style="min-width:160px;">
                <mat-label>Hora</mat-label>
                <input matInput type="time" [(ngModel)]="hora">
              </mat-form-field>
            </div>
            <div style="display:flex; gap:10px;">
              <button mat-stroked-button color="primary" (click)="guardar()">Guardar cambios</button>
              <button mat-flat-button color="warn" (click)="confirmarFinalizar()">Finalizar asesoría</button>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `
})
export class AdvisoryDetailComponent implements OnInit {
  id!: number;
  advisory = signal<any | null>(null);
  regsRaw = signal<any[]>([]);
  registrados = signal<any[]>([]);
  tema = '';
  fechaDate: Date | null = null;
  hora = '';

  constructor(private route: ActivatedRoute, private http: HttpClient, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private load() {
    this.http.get<any>(`${environment.apiBase}/advisories/${this.id}`).subscribe(a => {
      this.advisory.set(a);
      this.tema = a?.tema || '';
      if (a?.fecha) {
        const d = new Date(a.fecha);
        this.fechaDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        this.hora = `${hh}:${mm}`;
      } else {
        const now = new Date();
        // Round to next half hour for convenience
        const minutes = now.getMinutes();
        const add = minutes > 30 ? (60 - minutes) : (30 - minutes);
        now.setMinutes(minutes + add, 0, 0);
        this.fechaDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        this.hora = `${hh}:${mm}`;
      }
    });
    this.http.get<any[]>(`${environment.apiBase}/advisories/${this.id}/registrations`).subscribe(regs => {
      const list = regs || [];
      this.regsRaw.set(list);
      if (list.length === 0) { this.registrados.set([]); return; }
      const lookups = list.map(r => this.fetchUser(r.alumnoId));
      forkJoin(lookups).subscribe(users => {
        const detailed = list.map((r, idx) => {
          const u = users[idx] || {};
          const { nombre, email } = this.resolveUserNameEmail(u);
          return { alumnoId: r.alumnoId, nombre, email };
        });
        this.registrados.set(detailed);
      });
    });
  }

  private composeFecha(): string | null {
    if (!this.fechaDate || !this.hora) return null;
    const [h, m] = this.hora.split(':');
    const d = new Date(this.fechaDate);
    d.setHours(Number(h), Number(m), 0, 0);
    // LocalDateTime ISO without timezone
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  private fetchUser(id: number) {
    // Try multiple endpoints to maximize compatibility
    const base = environment.apiBase;
    const req1 = this.http.get<any>(`${base}/users/${id}`).pipe(catchError(() => of(null)));
    const req2 = this.http.get<any>(`${base}/users/by-id`, { params: { id: String(id) } }).pipe(catchError(() => of(null)));
    return forkJoin([req1, req2]).pipe(map(([a, b]) => a || b || null));
  }

  private resolveUserNameEmail(u: any): { nombre: string; email: string } {
    if (!u) return { nombre: 'Alumno', email: '' };
    const email = u.email || u.correo || u.username || '';
    const parts = [u.nombre || u.firstName || u.name || '', u.apellido || u.lastName || u.surname || '']
      .map((s: string) => (s || '').trim())
      .filter(Boolean);
    const nombre = parts.join(' ').trim() || (u.nombre || u.firstName || 'Alumno');
    return { nombre, email };
  }

  guardar() {
    const body: any = {};
    if (this.tema) body.tema = this.tema;
    const fechaStr = this.composeFecha();
    if (fechaStr) body.fecha = fechaStr;
    this.http.patch(`${environment.apiBase}/advisories/${this.id}`, body).subscribe({
      next: () => this.snack.open('Cambios guardados', 'OK', { duration: 2000 }),
      error: () => this.snack.open('No se pudo guardar', 'OK', { duration: 2500 })
    });
  }

  confirmarFinalizar() {
    const ok = confirm('¿Finalizar esta asesoría? Esta acción no se puede deshacer.');
    if (!ok) return;
    this.http.patch(`${environment.apiBase}/advisories/${this.id}/estado`, null, { params: { estado: 'FINALIZADA' } })
      .subscribe({
        next: () => { this.snack.open('Asesoría finalizada', 'OK', { duration: 2000 }); this.load(); },
        error: () => this.snack.open('No se pudo finalizar', 'OK', { duration: 2500 })
      });
  }

  estadoClass(estado?: string) {
    const e = (estado || '').toUpperCase();
    if (e === 'PENDIENTE') return 'chip-pendiente';
    if (e === 'APROBADA' || e === 'PROGRAMADA') return 'chip-aprobada';
    if (e === 'RECHAZADA' || e === 'FINALIZADA') return 'chip-rechazada';
    return '';
  }
}
