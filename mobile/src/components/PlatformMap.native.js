// Native (iOS / Android) — uses react-native-maps
export { default as MapView, Marker, Circle } from 'react-native-maps';

export const DEFAULT_REGION = (lat, lng, delta = 0.05) => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: delta,
  longitudeDelta: delta,
});
