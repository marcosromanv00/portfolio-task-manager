# Plan de Migración a Supabase

Este documento detalla los pasos para migrar el almacenamiento de tareas de `localStorage` a una base de datos de Supabase.

## 1. Configuración de Base de Datos (Supabase)

Ejecuta el siguiente SQL en el editor de Supabase para crear la tabla y configurar la seguridad:

```sql
-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de tareas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'done', 'discarded', 'backlog', 'archived')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('Activos (Portafolio Plantillas)', 'Trabajo Estable', 'MCPs/Automatización', 'Tesis', 'Admin/Personal')),
  relation TEXT,
  tags TEXT[] DEFAULT '{}',
  due_at TIMESTAMPTZ,
  start_at TIMESTAMPTZ,
  duration_min INTEGER,
  is_group BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  bubble JSONB NOT NULL -- Para x, y, radius, color, velocity
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso total (Ajustar según necesidad de auth)
CREATE POLICY "Allow all access" ON tasks FOR ALL USING (true);
```

## 2. Instalación de Dependencias

Ejecuta en tu terminal:

```bash
npm install @supabase/supabase-js
```

## 3. Variables de Entorno

Crea o actualiza el archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_proyecto_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## 4. Cliente de Supabase

Se creará el archivo `src/lib/supabaseClient.ts` para interactuar con la base de datos.

## 5. Refactorización del Store (`useTaskStore.ts`)

Se modificará el store para:

- Cargar tareas desde Supabase al iniciar.
- Sincronizar cambios (add, update, delete) con la base de datos.
- Mantener una copia local en el estado de Zustand para rendimiento instantáneo (Optimistic Updates).

## 6. Script de Migración

Se implementará una lógica en el store que detecte tareas en `localStorage` y las suba a Supabase una sola vez.
