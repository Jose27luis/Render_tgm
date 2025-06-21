import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../config/api";

interface Friend {
  id_usuario: number;
  nombre: string;
  correo: string;
  foto_perfil?: string;
}

interface FriendRequest {
  id_solicitud: number;
  id_usuario: number;
  nombre: string;
  correo: string;
  foto_perfil?: string;
}

const FriendSystem = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchFriends(), fetchRequests()]);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    loadData();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get("/friends");
      console.log("Respuesta de amigos:", response.data);
      setFriends(response.data);
    } catch (err: any) {
      console.error("Error al obtener amigos:", err.response?.data || err);
      setError(
        err.response?.data?.message || "Error al obtener la lista de amigos"
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get("/friends/requests");
      console.log("Respuesta de solicitudes:", response.data);
      setRequests(response.data);
      console.log("Solicitudes desde backend:", response.data);
    } catch (err: any) {
      console.error("Error al obtener solicitudes:", err.response?.data || err);
      setError(
        err.response?.data?.message ||
          "Error al obtener las solicitudes de amistad"
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleAddFriend = async () => {
    if (!email.trim()) {
      setError("Por favor ingresa un correo electrónico");
      return;
    }

    try {
      const response = await api.post("/friends/request", { nombre: email });
      console.log("Respuesta de enviar solicitud:", response.data);
      setSuccess("Solicitud de amistad enviada");
      setEmail("");
      setAddFriendOpen(false);
      setTimeout(() => setSuccess(""), 5000);
      await fetchRequests();
    } catch (err: any) {
      console.error("Error al enviar solicitud:", err.response?.data || err);
      setError(err.response?.data?.message || "Error al enviar solicitud");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await api.post(`/friends/accept/${requestId}`);
      console.log("Respuesta de aceptar solicitud:", response.data);
      setSuccess("Solicitud de amistad aceptada");
      await Promise.all([fetchFriends(), fetchRequests()]);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error al aceptar solicitud:", err.response?.data || err);
      setError(err.response?.data?.message || "Error al aceptar la solicitud");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await api.post(`/friends/reject/${requestId}`);
      console.log("Respuesta de rechazar solicitud:", response.data);
      setSuccess("Solicitud de amistad rechazada");
      await fetchRequests();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error al rechazar solicitud:", err.response?.data || err);
      setError(err.response?.data?.message || "Error al rechazar la solicitud");
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ color: "white" }}>
          Sistema de Amigos
        </Typography>
        <Button
          startIcon={<PersonAddIcon />}
          onClick={() => setAddFriendOpen(true)}
          sx={{
            background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
            color: "white",
          }}
        >
          Agregar Amigo
        </Button>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{
          "& .MuiTab-root": {
            color: "rgba(255, 255, 255, 0.7)",
            "&.Mui-selected": {
              color: "#2196f3",
            },
          },
        }}
      >
        <Tab label="Mis Amigos" />
        <Tab
          label="Solicitudes"
          icon={
            requests.length > 0 ? (
              <Badge badgeContent={requests.length} color="primary" />
            ) : null
          }
          iconPosition="end"
        />
      </Tabs>

      {tabValue === 0 && (
        <List>
          {friends.map((friend, index) => (
            <ListItem
              key={friend.id_usuario ?? `friend-${index}`}
              sx={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "#2196f3" }}>
                  {friend.nombre?.charAt(0).toUpperCase() || "?"}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={friend.nombre}
                secondary={friend.correo}
                sx={{
                  "& .MuiListItemText-primary": { color: "white" },
                  "& .MuiListItemText-secondary": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      )}

      {tabValue === 1 && (
        <List>
          {requests.map((request, index) => (
            <ListItem
              key={request.id_solicitud ?? `request-${index}`}
              secondaryAction={
                <Box>
                  <IconButton
                    onClick={() => handleAcceptRequest(request.id_solicitud)}
                    sx={{ color: "#4caf50" }}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleRejectRequest(request.id_solicitud)}
                    sx={{ color: "#f44336" }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              }
              sx={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "#2196f3" }}>
                  {request.nombre?.charAt(0).toUpperCase() || "?"}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={request.nombre}
                secondary={request.correo}
                sx={{
                  "& .MuiListItemText-primary": { color: "white" },
                  "& .MuiListItemText-secondary": {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        PaperProps={{
          sx: {
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>Agregar Amigo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Correo Electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.23)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#2196f3",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-focused": {
                  color: "#2196f3",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddFriendOpen(false)}
            sx={{ color: "white" }}
          >
            Cancelar
          </Button>
          <Button onClick={handleAddFriend} sx={{ color: "#2196f3" }}>
            Enviar Solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FriendSystem;
