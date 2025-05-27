# RENDER-TGM

Aplicación web para el procesamiento y mejora de imágenes y videos utilizando inteligencia artificial.

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

- Autenticación de usuarios
- Procesamiento de imágenes y videos
- Interfaz moderna con diseño glassmórfico
- Animaciones fluidas
- Diseño responsivo
- Carruseles interactivos
- Carga y procesamiento de archivos
- Panel de control personalizado

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Framer Motion
- Formik & Yup
- Axios
- Vite

### Backend
- Node.js
- Express
- MySQL
- JWT
- Bcrypt
- CORS
- Multer

## 📁 Estructura del Proyecto

```
proyecto-web/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
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
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
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

2. Ejecutar las migraciones:
```bash
cd backend
npm run migrate
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
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

### Usuarios

```
GET /api/users/profile
PUT /api/users/profile
```

### Archivos

```
POST /api/files/upload
GET /api/files/list
DELETE /api/files/:id
```

### Procesamiento

```
POST /api/process/image
POST /api/process/video
GET /api/process/status/:id
```

## 🎨 Componentes Frontend

### Páginas Principales

1. **Home (`/src/pages/Home.tsx`)**
   - Página de inicio con carruseles interactivos
   - Sección de características
   - Información de contacto

2. **Login (`/src/pages/Login.tsx`)**
   - Formulario de inicio de sesión
   - Validación de campos
   - Manejo de errores

3. **Register (`/src/pages/Register.tsx`)**
   - Formulario de registro
   - Validación de datos
   - Feedback visual

4. **Dashboard (`/src/pages/Dashboard.tsx`)**
   - Panel de control del usuario
   - Estadísticas
   - Carga de archivos

### Componentes Reutilizables

1. **BackgroundShapes**
   - Formas animadas de fondo
   - Efectos de gradiente
   - Animaciones con Framer Motion

2. **Carruseles**
   - Primer carrusel: Pantalla completa con fade
   - Segundo carrusel: Estilo moderno con deslizamiento

3. **Formularios**
   - Campos con validación
   - Feedback visual
   - Integración con Formik

## 🔒 Seguridad

- Autenticación mediante JWT
- Contraseñas hasheadas con bcrypt
- Validación de datos en frontend y backend
- Protección contra CSRF
- Manejo seguro de archivos

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Trabajo Inicial* - [TuUsuario](https://github.com/tuusuario)

## 🙏 Agradecimientos

- Material-UI por el sistema de componentes
- Framer Motion por las animaciones
- La comunidad de React por su apoyo
