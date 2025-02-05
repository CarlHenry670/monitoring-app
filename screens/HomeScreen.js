import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#FF7F50', '#FF4500']}
      style={styles.gradientBackground}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Bem-vindo ao Monitoramento</Text>
        <Text style={styles.subtitle}>
          Acompanhe sua atividade física de forma fácil!
        </Text>

        <TouchableOpacity
          style={styles.customButton}
          onPress={() => navigation.navigate('Selecionar Modo')}
        >
          <Text style={styles.buttonText}>Selecionar Modo</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  customButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
  },
  buttonText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
