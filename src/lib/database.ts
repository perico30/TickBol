// Database Configuration - Switch between in-memory and Supabase
// =============================================================

// Para usar Supabase (PRODUCCIÓN)
export { db } from './database-supabase';

// Para usar in-memory (DESARROLLO/TESTING)
// export { db } from './database-inmemory';

// NOTA: Para cambiar entre bases de datos, simplemente cambia el comentario
// en las líneas de arriba. La API es compatible entre ambas implementaciones.
