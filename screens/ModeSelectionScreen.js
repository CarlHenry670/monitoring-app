import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function ModeSelectionScreen({ navigation }) {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5ee', // Um off-white ou algo suave
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500',
    textAlign: 'center',
    marginVertical: 20,
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
});
