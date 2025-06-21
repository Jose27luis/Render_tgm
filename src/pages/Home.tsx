import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BrightnessMediumIcon from "@mui/icons-material/BrightnessMedium";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EmailIcon from "@mui/icons-material/Email";
import GrainIcon from "@mui/icons-material/Grain";
import HighQualityIcon from "@mui/icons-material/HighQuality";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import SpeedIcon from "@mui/icons-material/Speed";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography
} from "@mui/material";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Importa tus imágenes aquí
// Ejemplo: import imagen1 from '../assets/images/imagen1.jpg';

const images = [
  // Reemplaza estas URLs con las rutas de tus imágenes locales
  "/src/assets/images/imagen1.jpg",
  "/src/assets/images/imagen2.jpg",
  "/src/assets/images/imagen3.jpg",
];

const enhancementMethods = [
  {
    name: "MBLLEN",
    title: "Multi-Branch Low-Light Enhancement Network",
    description: "Mejora imágenes con poca iluminación mediante redes neuronales multi-rama, ideal para fotografías nocturnas y ambientes oscuros.",
    icon: <BrightnessMediumIcon sx={{ fontSize: 60, color: "#4FC3F7" }} />,
    features: ["Iluminación adaptativa", "Preservación de detalles", "Reducción de ruido"],
    color: "#4FC3F7",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    image: "/src/assets/images/showcase/mbllen_comparison.jpg",
    beforeImage: "/src/assets/images/showcase/mbllen_before.jpg",
    afterImage: "/src/assets/images/showcase/mbllen_after.jpg"
  },
  {
    name: "Real-ESRGAN",
    title: "Enhanced Super-Resolution GAN",
    description: "Tecnología de super-resolución que aumenta la calidad y resolución de imágenes, perfecto para restaurar fotos antiguas o de baja calidad.",
    icon: <GrainIcon sx={{ fontSize: 60, color: "#66BB6A" }} />,
    features: ["Super-resolución 4x", "Restauración de texturas", "Eliminación de artefactos"],
    color: "#66BB6A",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    image: "/src/assets/images/showcase/realesrgan_comparison.jpg",
    beforeImage: "/src/assets/images/showcase/realesrgan_before.jpg",
    afterImage: "/src/assets/images/showcase/realesrgan_after.jpg"
  },
  {
    name: "SUPIR",
    title: "CVPR 2024 - State-of-the-Art",
    description: "Método de vanguardia presentado en CVPR 2024, combina múltiples técnicas de IA para resultados excepcionales en mejora de imágenes.",
    icon: <AutoFixHighIcon sx={{ fontSize: 60, color: "#FF7043" }} />,
    features: ["IA de última generación", "Procesamiento inteligente", "Resultados profesionales"],
    color: "#FF7043",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    image: "/src/assets/images/showcase/supir_comparison.jpg",
    beforeImage: "/src/assets/images/showcase/supir_before.jpg",
    afterImage: "/src/assets/images/showcase/supir_after.jpg"
  }
];

// Componente para las figuras de fondo
const BackgroundShapes = () => (
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
        ease: "linear",
      }}
      sx={{
        position: "absolute",
        top: "10%",
        left: "10%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "linear-gradient(45deg, #2196f3 30%, transparent 90%)",
        opacity: 0.1,
        filter: "blur(40px)",
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.3, 1],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
      sx={{
        position: "absolute",
        bottom: "10%",
        right: "10%",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "linear-gradient(45deg, #21CBF3 30%, transparent 90%)",
        opacity: 0.1,
        filter: "blur(40px)",
      }}
    />
  </>
);

// Componente para el segundo carrusel
const SecondCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setActiveIndex(
      (prevIndex) =>
        (prevIndex + newDirection + enhancementMethods.length) %
        enhancementMethods.length
    );
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: "80vh", md: "70vh" },
        width: "100%",
        overflow: "hidden",
        bgcolor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        py: 4,
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: "90%",
              maxWidth: "1200px",
              minHeight: "500px",
              position: "relative",
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              background: enhancementMethods[activeIndex].gradient,
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                position: "relative",
                p: { xs: 2, sm: 3, md: 4 },
                gap: 4,
              }}
            >
              {/* Left side - Method Info */}
            <Box
              sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minWidth: { md: "40%" },
                }}
              >
                {/* Icon Container */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
            <Box
              sx={{
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "50%",
                      p: 3,
                      mb: 3,
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {enhancementMethods[activeIndex].icon}
                  </Box>
                </motion.div>

                {/* Title */}
                <Typography
                  variant="h4"
                  sx={{
                    mb: 1,
                color: "white",
                    fontWeight: "bold",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
              }}
            >
                  {enhancementMethods[activeIndex].name}
                </Typography>

                {/* Subtitle */}
              <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "rgba(255, 255, 255, 0.9)",
                    fontWeight: 300,
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                    maxWidth: "90%",
                  }}
              >
                  {enhancementMethods[activeIndex].title}
              </Typography>

                {/* Description */}
              <Typography
                variant="body1"
                  sx={{
                    mb: 3,
                    color: "rgba(255, 255, 255, 0.95)",
                    maxWidth: "90%",
                    lineHeight: 1.8,
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  {enhancementMethods[activeIndex].description}
                </Typography>

                {/* Features */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {enhancementMethods[activeIndex].features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
              >
                      <Box
                        sx={{
                          background: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          borderRadius: 20,
                          px: 2,
                          py: 0.5,
                          border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <Typography
                          variant="body2"
                          sx={{ 
                            color: "white", 
                            fontWeight: 500,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {feature}
              </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Box>

              {/* Right side - Before/After Images */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  minWidth: { md: "50%" },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    textAlign: "center",
                    mb: 1,
                    fontWeight: 500,
                    textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  Ejemplo de Mejora
                </Typography>
                
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  {/* Before Image */}
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        mb: 1,
                        fontWeight: 500,
                      }}
                    >
                      Antes
              </Typography>
                    <Box
                      component="img"
                      src={enhancementMethods[activeIndex].beforeImage}
                      alt="Antes"
                      sx={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        maxHeight: "250px",
                        objectFit: "cover",
                      }}
                    />
                  </Box>

                  {/* Arrow */}
                  <Box
                    sx={{
                      color: "white",
                      fontSize: "2rem",
                      mx: 1,
                      transform: { xs: "rotate(90deg)", sm: "rotate(0deg)" },
                    }}
                  >
                    →
                  </Box>

                  {/* After Image */}
                  <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        mb: 1,
                        fontWeight: 500,
                      }}
                    >
                      Después
              </Typography>
                    <Box
                      component="img"
                      src={enhancementMethods[activeIndex].afterImage}
                      alt="Después"
                      sx={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        maxHeight: "250px",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>

      <Box
        component={motion.div}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => paginate(-1)}
        sx={{
          position: "absolute",
          left: { xs: 10, sm: 20, md: 40 },
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
          cursor: "pointer",
          opacity: 0.8,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "50%",
          width: { xs: 40, sm: 50 },
          height: { xs: 40, sm: 50 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "rgba(255, 255, 255, 0.25)",
            transform: "translateY(-50%) scale(1.1)",
          },
        }}
      >
        <KeyboardArrowLeftIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: "white" }} />
      </Box>

      <Box
        component={motion.div}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => paginate(1)}
        sx={{
          position: "absolute",
          right: { xs: 10, sm: 20, md: 40 },
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
          cursor: "pointer",
          opacity: 0.8,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "50%",
          width: { xs: 40, sm: 50 },
          height: { xs: 40, sm: 50 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "rgba(255, 255, 255, 0.25)",
            transform: "translateY(-50%) scale(1.1)",
          },
        }}
      >
        <KeyboardArrowRightIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: "white" }} />
      </Box>

      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 2,
          zIndex: 2,
          alignItems: "center",
        }}
      >
        {enhancementMethods.map((method, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
            component={motion.div}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              setActiveIndex(index);
            }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor:
                  index === activeIndex ? method.color : "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: index === activeIndex ? `0 0 10px ${method.color}` : "none",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: index === activeIndex ? "white" : "rgba(255, 255, 255, 0.7)",
                fontSize: "0.7rem",
                fontWeight: index === activeIndex ? 600 : 400,
                transition: "all 0.3s ease",
            }}
            >
              {method.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)",
        margin: 0,
        padding: 0,
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <BackgroundShapes />

      {/* Hero Section con Carrusel */}
      <Box
        sx={{
          height: "98.5vh",
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Carrusel de Imágenes */}
        <motion.div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            y,
            opacity,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 1,
                  ease: "easeOut",
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: {
                  duration: 0.5,
                  ease: "easeIn",
                },
              }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundImage: `url(${images[currentImageIndex]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.4)",
              }}
            />
          </AnimatePresence>
        </motion.div>

        {/* Contenido sobre el carrusel */}
        <Container
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#fff",
                textAlign: "center",
                mb: 4,
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                fontSize: { xs: "3rem", sm: "4rem", md: "5rem" },
              }}
            >
              RENDER-TGM
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                color: "#fff",
                textAlign: "center",
                mb: 6,
                maxWidth: "800px",
                mx: "auto",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
              }}
            >
              Transformamos tus imágenes con inteligencia artificial
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                size="large"
                onClick={() => navigate("/register")}
                sx={{
                  background:
                    "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                  color: "white",
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1.1rem",
                  boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                }}
              >
                Comenzar Ahora
              </Button>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  color: "white",
                  borderColor: "white",
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1.1rem",
                  "&:hover": {
                    borderColor: "#21CBF3",
                    background: "rgba(33, 203, 243, 0.1)",
                  },
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>
          </motion.div>
        </Container>

        {/* Indicadores del carrusel */}
        <Box
          sx={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "1rem",
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              component={motion.div}
              animate={{
                scale: currentImageIndex === index ? 1.2 : 1,
                opacity: currentImageIndex === index ? 1 : 0.5,
              }}
              sx={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "white",
                cursor: "pointer",
              }}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </Box>
      </Box>

      {/* Segundo Carrusel */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{
              color: "white",
              mb: 6,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              fontWeight: 500,
            }}
          >
            Métodos de Mejora de Imagen
          </Typography>
          <SecondCarousel />
        </Container>
      </Box>

      {/* Sección de Características */}
      <Container sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <HighQualityIcon sx={{ fontSize: 40, color: "#2196f3" }} />,
              title: "Alta Calidad",
              description:
                "Resultados profesionales con la mejor calidad de imagen",
            },
            {
              icon: <SpeedIcon sx={{ fontSize: 40, color: "#2196f3" }} />,
              title: "Procesamiento Rápido",
              description: "Obtén tus resultados en cuestión de segundos",
            },
            {
              icon: <CloudUploadIcon sx={{ fontSize: 40, color: "#2196f3" }} />,
              title: "Fácil de Usar",
              description:
                "Interfaz intuitiva para subir y procesar tus imágenes",
            },
          ].map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {feature.icon}
                  <Typography
                    variant="h6"
                    sx={{ mt: 2, mb: 1, color: "white" }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Sección de Contacto */}
      <Box sx={{ py: 8, bgcolor: "rgba(0, 0, 0, 0.2)" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            sx={{
              textAlign: "center",
              mb: 6,
              color: "white",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Contáctanos
          </Typography>
          
          <Grid container spacing={4}>
            {/* Columna izquierda - Información de contacto */}
            <Grid item xs={12} md={5}>
              <Box sx={{ height: "100%" }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: "white",
                    mb: 3,
                    fontWeight: 500,
                  }}
                >
                  Estamos aquí para ayudarte
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[
              {
                icon: <EmailIcon sx={{ fontSize: 30, color: "#2196f3" }} />,
                title: "Email",
                content: "jtecoluisgarciajoae@gmail.com",
                      action: "mailto:jtecoluisgarciajoae@gmail.com"
              },
              {
                icon: <PhoneIcon sx={{ fontSize: 30, color: "#2196f3" }} />,
                title: "Celular",
                content: "+51 917140474",
                      action: "tel:+51917140474"
              },
              {
                      icon: <LocationOnIcon sx={{ fontSize: 30, color: "#2196f3" }} />,
                title: "Ubicación",
                      content: "Madre de Dios, Puerto Maldonado",
                      action: null
              },
            ].map((contact, index) => (
                <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                          p: 2,
                      display: "flex",
                      alignItems: "center",
                          gap: 2,
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 2,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                          transition: "all 0.3s ease",
                          cursor: contact.action ? "pointer" : "default",
                          "&:hover": contact.action ? {
                            background: "rgba(255, 255, 255, 0.1)",
                            transform: "translateX(5px)",
                          } : {},
                        }}
                        onClick={() => {
                          if (contact.action) {
                            window.location.href = contact.action;
                          }
                        }}
                      >
                        <Box
                          sx={{
                            background: "rgba(33, 150, 243, 0.1)",
                            borderRadius: "50%",
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                    }}
                  >
                    {contact.icon}
                        </Box>
                        <Box>
                    <Typography
                            variant="subtitle2"
                            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      {contact.title}
                    </Typography>
                    <Typography
                      variant="body1"
                            sx={{ color: "white", fontWeight: 500 }}
                    >
                      {contact.content}
                    </Typography>
                        </Box>
                  </Paper>
                </motion.div>
                  ))}
                </Box>

                {/* Horario de atención */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      mb: 2,
                      fontWeight: 500,
                    }}
                  >
                    Horario de Atención
                  </Typography>
                  <Box
                    sx={{
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 2,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.9)", mb: 1 }}
                    >
                      Lunes a Viernes: 9:00 AM - 6:00 PM
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.9)", mb: 1 }}
                    >
                      Sábados: 9:00 AM - 1:00 PM
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Domingos: Cerrado
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Columna derecha - Mapa */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                style={{ height: "100%", minHeight: "400px" }}
              >
                <Box
                  sx={{
                    height: "100%",
                    minHeight: { xs: "400px", md: "500px" },
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {/* Placeholder para el mapa - reemplazar con MapComponent cuando tengas la API key */}
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/src/assets/images/puerto_maldonado_bg_dark.jpg')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(30, 60, 114, 0.7) 0%, rgba(42, 82, 152, 0.7) 100%)",
                        zIndex: 1,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 4,
                        background: "rgba(0, 0, 0, 0.7)",
                        borderRadius: 3,
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        zIndex: 2,
                        position: "relative",
                        maxWidth: "400px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      <LocationOnIcon sx={{ fontSize: 60, color: "#2196f3", mb: 2 }} />
                      <Typography
                        variant="h5"
                        sx={{ color: "white", mb: 2, fontWeight: 600 }}
                      >
                        Puerto Maldonado
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "rgba(255, 255, 255, 0.9)", mb: 3 }}
                      >
                        Madre de Dios, Perú
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 3, fontStyle: "italic" }}
                      >
                        "La capital de la biodiversidad del Perú"
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<LocationOnIcon />}
                        href="https://www.google.com/maps/search/?api=1&query=Puerto+Maldonado+Madre+de+Dios+Peru"
                        target="_blank"
                        sx={{
                          background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                          color: "white",
                          px: 3,
                          py: 1.5,
                          fontSize: "1rem",
                          fontWeight: 500,
                          boxShadow: "0 4px 20px rgba(33, 150, 243, 0.4)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #1976d2 30%, #1e88e5 90%)",
                            boxShadow: "0 6px 25px rgba(33, 150, 243, 0.6)",
                          },
                        }}
                      >
                        Ver en Google Maps
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* Descomentar cuando tengas la API key de Google Maps */}
                  {/* <MapComponent apiKey="TU_API_KEY_AQUI" /> */}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
