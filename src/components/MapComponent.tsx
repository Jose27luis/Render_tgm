import { Box } from '@mui/material';
import { GoogleMap, InfoWindow, LoadScript, Marker } from '@react-google-maps/api';
import { useState } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
};

// Coordenadas de Puerto Maldonado, Madre de Dios
const center = {
  lat: -12.5933,
  lng: -69.1891
};

// Estilo oscuro para el mapa que coincide con el tema
const mapStyles = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#263c3f" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6b9a76" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1f2835" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#f3d19c" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#2f3948" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#515c6d" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#17263c" }]
  }
];

interface MapComponentProps {
  apiKey: string;
}

const MapComponent = ({ apiKey }: MapComponentProps) => {
  const [showInfoWindow, setShowInfoWindow] = useState(true);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
          }}
        >
          <Marker
            position={center}
            onClick={() => setShowInfoWindow(!showInfoWindow)}
            animation={window.google?.maps?.Animation?.BOUNCE}
          />
          
          {showInfoWindow && (
            <InfoWindow
              position={center}
              onCloseClick={() => setShowInfoWindow(false)}
            >
              <Box sx={{ color: '#000', p: 1 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>RENDER-TGM</h3>
                <p style={{ margin: '4px 0' }}>Puerto Maldonado</p>
                <p style={{ margin: '4px 0' }}>Madre de Dios, Perú</p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2196f3', textDecoration: 'none' }}
                >
                  Cómo llegar →
                </a>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </Box>
  );
};

export default MapComponent; 