'use client';

import React from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const DynamicMap = () => {
  const position: [number, number] = [32.4279, 53.6880]; // Center of Iran
  const zoom = 5;

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
      <MapContainer
        center={position}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        style={{ width: '100%', height: '100%', background: '#000' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        {/* Radar/Target Effect on Tehran */}
        <Circle
          center={[35.6892, 51.3890]}
          radius={200000}
          pathOptions={{ 
            color: '#ff3a3a', 
            fillColor: '#ff3a3a', 
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10'
          }}
        />

        {/* Outer pulse */}
        <Circle
          center={[35.6892, 51.3890]}
          radius={500000}
          pathOptions={{ 
            color: '#ff3a3a', 
            fillOpacity: 0,
            weight: 1,
            opacity: 0.3
          }}
        />

        <ChangeView center={position} zoom={zoom} />
      </MapContainer>
      
      {/* Tactical overlay for the map */}
      <div className="map-tactical-overlay"></div>
    </div>
  );
};

export default DynamicMap;
