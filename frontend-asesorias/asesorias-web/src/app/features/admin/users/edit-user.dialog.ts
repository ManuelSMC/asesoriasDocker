import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-edit-user-dialog',
  imports: [CommonModule, MatDialogModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Editar usuario</h2>
    <div mat-dialog-content>
      <div class="row gap-sm wrap">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="model.nombre">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="model.email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Rol</mat-label>
          <mat-select [(ngModel)]="model.rol">
            <mat-option value="ALUMNO">ALUMNO</mat-option>
            <mat-option value="PROFESOR">PROFESOR</mat-option>
            <mat-option value="ADMINISTRADOR">ADMINISTRADOR</mat-option>
            <mat-option value="COORDINADOR">COORDINADOR</mat-option>
          </mat-select>
        </mat-form-field>
        <ng-container *ngIf="model.rol === 'PROFESOR'">
          <mat-form-field appearance="outline" class="full">
            <mat-label>División</mat-label>
            <mat-select [(ngModel)]="model.divisionId">
              <mat-option *ngFor="let d of divisiones" [value]="d.id">{{d.nombre}}</mat-option>
            </mat-select>
          </mat-form-field>
        </ng-container>
      </div>
    </div>
    <div mat-dialog-actions class="row gap-sm end">
      <button mat-button (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()">Guardar</button>
    </div>
  `,
  styles: [`
    .full { width: 100%; }
    .row { display:flex; }
    .gap-sm { gap: 12px; }
    .wrap { flex-wrap: wrap; }
    .end { justify-content:flex-end; width:100%; }
  `]
})
export class EditUserDialogComponent {
  model: any;
  divisiones: any[];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: any, divisiones: any[] },
    private ref: MatDialogRef<EditUserDialogComponent>
  ) {
    this.model = { ...data.user };
    this.divisiones = data.divisiones || [];
  }
  close() { this.ref.close(null); }
  save() { this.ref.close(this.model); }
}
