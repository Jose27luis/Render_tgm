# Backend RENDER-TGM

Documentación técnica del servidor backend de RENDER-TGM.

## 📁 Estructura de Directorios

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js     # Configuración de la base de datos
│   │   └── multer.js       # Configuración de multer para archivos
│   │
│   ├── controllers/
│   │   ├── authController.js    # Control de autenticación
│   │   ├── userController.js    # Control de usuarios
│   │   ├── fileController.js    # Control de archivos
│   │   └── processController.js # Control de procesamiento
│   │
│   ├── middleware/
│   │   ├── auth.js         # Middleware de autenticación
│   │   ├── validation.js   # Validación de datos
│   │   └── upload.js       # Manejo de subida de archivos
│   │
│   ├── models/
│   │   ├── User.js         # Modelo de usuario
│   │   ├── File.js         # Modelo de archivo
│   │   └── Process.js      # Modelo de proceso
│   │
│   ├── routes/
│   │   ├── authRoutes.js   # Rutas de autenticación
│   │   ├── userRoutes.js   # Rutas de usuario
│   │   ├── fileRoutes.js   # Rutas de archivos
│   │   └── processRoutes.js # Rutas de procesamiento
│   │
│   └── app.js              # Punto de entrada de la aplicación
│
├── uploads/                 # Directorio para archivos subidos
├── .env                    # Variables de entorno
├── package.json
└── README.md
```

## 🔧 Configuración

### Variables de Entorno

```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=render_tgm

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Multer
MAX_FILE_SIZE=10485760 # 10MB
```

### Base de Datos

Estructura de las tablas principales:

```sql
-- Usuarios
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) UNIQUE NOT NULL,
  contraseña VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Archivos
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  path VARCHAR(255) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Procesos
CREATE TABLE processes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_id INT NOT NULL,
  type ENUM('image', 'video') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  result_path VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id)
);
```

## 🔗 API Endpoints

### Autenticación

#### POST /api/auth/register
Registra un nuevo usuario.

**Request Body:**
```json
{
  "nombre": "string",
  "correo": "string",
  "contraseña": "string"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "nombre": "string",
    "correo": "string"
  }
}
```

#### POST /api/auth/login
Inicia sesión de usuario.

**Request Body:**
```json
{
  "correo": "string",
  "contraseña": "string"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "nombre": "string",
    "correo": "string"
  }
}
```

### Usuarios

#### GET /api/users/profile
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "number",
  "nombre": "string",
  "correo": "string",
  "created_at": "string"
}
```

### Archivos

#### POST /api/files/upload
Sube un archivo para procesamiento.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: File
type: "image" | "video"
```

**Response (200):**
```json
{
  "id": "number",
  "filename": "string",
  "status": "pending",
  "created_at": "string"
}
```

## 🔒 Middleware

### auth.js
Middleware de autenticación que verifica el token JWT.

```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
```

### validation.js
Middleware de validación de datos usando Joi.

```javascript
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    nombre: Joi.string().min(3).required(),
    correo: Joi.string().email().required(),
    contraseña: Joi.string().min(6).required()
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
```

## 📦 Modelos

### User.js
Modelo para la gestión de usuarios.

```javascript
class User {
  static async create({ nombre, correo, contraseña }) {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const [result] = await db.execute(
      'INSERT INTO users (nombre, correo, contraseña) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword]
    );
    return result.insertId;
  }

  static async findByEmail(correo) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE correo = ?',
      [correo]
    );
    return rows[0];
  }
}
```

## 🔄 Controladores

### processController.js
Controlador para el procesamiento de archivos.

```javascript
const processImage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    
    // Iniciar procesamiento
    const process = await Process.create({
      file_id: fileId,
      type: 'image'
    });
    
    // Procesar imagen en segundo plano
    processImageQueue.add({ processId: process.id });
    
    return res.json({ 
      message: 'Procesamiento iniciado',
      processId: process.id 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Error al procesar la imagen' 
    });
  }
};
```

## 🚀 Despliegue

### Producción
1. Construir la aplicación:
```bash
npm run build
```

2. Iniciar en producción:
```bash
npm start
```

### PM2
Configuración para PM2:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'render-tgm-backend',
    script: 'dist/app.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

## 📊 Monitoreo

### Logs
Los logs se almacenan en:
- Desarrollo: `console.log`
- Producción: `/var/log/render-tgm/`

### Métricas
Endpoints de monitoreo:
- `/health`: Estado del servidor
- `/metrics`: Métricas de rendimiento

## 🔍 Testing

```bash
# Ejecutar tests
npm test

# Cobertura de código
npm run test:coverage
```

## 🛠️ Mantenimiento

### Backups
Los backups de la base de datos se realizan diariamente:
```bash
# Script de backup
./scripts/backup.sh
```

### Actualizaciones
1. Detener el servidor
2. Hacer backup de la base de datos
3. Actualizar dependencias: `npm update`
4. Ejecutar migraciones: `npm run migrate`
5. Reiniciar el servidor

## 📝 Logs y Errores

### Estructura de Logs
```javascript
{
  timestamp: '2024-03-14T12:00:00Z',
  level: 'error',
  message: 'Error description',
  stack: 'Error stack trace',
  metadata: {
    userId: 'string',
    route: 'string',
    method: 'string'
  }
}
```

### Manejo de Errores
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
``` 