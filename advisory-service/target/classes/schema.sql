-- Allow creating advisories without a pre-assigned alumno
-- Make alumno_id nullable if it's currently NOT NULL (idempotent for MySQL)
ALTER TABLE advisories MODIFY alumno_id BIGINT NULL;