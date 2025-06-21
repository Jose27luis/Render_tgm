import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HighQualityIcon from "@mui/icons-material/HighQuality";
import ImageIcon from "@mui/icons-material/Image";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminRequest from "../components/AdminRequest";
import ChatSystemSimple from "../components/ChatSystemSimple";
import FriendSystem from "../components/FriendSystem";
import ImageHistory from "../components/ImageHistory";
import api from "../config/api";

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
        position: "fixed",
        top: "10%",
        left: "10%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "linear-gradient(45deg, #2196f3 30%, transparent 90%)",
        opacity: 0.1,
        filter: "blur(40px)",
        zIndex: 0,
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
        position: "fixed",
        bottom: "10%",
        right: "10%",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "linear-gradient(45deg, #21CBF3 30%, transparent 90%)",
        opacity: 0.1,
        filter: "blur(40px)",
        zIndex: 0,
      }}
    />
  </>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState("Usuario");
  const [userRole, setUserRole] = useState("user");
  const [adminRequestOpen, setAdminRequestOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [improvedImageUrl, setImprovedImageUrl] = useState<string | null>(null);
  const imageHistoryRef = useRef<{ refetch: () => void }>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && userData.nombre) {
          setUserName(userData.nombre);
          setUserRole(userData.rol || "user");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get("/user/profile");
        if (response.data) {
          setUserName(response.data.nombre);
          setUserRole(response.data.rol || "user");
          localStorage.setItem("user", JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        if (!user) {
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImprovedImageUrl(null);
    setUploadMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGuardar = async () => {
    if (!selectedFile) {
      setUploadMessage("Por favor, selecciona un archivo primero.");
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setUploadMessage(
        "El archivo es demasiado grande. El tamaño máximo permitido es 50MB."
      );
      return;
    }

    setUploading(true);
    setUploadMessage("Guardando imagen original...");
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadMessage("¡Imagen guardada en originales!");

      setSelectedFile(null);
      setPreviewUrl(null);
      setImprovedImageUrl(null);

      if (imageHistoryRef.current) {
        imageHistoryRef.current.refetch();
      }

      setTimeout(() => setUploadMessage(""), 2000);
    } catch (error: any) {
      console.error("Error al guardar la imagen:", error);
      const errorMessage =
        error?.response?.data?.message || "Error al guardar la imagen";
      setUploadMessage(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelar = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImprovedImageUrl(null);
    setUploadMessage("");
  };

  const handleMejorar = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setUploadMessage("Procesando imagen con IA...");
    setTimeout(() => {
      setImprovedImageUrl(previewUrl);
      setProcessing(false);
      setUploadMessage("Vista previa de mejora generada.");
    }, 2000);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundShapes />

      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Toolbar>
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              background: "linear-gradient(45deg, #2196f3, #21CBF3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RENDER-TGM
          </Typography>
          <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              sx: {
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                color: "white",
                "& .MuiMenuItem-root": {
                  color: "white",
                },
              },
            }}
          >
            <MenuItem onClick={() => navigate("/profile")}>
              <ListItemIcon>
                <PersonIcon sx={{ color: "white" }} />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={() => navigate("/my-images")}>
              <ListItemIcon>
                <ImageIcon sx={{ color: "white" }} />
              </ListItemIcon>
              Mis Imágenes
            </MenuItem>
            <MenuItem onClick={() => navigate("/real-esrgan")}>
              <ListItemIcon>
                <HighQualityIcon sx={{ color: "white" }} />
              </ListItemIcon>
              Real-ESRGAN
            </MenuItem>
            {userRole === "user" && (
              <MenuItem onClick={() => setAdminRequestOpen(true)}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon sx={{ color: "white" }} />
                </ListItemIcon>
                Solicitar Admin
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: "white" }} />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 4, position: "relative", zIndex: 1 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: "white",
                  textAlign: "center",
                  mb: 4,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  fontWeight: 500,
                }}
              >
                Bienvenido, {userName}
              </Typography>

              <Paper
                sx={{
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                {!selectedFile ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Box
                      sx={{
                        mt: 2,
                        p: 4,
                        border: "2px dashed rgba(255, 255, 255, 0.2)",
                        borderRadius: 2,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "#2196f3",
                          background: "rgba(33, 150, 243, 0.1)",
                        },
                      }}
                    >
                      <CloudUploadIcon
                        sx={{
                          fontSize: 64,
                          color: "#2196f3",
                          mb: 2,
                        }}
                      />
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ color: "white" }}
                      >
                        Arrastra y suelta archivos aquí
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "rgba(255, 255, 255, 0.7)",
                          mb: 2,
                        }}
                      >
                        o
                      </Typography>
                      <Button
                        component={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        sx={{
                          background:
                            "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                          color: "white",
                          textTransform: "none",
                          fontSize: "1.1rem",
                          py: 1.5,
                          px: 4,
                          boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                        }}
                        onClick={handleFileInputClick}
                        disabled={uploading}
                      >
                        {uploading ? "Subiendo..." : "Seleccionar Archivos"}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </Button>
                    </Box>
                  </motion.div>
                ) : (
                  <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
                      Vista previa de la imagen
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          selectedFile && selectedFile.size > 50 * 1024 * 1024
                            ? "#f44336"
                            : "rgba(255, 255, 255, 0.7)",
                        mb: 2,
                      }}
                    >
                      {selectedFile?.name} -{" "}
                      {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                      {selectedFile &&
                        selectedFile.size > 50 * 1024 * 1024 &&
                        " (Demasiado grande)"}
                    </Typography>
                    <img
                      src={improvedImageUrl || previewUrl || ""}
                      alt="Vista previa"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 320,
                        borderRadius: 8,
                        marginBottom: 16,
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 2,
                        mt: 2,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handleMejorar}
                        disabled={processing}
                      >
                        Mejorar Imagen
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleGuardar}
                        disabled={uploading}
                      >
                        {uploading ? "Guardando..." : "Guardar Imagen"}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleCancelar}
                      >
                        Cancelar
                      </Button>
                    </Box>
                    {uploadMessage && (
                      <Typography
                        sx={{
                          color: uploadMessage.includes("Error")
                            ? "red"
                            : "green",
                          mt: 2,
                        }}
                      >
                        {uploadMessage}
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>

              <ImageHistory ref={imageHistoryRef} />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <FriendSystem />
          </Grid>
        </Grid>
      </Container>

      <AdminRequest
        open={adminRequestOpen}
        onClose={() => setAdminRequestOpen(false)}
      />

      {/* Sistema de Chat */}
      <ChatSystemSimple />
    </Box>
  );
};

export default Dashboard;
