# Conectar Nutiva Manager a Supabase

1. Creen un proyecto en Supabase y abran **SQL Editor**.
2. Peguen y ejecuten por completo el contenido de `supabase-schema.sql`.
3. En **Authentication > Providers > Email**, dejen habilitado Email. Creen una cuenta para cada integrante desde la pantalla de Nutiva Manager; si está activa la confirmación por email, cada uno debe confirmar su correo antes de ingresar.
4. En **Project Settings > API**, copien la **Project URL** y la **publishable key** (o anon key).
5. Abran `supabase-config.js` y reemplacen los dos textos de ejemplo con esos valores. No usen ni compartan una clave `service_role`.
6. Publiquen la carpeta en un hosting estático con HTTPS (por ejemplo Netlify o GitHub Pages). Ambos abren la misma URL e ingresan con sus propias cuentas.

La política incluida permite leer y editar el único espacio de trabajo a cualquier usuario autenticado de este proyecto Supabase. Para mantenerlo limitado a ustedes dos, no compartan el enlace de registro o deshabiliten nuevos registros después de crear ambas cuentas.
