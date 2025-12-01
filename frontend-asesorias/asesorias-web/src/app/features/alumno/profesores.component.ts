import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-profesores',
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="app-container">
      <mat-card class="card sp-sm">
        <h2>Profesores</h2>
        <div class="row gap-sm wrap center-start">
          <mat-form-field appearance="outline">
            <mat-label>Materia</mat-label>
            <mat-select [(ngModel)]="materiaSeleccionada">
              <mat-option [value]="''">Todas</mat-option>
              <mat-option *ngFor="let m of materias()" [value]="m">{{m}}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Buscar por correo</mat-label>
            <input matInput [(ngModel)]="filtroTexto" placeholder="profesor@uteq.edu.mx">
          </mat-form-field>
          <button mat-stroked-button color="primary" (click)="refrescar()">Actualizar</button>
        </div>
      </mat-card>

      <div class="grid-auto sp-sm">
        <mat-card class="card" *ngFor="let p of profesoresFiltrados()">
          <div class="card-title">{{p.nombre || 'Profesor'}}</div>
          <div class="muted">{{p.email}}</div>
          <div class="row gap-sm wrap sp-xs">
            <mat-form-field appearance="outline" style="flex:1;">
              <mat-label>Tema</mat-label>
              <input matInput [(ngModel)]="tema">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha</mat-label>
              <input matInput type="datetime-local" [(ngModel)]="fecha">
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="solicitar(p.id)">Solicitar</button>
          </div>
        </mat-card>
      </div>
    </div>
  `
})
export class ProfesoresComponent implements OnInit {
  profesores = signal<any[]>([]);
  materias = signal<string[]>([]);
  materiaSeleccionada: string = '';
  filtroTexto: string = '';
  tema = '';
  fecha = '';
  alumnoId: number | null = null;

  constructor(private http: HttpClient, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const email = this.auth.getEmail();
    if (email) {
      this.http.get<any>(`${environment.apiBase}/users/by-email`, { params: { email } }).subscribe(u => {
        this.alumnoId = u?.id ?? null;
      });
    }
    this.refrescar();
  }

  refrescar() {
    // Profesores desde user-service
    this.http.get<any[]>(`${environment.apiBase}/users`).subscribe(list => {
      this.profesores.set((list || []).filter(u => u.rol === 'PROFESOR'));
    });
    // Derivar materias desde asesorías (temas únicos)
    this.http.get<any[]>(`${environment.apiBase}/advisories`).subscribe(list => {
      const temas = Array.from(new Set((list || []).map(a => a.tema).filter(Boolean)));
      this.materias.set(temas);
    });
  }

  profesoresFiltrados() {
    const q = this.filtroTexto.toLowerCase();
    const mat = this.materiaSeleccionada;
    return this.profesores().filter(p => {
      const tMatch = !q || (p.email?.toLowerCase().includes(q) || p.nombre?.toLowerCase().includes(q));
      if (!mat) return tMatch;
      // If materia selected, only show professors that have advisories for that tema
      return tMatch; // keep simple without backend join
    });
  }

  solicitar(profesorId: number) {
    if (!this.alumnoId) return;
    const payload: any = { alumnoId: this.alumnoId, profesorId };
    if (this.tema) payload.tema = this.tema;
    if (this.fecha) payload.fecha = this.fecha;
    this.http.post(`${environment.apiBase}/advisories`, payload).subscribe({
      next: () => {
        this.tema = '';
        this.fecha = '';
        this.snack.open('Solicitud enviada al profesor', 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('No se pudo enviar la solicitud', 'OK', { duration: 2500 })
    });
  }
}
