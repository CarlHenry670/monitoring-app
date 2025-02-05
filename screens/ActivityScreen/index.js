// screens/ActivityScreen/index.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import * as Progress from 'react-native-progress';

import WalkRunActivity from './WalkRunActivity';
import CyclingActivity from './CyclingActivity';

export default function ActivityScreen({ route }) {
  const { mode } = route.params;
  const isCycling = (mode.name === 'Ciclismo');

  // Estados gerais de exibição
  const [isCounting, setIsCounting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Para Andar/Correr
  const [steps, setSteps] = useState(0);

  // Para Ciclismo
  const [distance, setDistance] = useState(0);

  // Função quando atinge meta
  const handleGoalReached = () => {
    setShowModal(true);
  };

  // Lógica de pausar/iniciar
  const handleToggleCounting = () => {
    setIsCounting((prev) => !prev);
    if (!isCycling) {
      // Se reiniciou, zera passos
      if (!isCounting) {
        setSteps(0);
      }
    } else {
      // Se reiniciou no ciclismo, zera distance
      if (!isCounting) {
        setDistance(0);
      }
    }
  };

  // Calcula valores p/ UI
  const walkRunDistance = ((steps * 0.8) / 1000).toFixed(2);
  const walkRunCalories = (steps * 0.04).toFixed(2);

  // Calcula progresso
  let progressValue = 0;
  let progressText = '';
  if (isCycling) {
    progressValue = distance / mode.goal;
    progressText = `Distância: ${distance.toFixed(2)} / ${mode.goal} km`;
    if (distance >= mode.goal) {
      progressText = 'Parabéns! Meta alcançada! 🎉';
    }
  } else {
    progressValue = steps / mode.goal;
    progressText = `Passos: ${steps} / ${mode.goal}`;
    if (steps >= mode.goal) {
      progressText = 'Parabéns! Meta alcançada! 🎉';
    }
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

      {/* 
        Se NÃO é ciclismo, exibimos info de passos
        Se É ciclismo, exibimos info de distância 
      */}
      {!isCycling ? (
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Passos</Text>
            <Text style={styles.infoValue}>{steps}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distância</Text>
            <Text style={styles.infoValue}>{walkRunDistance} km</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Calorias</Text>
            <Text style={styles.infoValue}>{walkRunCalories} kcal</Text>
          </View>
        </View>
      ) : (
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distância</Text>
            <Text style={styles.infoValue}>{distance.toFixed(2)} km</Text>
          </View>
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
          {progressText}
        </Text>
      </View>

      {/* Botão para iniciar/pausar */}
      <TouchableOpacity
        style={[
          styles.startPauseButton,
          isCounting && { backgroundColor: '#FF6347' }
        ]}
        onPress={handleToggleCounting}
      >
        <Text style={styles.startPauseButtonText}>
          {isCounting ? 'Pausar' : 'Iniciar'}
        </Text>
      </TouchableOpacity>

      {/* Modal de Parabéns */}
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

      {/* 
        Subcomponentes LÓGICOS:
        - Somente 1 será ativo dependendo do modo, mas não exibem UI.
        - Passamos callbacks para notificar mudanças de estado.
      */}
      {!isCycling && (
        <WalkRunActivity
          modeName={mode.name}
          goal={mode.goal}
          threshold={mode.name === 'Correr' ? 1.3 : 1.0}
          minInterval={mode.name === 'Correr' ? 250 : 400}
          isCounting={isCounting}
          onStepsChange={(val) => setSteps(val)}
          onGoalReached={handleGoalReached}
        />
      )}
      {isCycling && (
        <CyclingActivity
          goal={mode.goal}
          isCounting={isCounting}
          onDistanceChange={(val) => setDistance(val)}
          onGoalReached={handleGoalReached}
        />
      )}
    </View>
  );
}

// Estilos
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
