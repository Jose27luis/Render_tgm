import React, { useState } from 'react';
import { uploadImage } from '../config/api';

const ImageUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Selecciona una imagen primero.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    try {
      const response = await uploadImage(formData);
      setMessage('Imagen subida: ' + response.data.filename);
      setSelectedFile(null);
    } catch (error: any) {
      setMessage('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, maxWidth: 400 }}>
      <h3>Subir imagen</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading} style={{ marginLeft: 10 }}>
        {uploading ? 'Subiendo...' : 'Subir imagen'}
      </button>
      {message && <div style={{ marginTop: 10 }}>{message}</div>}
    </div>
  );
};

export default ImageUploader; 