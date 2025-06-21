// ... existing code ...
  const fetchFriends = async () => {
    try {
      const response = await api.get('/api/friends');
      console.log('Respuesta de amigos:', response.data);
      setFriends(response.data);
    } catch (err: any) {
      console.error('Error al obtener amigos:', err.response?.data || err);
      setError(err.response?.data?.message || 'Error al obtener la lista de amigos');
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/friends/requests');
      console.log('Respuesta de solicitudes:', response.data);
      setRequests(response.data);
    } catch (err: any) {
      console.error('Error al obtener solicitudes:', err.response?.data || err);
      setError(err.response?.data?.message || 'Error al obtener las solicitudes de amistad');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAddFriend = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa un correo electrónico');
      return;
    }

    try {
      const response = await api.post('/api/friends/request', { correo: email });
      console.log('Respuesta de enviar solicitud:', response.data);
      setSuccess('Solicitud de amistad enviada');
      setEmail('');
      setAddFriendOpen(false);
      setTimeout(() => setSuccess(''), 5000);
      await fetchRequests();
    } catch (err: any) {
      console.error('Error al enviar solicitud:', err.response?.data || err);
      setError(err.response?.data?.message || 'Error al enviar solicitud');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await api.post(`/api/friends/accept/${requestId}`);
      console.log('Respuesta de aceptar solicitud:', response.data);
      setSuccess('Solicitud de amistad aceptada');
      await Promise.all([fetchFriends(), fetchRequests()]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error al aceptar solicitud:', err.response?.data || err);
      setError(err.response?.data?.message || 'Error al aceptar la solicitud');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await api.post(`/api/friends/reject/${requestId}`);
      console.log('Respuesta de rechazar solicitud:', response.data);
      setSuccess('Solicitud de amistad rechazada');
      await fetchRequests();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error al rechazar solicitud:', err.response?.data || err);
      setError(err.response?.data?.message || 'Error al rechazar la solicitud');
      setTimeout(() => setError(''), 5000);
    }
  };
// ... existing code ...