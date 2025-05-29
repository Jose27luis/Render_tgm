# RENDER-TGM

Aplicación web para el procesamiento y mejora de imágenes y videos utilizando inteligencia artificial.

## 👥 Autores

- Daniel Montufar
- Jose Teco
- Carlos Garcia

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Contribución](#contribución)
- [Licencia](#licencia)

## ✨ Características

- Sistema de autenticación robusto
- Gestión de roles (usuario, admin, superadmin)
- Sistema de amigos y gestión de conexiones sociales
- Procesamiento de imágenes y videos
- Interfaz moderna con diseño glassmórfico
- Animaciones fluidas con Framer Motion
- Diseño responsivo y adaptable
- Panel de administración avanzado
- Gestión de perfiles de usuario
- Sistema de solicitudes de rol admin
- Carga y gestión de imágenes de perfil
- Notificaciones en tiempo real

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 18
- TypeScript
- Material-UI (MUI) v5
- Framer Motion
- Formik & Yup
- Axios
- Vite

### Backend
- Node.js
- Express
- MySQL
- JWT para autenticación
- Bcrypt para encriptación
- CORS
- Multer para manejo de archivos

## 📁 Estructura del Proyecto

```
proyecto-web/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── FriendsManager/
│   │   │   ├── Navigation/
│   │   │   └── UI/
│   │   ├── config/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   ├── authController.js
│   │   │   └── friendController.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── app.js
│   ├── uploads/
│   │   └── profile/
│   ├── package.json
│   └── .env
│
└── README.md
```

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v8 o superior)
- npm o yarn

## 🚀 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/render-tgm.git
cd render-tgm
```

2. Instalar dependencias del frontend:
```bash
cd frontend
npm install
```

3. Instalar dependencias del backend:
```bash
cd ../backend
npm install
```

4. Configurar variables de entorno:
   - Crear archivo `.env` en la carpeta backend
   - Copiar el contenido de `.env.example` y configurar las variables

## ⚙️ Configuración

### Variables de Entorno (Backend)

```env
PORT=5000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=render_tgm
JWT_SECRET=tu_secreto_jwt
```

### Base de Datos

1. Crear la base de datos:
```sql
CREATE DATABASE render_tgm;
```

2. Ejecutar el script de base de datos:
```sql
source database.sql
```

## 💻 Uso

1. Iniciar el servidor backend:
```bash
cd backend
npm run dev
```

2. Iniciar el cliente frontend:
```bash
cd frontend
npm run dev
```

3. Acceder a la aplicación:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🔗 API Endpoints

### Autenticación

```
POST /api/auth/register - Registro de usuarios
POST /api/auth/login - Inicio de sesión
GET /api/auth/verify - Verificación de token
```

### Usuarios

```
GET /api/user/profile - Obtener perfil
PUT /api/user/profile - Actualizar perfil
POST /api/user/profile/photo - Actualizar foto de perfil
GET /api/user/list - Listar usuarios (admin)
```

### Amigos

```
GET /api/user/friends - Listar amigos
POST /api/user/friends/request/:friendId - Enviar solicitud
POST /api/user/friends/accept/:friendId - Aceptar solicitud
POST /api/user/friends/reject/:friendId - Rechazar solicitud
GET /api/user/friends/pending - Ver solicitudes pendientes
```

### Administración

```
POST /api/admin/request - Solicitar rol admin
GET /api/admin/pending - Ver solicitudes pendientes
PUT /api/admin/handle - Manejar solicitudes
GET /api/admin/list - Listar administradores
DELETE /api/admin/remove/:adminId - Remover admin
```

## 🔒 Roles y Permisos

El sistema implementa tres niveles de roles:

1. **Usuario**
   - Gestión de perfil básico
   - Sistema de amigos
   - Solicitud de rol admin

2. **Admin**
   - Todo lo anterior
   - Ver lista de usuarios
   - Gestionar solicitudes admin

3. **Superadmin**
   - Todo lo anterior
   - Gestión completa de administradores
   - Remover administradores

## 🎨 Características de la Interfaz

- Diseño glassmórfico moderno
- Temas oscuros con efectos de transparencia
- Animaciones suaves y responsivas
- Formularios validados
- Notificaciones toast
- Modales interactivos
- Navegación fluida
- Carga progresiva de contenido
- Gestión de estados loading
- Manejo de errores amigable

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- Dispositivos móviles
- Tablets
- Escritorio
- Pantallas grandes

## 🔄 Estado Actual

El proyecto se encuentra en desarrollo activo con las siguientes características implementadas:
- ✅ Sistema de autenticación completo
- ✅ Gestión de roles y permisos
- ✅ Sistema de amigos
- ✅ Gestión de perfiles
- ✅ Panel de administración
- ✅ Carga de imágenes
- ⏳ Procesamiento de imágenes (en desarrollo)
- ⏳ Chat en tiempo real (planificado)
- ⏳ Notificaciones push (planificado)

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 🙏 Agradecimientos

- Material-UI por el sistema de componentes
- Framer Motion por las animaciones
- La comunidad de React por su apoyo
