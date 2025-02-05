// screens/ActivityScreen/WalkRunActivity.js
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';

/**
 * Componente de Atividade para Andar/Correr usando acelerômetro.
 * 
 * Props esperadas:
 * - goal (número de passos a atingir)
 * - modeName (string: "Andar" ou "Correr")
 * - threshold (limiar para contagem de passo)
 * - minInterval (intervalo mínimo entre passos, em ms)
 * - isCounting (boolean: indica se estamos contando ou não)
 * - onStepsChange (função: callback para atualizar contagem de passos no componente pai)
 * - onGoalReached (função: callback quando atinge a meta)
 */
export default function WalkRunActivity({
  goal,
  modeName,
  threshold,
  minInterval,
  isCounting,
  onStepsChange,
  onGoalReached,
}) {
  const [steps, setSteps] = useState(0);
  const [lastStepTime, setLastStepTime] = useState(0);
  const [sound, setSound] = useState(null);

  // Carrega o som ao montar
  useEffect(() => {
    (async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/soundsteps-248147_vwqDd8Qc.mp3')
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

  // Listener do acelerômetro
  useEffect(() => {
    let subscription;
    if (isCounting) {
      subscription = Accelerometer.addListener((accelerometerData) => {
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
      Accelerometer.setUpdateInterval(100);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isCounting, threshold, minInterval, lastStepTime]);

  // Monitora quando "steps" muda
  useEffect(() => {
    onStepsChange(steps);
    if (steps >= goal) {
      onGoalReached();
    }
  }, [steps]);

  // Se o modo parar de contar, podemos resetar contadores se quiser
  // (opcional, depende de como você deseja gerenciar o estado)

  return (
    <View style={{ display: 'none' }}>
      {/* 
        Como é um subcomponente "lógico", você pode não renderizar nada aqui
        ou renderizar algo mínimo caso precise.
      */}
      <Text style={{ display: 'none' }}>
        {/* Subcomponente Andar/Correr Ativo */}
      </Text>
    </View>
  );
}
