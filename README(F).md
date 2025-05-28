# Frontend RENDER-TGM

Documentación técnica del cliente frontend de RENDER-TGM.

## 📁 Estructura de Directorios

```
frontend/
├── src/
│   ├── assets/
│   │   ├── images/         # Imágenes estáticas
│   │   └── styles/         # Estilos globales
│   │
│   ├── components/
│   │   ├── common/         # Componentes reutilizables
│   │   ├── layout/         # Componentes de estructura
│   │   └── forms/          # Componentes de formularios
│   │
│   ├── config/
│   │   ├── api.ts          # Configuración de axios
│   │   ├── theme.ts        # Tema de Material-UI
│   │   └── routes.ts       # Configuración de rutas
│   │
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Componentes de página
│   ├── services/           # Servicios de API
│   ├── store/              # Estado global
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   │
│   ├── App.tsx            # Componente principal
│   └── main.tsx           # Punto de entrada
│
├── public/                # Archivos estáticos
├── index.html            # HTML principal
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Diseño y Estilos

### Tema Principal

```typescript
// src/config/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
      light: '#21CBF3',
    },
    background: {
      default: '#0a1929',
      paper: '#132f4c',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});
```

### Estilos Globales

```typescript
// src/assets/styles/globals.css
:root {
  --primary: #2196f3;
  --primary-light: #21CBF3;
  --background: #0a1929;
  --paper: #132f4c;
}

body {
  margin: 0;
  background: linear-gradient(to bottom right, var(--background), var(--paper));
  min-height: 100vh;
}

.glassmorphism {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

## 🔧 Componentes Principales

### BackgroundShapes

```typescript
// src/components/common/BackgroundShapes.tsx
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export const BackgroundShapes = () => (
  <>
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #2196f3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
      }}
    />
    {/* ... más formas ... */}
  </>
);
```

### Carruseles

```typescript
// src/components/common/Carousel.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselProps {
  images: string[];
  interval?: number;
  fullscreen?: boolean;
}

export const Carousel = ({ images, interval = 5000, fullscreen = false }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          height: fullscreen ? '100vh' : '400px',
          position: 'relative',
        }}
      >
        {/* ... contenido del carrusel ... */}
      </motion.div>
    </AnimatePresence>
  );
};
```

## 📱 Páginas

### Home

La página de inicio presenta dos carruseles distintos:

1. **Hero Carousel**: Pantalla completa con transiciones suaves
2. **Work Samples Carousel**: Carrusel horizontal con gestos

```typescript
// src/pages/Home.tsx
export const Home = () => {
  return (
    <Box>
      <HeroCarousel />
      <FeaturesSection />
      <WorkSamplesCarousel />
      <ContactSection />
    </Box>
  );
};
```

### Login/Register

Formularios con validación y feedback visual:

```typescript
// src/pages/Login.tsx
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Email inválido')
    .required('Email requerido'),
  password: yup
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .required('Contraseña requerida'),
});

export const Login = () => {
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: (values) => {
      // Lógica de login
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      {/* ... campos del formulario ... */}
    </form>
  );
};
```

## 🔄 Estado Global

### Configuración de API

```typescript
// src/config/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Autenticación

```typescript
// src/store/auth.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    set({ user: response.data.user, token: response.data.token });
    localStorage.setItem('token', response.data.token);
  },
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },
}));
```

## 🎭 Animaciones

### Framer Motion

```typescript
// src/components/common/AnimatedCard.tsx
import { motion } from 'framer-motion';

export const AnimatedCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

## 📱 Responsive Design

### Breakpoints

```typescript
// src/hooks/useResponsive.ts
import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
  };
};
```

## 🔒 Seguridad

### Protección de Rutas

```typescript
// src/components/common/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Modo watch
npm run test:watch

# Cobertura
npm run test:coverage
```

### Ejemplo de Test

```typescript
// src/components/common/Button.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## 📦 Build y Despliegue

### Producción

```bash
# Construir para producción
npm run build

# Preview de producción
npm run preview
```

### Configuración de Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material'],
        },
      },
    },
  },
});
```

## 🔍 SEO

### Meta Tags

```typescript
// src/components/common/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
}

export const SEO = ({ title, description, image }: SEOProps) => (
  <Helmet>
    <title>{title} | RENDER-TGM</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {image && <meta property="og:image" content={image} />}
  </Helmet>
);
```

## 📱 PWA

### Configuración

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'RENDER-TGM',
        short_name: 'RENDER-TGM',
        theme_color: '#2196f3',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Build
      run: npm run build
``` 