import {
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import api from "../config/api";

interface Friend {
  id_usuario: number;
  nombre: string;
  foto_perfil?: string;
  estado?: "pendiente" | "aceptado" | "rechazado";
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FriendsManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openSearch, setOpenSearch] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get("/friends");
      setFriends(response.data);
    } catch (error) {
      console.error("Error al obtener amigos:", error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get("/friends/requests");
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Error al obtener solicitudes pendientes:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/friends/search?query=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await api.post(`/friends/request`, { id_usuario: userId });
      setSearchResults(
        searchResults.map((user) =>
          user.id_usuario === userId ? { ...user, estado: "pendiente" } : user
        )
      );
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
    }
  };

  const handleAcceptRequest = async (userId: number) => {
    try {
      await api.post(`/friends/accept/${userId}`);
      await fetchFriends();
      await fetchPendingRequests();
    } catch (error) {
      console.error("Error al aceptar solicitud:", error);
    }
  };

  const handleRejectRequest = async (userId: number) => {
    try {
      await api.post(`/friends/reject/${userId}`);
      setPendingRequests(
        pendingRequests.filter((req) => req.id_usuario !== userId)
      );
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={3}
        sx={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            textColor="inherit"
            sx={{
              "& .MuiTab-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-selected": {
                  color: "white",
                },
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon />
                  <span>Mis Amigos</span>
                  {friends.length > 0 && (
                    <Badge badgeContent={friends.length} color="primary" />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonAddIcon />
                  <span>Solicitudes</span>
                  {pendingRequests.length > 0 && (
                    <Badge
                      badgeContent={pendingRequests.length}
                      color="error"
                    />
                  )}
                </Box>
              }
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setOpenSearch(true)}
              sx={{
                background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                color: "white",
              }}
            >
              Buscar Amigos
            </Button>
          </Box>

          <List>
            <AnimatePresence>
              {friends.map((friend) => (
                <motion.div
                  key={friend.id_usuario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ListItem
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={friend.foto_perfil}>
                        {friend.nombre[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography color="white">{friend.nombre}</Typography>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List>
            <AnimatePresence>
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.id_usuario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ListItem
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 1,
                      mb: 1,
                    }}
                    secondaryAction={
                      <Box>
                        <Tooltip title="Aceptar">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleAcceptRequest(request.id_usuario)
                            }
                            sx={{ color: "#4caf50", mr: 1 }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rechazar">
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleRejectRequest(request.id_usuario)
                            }
                            sx={{ color: "#f44336" }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={request.foto_perfil}>
                        {request.nombre[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography color="white">{request.nombre}</Typography>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </TabPanel>
      </Paper>

      {/* Diálogo de búsqueda */}
      <Dialog
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>Buscar Usuarios</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading}
              sx={{
                background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : <SearchIcon />}
            </Button>
          </Box>

          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id_usuario}
                secondaryAction={
                  user.estado !== "aceptado" && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleSendRequest(user.id_usuario)}
                      disabled={user.estado === "pendiente"}
                      sx={{
                        borderColor:
                          user.estado === "pendiente" ? "grey.500" : "#2196f3",
                        color:
                          user.estado === "pendiente" ? "grey.500" : "#2196f3",
                      }}
                    >
                      {user.estado === "pendiente" ? "Pendiente" : "Agregar"}
                    </Button>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.foto_perfil}>{user.nombre[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.nombre} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSearch(false)} color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FriendsManager;
