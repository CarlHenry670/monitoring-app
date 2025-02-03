import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ImageBackground, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Stack = createStackNavigator();

// Tela Inicial com imagem de fundo
const HomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={require('./assets/background-img')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Bem-vindo ao Monitoramento</Text>
        <Text style={styles.subtitle}>Acompanhe sua atividade física de forma fácil!</Text>
        <View style={{ marginTop: 20 }}>
          <Button
            title="Selecionar Modo"
            onPress={() => navigation.navigate('Selecionar Modo')}
            color="#FF4500"
          />
        </View>
      </View>
    </ImageBackground>
  );
};

// Tela de Seleção de Modo
const ModeSelectionScreen = ({ navigation }) => {
  const modes = [
    { name: 'Andar', goal: 5, icon: 'walking' },
    { name: 'Correr', goal: 10, icon: 'running' },
    { name: 'Ciclismo', goal: 15, icon: 'bicycle' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha o Modo de Atividade</Text>
      <View style={styles.modeContainer}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.name}
            style={styles.modeButton}
            onPress={() => navigation.navigate('Atividade', { mode })}
          >
            <Icon name={mode.icon} size={40} color="#FF4500" style={styles.icon} />
            <Text style={styles.modeButtonText}>{mode.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Tela de Monitoramento de Atividade
const ActivityScreen = ({ route }) => {
  const { mode } = route.params;
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [steps, setSteps] = useState(0);
  const [lastStepTime, setLastStepTime] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [sound, setSound] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const STEP_THRESHOLD = 1.2;
  const MIN_STEP_INTERVAL = 300;

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(require('./assets/soundsteps-248147_vwqDd8Qc.mp3'));
      setSound(sound);
    };
    loadSound();

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
    const subscription = Accelerometer.addListener((accelerometerData) => {
      setData(accelerometerData);

      const currentTime = Date.now();
      const { x, y, z } = accelerometerData;

      if (
        isCounting &&
        Math.abs(z) > STEP_THRESHOLD &&
        Math.abs(x) < 1.0 &&
        Math.abs(y) < 1.0 &&
        currentTime - lastStepTime > MIN_STEP_INTERVAL
      ) {
        setSteps((prevSteps) => prevSteps + 1);
        setLastStepTime(currentTime);
        playSound();
      }
    });

    Accelerometer.setUpdateInterval(100);

    return () => subscription && subscription.remove();
  }, [isCounting, lastStepTime]);

  useEffect(() => {
    if (steps >= mode.goal) {
      setShowModal(true);
    }
  }, [steps]);

  const distance = (steps * 0.8 / 1000).toFixed(2);
  const calories = (steps * 0.04).toFixed(2);

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
          {steps >= mode.goal ? "Parabéns! Meta alcançada! 🎉" : "Continue caminhando!"}
        </Text>
      </View>

      <Button
        title={isCounting ? "Pausar Contagem" : "Iniciar Contagem"}
        onPress={() => setIsCounting((prev) => !prev)}
        color="#FF4500"
      />

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
            <Button title="Fechar" onPress={() => setShowModal(false)} color="#FF4500" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
    padding: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#Ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#Ffffff',
  },
  modeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4B5',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    width: '80%',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginRight: 15,
  },
  modeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
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
});

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Selecionar Modo" component={ModeSelectionScreen} />
        <Stack.Screen name="Atividade" component={ActivityScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
