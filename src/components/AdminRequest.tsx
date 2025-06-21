import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import api from '../config/api';

interface AdminRequestProps {
  open: boolean;
  onClose: () => void;
}

const AdminRequest = ({ open, onClose }: AdminRequestProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      await api.post('/user/request-admin', { reason });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        Solicitar Rol de Administrador
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Solicitud enviada exitosamente
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Razón de la solicitud"
          fullWidth
          multiline
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2196f3',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
            color: 'white',
          }}
        >
          Enviar Solicitud
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminRequest; 