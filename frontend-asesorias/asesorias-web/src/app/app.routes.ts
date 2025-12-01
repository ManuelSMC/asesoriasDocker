import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
	},
	{
		path: '',
		canActivate: [AuthGuard],
		loadComponent: () => Promise.resolve(ShellComponent),
		children: [
			{
				path: 'alumno',
				canActivate: [RoleGuard],
				data: { roles: ['ALUMNO'] },
				loadComponent: () => import('./features/alumno/alumno-dashboard.component').then(m => m.AlumnoDashboardComponent)
			},
			{
				path: 'profesor',
				canActivate: [RoleGuard],
				data: { roles: ['PROFESOR'] },
				loadComponent: () => import('./features/profesor/profesor-dashboard.component').then(m => m.ProfesorDashboardComponent)
			},
				{ path: 'profesor/asesorias/:id', loadComponent: () => import('./features/profesor/advisory-detail.component').then(m => m.AdvisoryDetailComponent), canActivate: [RoleGuard], data: { roles: ['PROFESOR'] } },
			{
				path: 'admin/users',
				canActivate: [RoleGuard],
				data: { roles: ['ADMINISTRADOR'] },
				loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
			},
			{
				path: 'coord/reports',
				canActivate: [RoleGuard],
				data: { roles: ['COORDINADOR'] },
				loadComponent: () => import('./features/coord/reports/reports.component').then(m => m.ReportsComponent)
			}
		]
	},
	{ path: '**', redirectTo: 'login' }
];
