# Configuración del Sistema de Gestión de Guardias

## Requisitos Previos

- Cuenta de Supabase (https://supabase.com)
- Node.js 18+ instalado
- Git instalado

## Pasos de Configuración

### 1. Configurar Supabase

1. Crea un nuevo proyecto en Supabase
2. Ve a la sección SQL Editor
3. Ejecuta el script `scripts/01-create-tables.sql` para crear las tablas y políticas RLS
4. Opcionalmente, ejecuta `scripts/02-seed-sample-data.sql` para datos de prueba

### 2. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Redirect URL para desarrollo
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard

# Site URL para producción
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
\`\`\`

### 3. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 4. Ejecutar en Desarrollo

\`\`\`bash
npm run dev
\`\`\`

### 5. Crear Usuario Administrador

1. Regístrate en `/signup` con el rol "Administrador"
2. Ve a Supabase Dashboard → Authentication → Users
3. Confirma el email del usuario manualmente si es necesario

## Estructura de Roles

- **Internación**: Médicos que cubren guardias de internación
- **Consultorio**: Médicos que cubren guardias de consultorio
- **Completo**: Médicos que pueden cubrir cualquier tipo de guardia
- **Administrador**: Acceso completo para gestionar guardias y médicos

## Tipos de Guardias

El sistema incluye 14 tipos de guardias predefinidos:
- Consultorio A (8-14, 14-20)
- Consultorio C 10 (8-14, 14-20)
- Refuerzo (8-20, 14-20)
- Internación clínica 5000 (8-14, 14-20)
- Internación clínica PB (8-14, 14-20)
- Noche consultorio A
- Noche Internación (2 turnos)
- Reemplazo Socios

## Flujo de Trabajo

1. **Admin crea guardia**: Asigna a médico específico o deja libre para pool
2. **Médico recibe notificación**: Ve la guardia en su dashboard
3. **Médico acepta/rechaza**: Actualiza el estado de la guardia
4. **Sistema notifica**: Admin recibe notificación del cambio
5. **Escalación automática**: Si una guardia libre no se acepta en 12 horas, pasa a estado "free_pending"

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los médicos solo ven sus propias guardias y guardias libres de su pool
- Los administradores tienen acceso completo
- Autenticación mediante Supabase Auth

## Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
