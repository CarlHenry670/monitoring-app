// screens/ActivityScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import * as Progress from 'react-native-progress';
import * as Location from 'expo-location';

// -- Se quiser usar a fórmula de Haversine, crie ou importe daqui mesmo:
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio médio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Resultado em km
}

export default function ActivityScreen({ route }) {
  const { mode } = route.params;
  // Verifica se é ciclismo para decidir qual lógica usar
  const isCycling = (mode.name === 'Ciclismo');

  // ---------------------------
  // ESTADOS GERAIS
  // ---------------------------
  const [isCounting, setIsCounting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sound, setSound] = useState(null);

  // ---------------------------
  // ESTADOS PARA CAMINHAR/CORRER
  // ---------------------------
  const [steps, setSteps] = useState(0);
  const [lastStepTime, setLastStepTime] = useState(0);

  // Definindo thresholds e intervalos para cada modo de passo
  const walkRunConfig = {
    'Andar':  { threshold: 1.0, minInterval: 400 },
    'Correr': { threshold: 1.3, minInterval: 250 },
  };
  // Pega config conforme o modo. Se não existir, usa algo padrão.
  const { threshold, minInterval } = walkRunConfig[mode.name] || {
    threshold: 1.0,
    minInterval: 300,
  };

  // ---------------------------
  // ESTADOS PARA CICLISMO (GPS)
  // ---------------------------
  const [distance, setDistance] = useState(0);     // em km
  const [lastLocation, setLastLocation] = useState(null);
  const [locationWatcher, setLocationWatcher] = useState(null);

  // ---------------------------
  // CARREGAR SOM (passos)
  // ---------------------------
  useEffect(() => {
    (async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/soundsteps-248147_vwqDd8Qc.mp3')
      );
      setSound(sound);
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playSound = async () => {
    if (sound) {
      await sound.replayAsync();
    }
  };

  // ------------------------------------------------------------------
  // useEffect para LÓGICA DE CAMINHAR/CORRER (ACELERÔMETRO)
  // Somente ativo se NÃO for ciclismo e se isCounting = true
  // ------------------------------------------------------------------
  useEffect(() => {
    let accelerometerSubscription;

    if (!isCycling && isCounting) {
      accelerometerSubscription = Accelerometer.addListener((accelerometerData) => {
        const currentTime = Date.now();
        const { x, y, z } = accelerometerData;

        if (
          Math.abs(z) > threshold &&
          currentTime - lastStepTime > minInterval
        ) {
          setSteps((prev) => prev + 1);
          setLastStepTime(currentTime);
          playSound();
        }
      });

      // Frequência de atualização (ms)
      Accelerometer.setUpdateInterval(100);
    }

    // Cleanup
    return () => {
      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }
    };
  }, [isCycling, isCounting, threshold, minInterval, lastStepTime]);

  // ------------------------------------------------------------------
  // useEffect para LÓGICA DE CICLISMO (GPS)
  // Somente ativo se for ciclismo e isCounting = true
  // ------------------------------------------------------------------
  useEffect(() => {
    let subscription;
    
    async function startLocationUpdates() {
      // Pede permissão
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão de localização negada!');
        return;
      }

      // Inicia watchPositionAsync
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,   // Atualiza a cada 1 segundo
          distanceInterval: 0,  // ou defina em metros se preferir
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (lastLocation) {
            // Calcula distância entre a última posição e a atual
            const dist = haversineDistance(
              lastLocation.latitude,
              lastLocation.longitude,
              latitude,
              longitude
            );
            // Soma ao total
            setDistance((prev) => prev + dist);
          }
          // Atualiza última localização
          setLastLocation({ latitude, longitude });
        }
      );

      setLocationWatcher(subscription);
    }

    if (isCycling && isCounting) {
      startLocationUpdates();
    }

    // Cleanup
    return () => {
      if (subscription) {
        subscription.remove();
      }
      setLocationWatcher(null);
    };
  }, [isCycling, isCounting, lastLocation]);

  // ------------------------------------------------------------------
  // useEffect para checar se alcançou a meta
  // (passos para Andar/Correr ou distância para Ciclismo)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isCycling && steps >= mode.goal) {
      setShowModal(true);
    }
  }, [steps]);

  useEffect(() => {
    if (isCycling && distance >= mode.goal) {
      setShowModal(true);
    }
  }, [distance]);

  // ------------------------------------------------------------------
  // FUNÇÃO de iniciar/pausar
  // ------------------------------------------------------------------
  const handleToggleCounting = () => {
    // Se estava ativo, vamos pausar
    if (isCounting) {
      // Se for ciclismo, remove subscription
      if (locationWatcher) {
        locationWatcher.remove();
      }
      setLocationWatcher(null);
    } else {
      // Se vamos iniciar novamente no ciclismo, zera localizações?
      if (isCycling) {
        setDistance(0);
        setLastLocation(null);
      } else {
        // Zera contagem de passos
        setSteps(0);
        setLastStepTime(0);
      }
    }
    setIsCounting((prev) => !prev);
  };

  // ------------------------------------------------------------------
  // RENDERIZAÇÃO
  // ------------------------------------------------------------------
  // Cálculo de calorias e distância para Andar/Correr (opcional):
  // (distância = steps * 0.8m / 1000 => km, calorias ~ 0.04 * steps)
  const walkingRunningDistance = ((steps * 0.8) / 1000).toFixed(2);
  const walkingRunningCalories = (steps * 0.04).toFixed(2);

  // Progresso para exibir na barra:
  let progressValue = 0;
  let progressLabel = '';

  if (isCycling) {
    progressValue = distance / mode.goal; // se meta = 10 km, e distance=2 => 0.2
    progressLabel = distance >= mode.goal
      ? 'Parabéns! Meta alcançada! 🎉'
      : `Distância: ${distance.toFixed(2)} km`;
  } else {
    progressValue = steps / mode.goal; // se meta=5 passos, e steps=2 => 0.4
    progressLabel = steps >= mode.goal
      ? 'Parabéns! Meta alcançada! 🎉'
      : `Passos: ${steps}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{mode.name}</Text>
        {isCycling ? (
          <Text style={styles.subtitle}>Meta: {mode.goal} km</Text>
        ) : (
          <Text style={styles.subtitle}>Meta: {mode.goal} passos</Text>
        )}
      </View>

      {/* Cards de info (para Andar/Correr, exibimos passos/distância/calorias.
          Para Ciclismo, exibimos distância atual e pode exibir calorias se quiser
          baseado na distância (ex.: 1 km = ~ 30 calorias, etc. - mas é escolha sua). 
      */}
      {!isCycling ? (
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Passos</Text>
            <Text style={styles.infoValue}>{steps}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distância</Text>
            <Text style={styles.infoValue}>
              {walkingRunningDistance} km
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Calorias</Text>
            <Text style={styles.infoValue}>
              {walkingRunningCalories} kcal
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distância</Text>
            <Text style={styles.infoValue}>
              {distance.toFixed(2)} km
            </Text>
          </View>
          {/* Se quiser exibir uma estimativa de calorias, você pode criar uma lógica 
              ex.: 1 km de ciclismo ~ 30 kcal, mas não é padrão fixo. */}
        </View>
      )}

      {/* Barra de progresso */}
      <View style={styles.progressContainer}>
        <Progress.Bar
          progress={progressValue}
          width={300}
          color="#FF4500"
          unfilledColor="#FFE4B5"
          borderWidth={0}
        />
        <Text style={styles.progressText}>
          {progressLabel}
        </Text>
      </View>

      {/* Botão Iniciar/Pausar */}
      <TouchableOpacity
        style={[styles.startPauseButton, isCounting && { backgroundColor: '#FF6347' }]}
        onPress={handleToggleCounting}
      >
        <Text style={styles.startPauseButtonText}>
          {isCounting ? 'Pausar' : 'Iniciar'}
        </Text>
      </TouchableOpacity>

      {/* Modal de Parabéns ao atingir meta */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Parabéns! 🎉</Text>
            {isCycling ? (
              <Text style={styles.modalMessage}>
                Você alcançou sua meta de {mode.goal} km!
              </Text>
            ) : (
              <Text style={styles.modalMessage}>
                Você alcançou sua meta de {mode.goal} passos!
              </Text>
            )}
            <TouchableOpacity
              style={[styles.customButtonModal, { backgroundColor: '#FF4500' }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.startPauseButtonText, { color: '#fff' }]}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -----------------------------------------------------------
// Estilos
// -----------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#FFE4B5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    elevation: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#FF4500',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF6347',
    textAlign: 'center',
  },
  startPauseButton: {
    backgroundColor: '#FF4500',
    alignSelf: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 5,
  },
  startPauseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  customButtonModal: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
  },
});
