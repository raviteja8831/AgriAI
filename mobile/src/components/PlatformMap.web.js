// Web — uses react-leaflet (no native bridge needed)
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { MapContainer, TileLayer, Marker as LeafMarker, Circle as LeafCircle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GreenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Sync map center when location prop changes
function RecenterMap({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], zoom); }, [lat, lng]);
  return null;
}

// Wrap map click events
function ClickHandler({ onPress }) {
  useMapEvents({ click: (e) => onPress?.({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } }) });
  return null;
}

// MapView — matches the react-native-maps API surface used in screens
export function MapView({ style, initialRegion, onPress, mapType, children, scrollEnabled, zoomEnabled }) {
  const lat = initialRegion?.latitude ?? 17.385;
  const lng = initialRegion?.longitude ?? 78.487;
  const zoom = initialRegion?.latitudeDelta < 0.01 ? 16 : initialRegion?.latitudeDelta < 0.05 ? 14 : initialRegion?.latitudeDelta < 0.5 ? 10 : 6;

  return (
    <View style={[{ overflow: 'hidden', borderRadius: 12 }, style]}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={zoomEnabled !== false}
        dragging={scrollEnabled !== false}
      >
        <TileLayer
          url={mapType === 'hybrid'
            ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <RecenterMap lat={lat} lng={lng} zoom={zoom} />
        {onPress && <ClickHandler onPress={onPress} />}
        {children}
      </MapContainer>
    </View>
  );
}

// Marker — adapts react-native-maps API { coordinate } → react-leaflet { position }
export function Marker({ coordinate, title, pinColor }) {
  if (!coordinate?.latitude) return null;
  return <LeafMarker position={[coordinate.latitude, coordinate.longitude]} icon={GreenIcon} />;
}

// Circle — matches react-native-maps Circle props
export function Circle({ center, radius, strokeColor, fillColor, strokeWidth }) {
  if (!center?.latitude) return null;
  return (
    <LeafCircle
      center={[center.latitude, center.longitude]}
      radius={radius}
      pathOptions={{ color: strokeColor || '#2e7d32', fillColor: fillColor || '#2e7d3250', weight: strokeWidth || 2, fillOpacity: 0.2 }}
    />
  );
}

export const DEFAULT_REGION = (lat, lng, delta = 0.05) => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: delta,
  longitudeDelta: delta,
});
