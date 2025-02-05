// screens/ActivityScreen/CyclingActivity.js
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';

/**
 * Componente de Atividade para Ciclismo usando GPS.
 * 
 * Props esperadas:
 * - goal (número, em km, meta de distância)
 * - isCounting (boolean: indica se estamos contando ou não)
 * - onDistanceChange (função: callback para atualizar distância no componente pai)
 * - onGoalReached (função: callback quando atinge a meta)
 */

// Função simples de Haversine
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

export default function CyclingActivity({
  goal,
  isCounting,
  onDistanceChange,
  onGoalReached,
}) {
  const [distance, setDistance] = useState(0);
  const [lastLocation, setLastLocation] = useState(null);
  const [locationWatcher, setLocationWatcher] = useState(null);

  // Inicia ou para a atualização de GPS
  useEffect(() => {
    let subscription;

    async function startLocationUpdates() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão de localização negada!');
        return;
      }
      // Inicia watch
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (lastLocation) {
            const dist = haversineDistance(
              lastLocation.latitude,
              lastLocation.longitude,
              latitude,
              longitude
            );
            setDistance((prev) => prev + dist);
          }
          setLastLocation({ latitude, longitude });
        }
      );
      setLocationWatcher(subscription);
    }

    if (isCounting) {
      // Reset do estado ao iniciar novamente
      setDistance(0);
      setLastLocation(null);
      startLocationUpdates();
    } else {
      // Pausou => remove subscription
      if (locationWatcher) {
        locationWatcher.remove();
      }
      setLocationWatcher(null);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      setLocationWatcher(null);
    };
  }, [isCounting]);

  // Monitora "distance"
  useEffect(() => {
    onDistanceChange(distance);
    if (distance >= goal) {
      onGoalReached();
    }
  }, [distance]);

  // Renderização "invisível"
  return (
    <View style={{ display: 'none' }}>
      <Text style={{ display: 'none' }}>
        {/* Subcomponente Ciclismo Ativo */}
      </Text>
    </View>
  );
}
