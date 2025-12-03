# Plataforma de Asesorías - Arquitectura Microservicios

## Objetivo
Sistema para gestionar asesorías académicas entre Alumnos y Profesores, con funciones administrativas (Administrador), coordinación y reportes (Coordinador), notificaciones y control de programas/divisiones. Autenticación solo con correos institucionales `@uteq.edu.mx` y control de roles.

## Microservicios
1. eureka-server (Registro de servicios)
2. api-gateway (Entrada única, routing, filtros de seguridad)
3. auth-service (Login, emisión y validación de JWT, dominio @uteq.edu.mx)
4. advisory-service (Asesorías)
5. user-service (Usuarios y roles)
6. materia-service (Materias)
7. division-service (Divisiones)
8. profesor-service (Profesores)
9. programa-service (Programas educativos)
10. notificacion-service (Notificaciones)
11. angular-frontend (UI)

## Roles y Capacidades
- ALUMNO: Solicitar asesorías, ver pendientes, historial, filtrar asesorías y profesores.
- PROFESOR: Ver solicitudes, programar asesorías, editar/cancelar, notificar visto, recibir recordatorios.
- ADMINISTRADOR: CRUD divisiones, programas educativos, usuarios, asignar profesores a divisiones, habilitar/deshabilitar.
- COORDINADOR: Ver estadísticas y reportes, descargar PDF.

## Puertos Locales (propuesta)
- eureka-server: 8761
- api-gateway: 8080
- auth-service: 8081
- advisory-service: 8081
- user-service: 8080
- materia-service: 8082
- division-service: 8083
- profesor-service: 8084
- programa-service: 8085
- notificacion-service: 8086
- angular-frontend: 4200

## Flujo de Autenticación
1. Usuario envía email institucional + contraseña a `auth-service /auth/login`.
2. auth-service valida dominio `@uteq.edu.mx` y credenciales contra base de usuarios (consultará `user-service` vía REST interno o base compartida inicial).
3. Emite JWT con `sub`, `roles`, `exp`.
4. Frontend guarda token (localStorage) y lo envía en `Authorization: Bearer <token>`.
5. `api-gateway` aplica pre-filtro para rechazar peticiones sin token o inválidas (excepto rutas públicas como /auth/login).
6. Cada servicio valida firma y roles (filtro JWT común reutilizable).

## Persistencia
- MySQL (instancia local) con esquemas separados: `users_db`, `advisory_db` (posteriormente `notification_db`, `reporting_db` si se requiere).
- Cada servicio administra su propio esquema (principio de autonomía). Para prototipo inicial se pueden compartir una instancia con múltiples schemas.

## Comunicación Inter-Servicios
- Síncrona directa con Spring Cloud OpenFeign, servicios registrados en Eureka.
- Futuro: Asíncrona (RabbitMQ / Kafka) para notificaciones y eventos.

## Entidades Principales (borrador)
User(id, nombre, email, rol, activo, division_id?, programa_id?)
Division(id, nombre, activo)
ProgramaEducativo(id, nombre, division_id, activo)
Asesoria(id, profesor_id, titulo, descripcion, estado[PENDIENTE|PROGRAMADA|CANCELADA|FINALIZADA], fecha_programada, capacidad, created_at)
SolicitudAsesoria(id, asesoria_id?, alumno_id, profesor_id, estado[SOLICITADA|VISTA|ACEPTADA|RECHAZADA], created_at)
Notificacion(id, user_id, tipo, mensaje, leida, created_at)

## Estados Clave
- SolicitudAsesoria: SOLICITADA -> VISTA -> (ACEPTADA | RECHAZADA)
- Asesoria: PENDIENTE (creada) -> PROGRAMADA -> (CANCELADA | FINALIZADA)

## Estrategia de Desarrollo Incremental
1. eureka-server
2. api-gateway + filtro simple JWT (token dummy hasta auth-service listo)
3. auth-service (login + emisión JWT)
4. user-service (CRUD usuarios + validación dominio)
5. advisory-service (CRUD asesorías + solicitudes)
6. Integrar seguridad real (roles) y refinamiento filtros.
7. Angular frontend (módulos base + login + dashboards mínimos).
8. Stubs notification-service y reporting-service.
9. Extender con eventos y PDF.

## Seguridad
- JWT HS256 inicialmente (clave secreta en variable de entorno `JWT_SECRET`). Migrar a RS256 con par de llaves para producción.
- Validación de dominio: rechazar emails que no terminen en `@uteq.edu.mx` al crear usuario y login.

## Requisitos Previos Local
- Java 17+
- Maven 3.8+
- Node 18+ y Angular CLI
- MySQL 8.x

## Levantar Servicios (cuando estén scaffold)
Orden sugerido:
1. `eureka-server` (http://localhost:8761)
2. `api-gateway`
3. `auth-service`
4. `user-service`
5. `advisory-service`
6. Frontend Angular

## Próximos Pasos
Crear proyecto `eureka-server` y luego `api-gateway`.

---
Este documento se actualizará conforme se avanza en el desarrollo.
