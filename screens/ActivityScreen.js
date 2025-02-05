import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import * as Progress from 'react-native-progress';

export default function ActivityScreen({ route }) {
  const { mode } = route.params;

  // Ajustes específicos para cada modo
  const modesConfig = {
    'Andar': {
      stepThreshold: 1.0,
      minStepInterval: 400, // em ms
    },
    'Correr': {
      stepThreshold: 1.3,
      minStepInterval: 250,
    },
    'Ciclismo': {
      stepThreshold: 1.8,
      minStepInterval: 150,
    },
  };

  // Pegamos do objeto modesConfig ou usamos valores padrão
  const { stepThreshold, minStepInterval } = modesConfig[mode.name] || {
    stepThreshold: 1.0,
    minStepInterval: 300,
  };

  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [steps, setSteps] = useState(0);
  const [lastStepTime, setLastStepTime] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [sound, setSound] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Carrega o som
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/soundsteps-248147_vwqDd8Qc.mp3')
      );
      setSound(sound);
    };
    loadSound();

    // Descarrega o som ao desmontar
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

  useEffect(() => {
    // Listener do acelerômetro
    const subscription = Accelerometer.addListener((accelerometerData) => {
      setData(accelerometerData);

      const currentTime = Date.now();
      const { x, y, z } = accelerometerData;

      // Verifica se estamos contando e se passamos do threshold
      if (
        isCounting &&
        Math.abs(z) > stepThreshold &&
        currentTime - lastStepTime > minStepInterval
      ) {
        setSteps((prevSteps) => prevSteps + 1);
        setLastStepTime(currentTime);
        playSound();
      }
    });

    // Ajusta a frequência de atualização (em ms)
    Accelerometer.setUpdateInterval(100);

    return () => subscription && subscription.remove();
  }, [isCounting, lastStepTime, stepThreshold, minStepInterval]);

  useEffect(() => {
    // Ao atingir a meta, exibe modal
    if (steps >= mode.goal) {
      setShowModal(true);
    }
  }, [steps]);

  // Cálculos de distância (média ~0,8m/passo) e calorias (~0,04kcal/passo)
  const distance = ((steps * 0.8) / 1000).toFixed(2);
  const calories = (steps * 0.04).toFixed(2);

  const handleCounting = () => {
    setIsCounting((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{mode.name}</Text>
        <Text style={styles.subtitle}>Meta: {mode.goal} passos</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Passos</Text>
          <Text style={styles.infoValue}>{steps}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Distância</Text>
          <Text style={styles.infoValue}>{distance} km</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Calorias</Text>
          <Text style={styles.infoValue}>{calories} kcal</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Progress.Bar
          progress={steps / mode.goal}
          width={300}
          color="#FF4500"
          unfilledColor="#FFE4B5"
          borderWidth={0}
        />
        <Text style={styles.progressText}>
          {steps >= mode.goal ? 'Parabéns! Meta alcançada! 🎉' : 'Continue caminhando!'}
        </Text>
      </View>

      {/* Botão personalizado para iniciar/pausar */}
      <TouchableOpacity
        style={[styles.startPauseButton, isCounting && { backgroundColor: '#FF6347' }]}
        onPress={handleCounting}
      >
        <Text style={styles.startPauseButtonText}>
          {isCounting ? 'Pausar Contagem' : 'Iniciar Contagem'}
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
            <Text style={styles.modalMessage}>
              Você alcançou sua meta de {mode.goal} passos!
            </Text>
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
    justifyContent: 'space-between',
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
