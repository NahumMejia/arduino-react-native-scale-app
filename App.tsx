import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebaseConfig';

export default function ArduinoDataScreen() {
  const [nombre, setNombre] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar personas desde Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'personas'),
      orderBy('fecha', 'desc'),
      limit(20) // Limitar a las últimas 20 personas
    );

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const personasData = [];
        querySnapshot.forEach((doc) => {
          personasData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setPersonas(personasData);
        setLoadingList(false);
      },
      (error) => {
        console.error('Error al cargar personas:', error);
        setLoadingList(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función para actualizar lista manualmente
  const onRefresh = () => {
    setRefreshing(true);
    // La lista se actualiza automáticamente con onSnapshot
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Función para validar los datos
  const validarDatos = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return false;
    }
    if (!peso.trim() || isNaN(parseFloat(peso))) {
      Alert.alert('Error', 'Por favor ingresa un peso válido');
      return false;
    }
    if (!altura.trim() || isNaN(parseFloat(altura))) {
      Alert.alert('Error', 'Por favor ingresa una altura válida');
      return false;
    }
    return true;
  };

  // Función para calcular IMC
  const calcularIMC = (pesoKg, alturaM) => {
    return (pesoKg / (alturaM * alturaM)).toFixed(2);
  };

  // Función para obtener clasificación del IMC
  const getIMCClasificacion = (imc) => {
    if (imc < 18.5) return { texto: 'Bajo peso', color: '#3b82f6' };
    if (imc < 25) return { texto: 'Normal', color: '#10b981' };
    if (imc < 30) return { texto: 'Sobrepeso', color: '#f59e0b' };
    return { texto: 'Obesidad', color: '#ef4444' };
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';

    let date;
    if (fecha.seconds) {
      // Firebase Timestamp
      date = new Date(fecha.seconds * 1000);
    } else if (typeof fecha === 'string') {
      // ISO String
      date = new Date(fecha);
    } else {
      return 'Fecha no disponible';
    }

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para enviar datos a Firebase
  const enviarDatos = async () => {
    if (!validarDatos()) return;

    setLoading(true);

    try {
      const pesoNum = parseFloat(peso);
      const alturaNum = parseFloat(altura);
      const imc = calcularIMC(pesoNum, alturaNum);

      const datosPersona = {
        nombre: nombre.trim(),
        peso: pesoNum,
        altura: alturaNum,
        imc: parseFloat(imc),
        fecha: serverTimestamp(),
        fechaLocal: new Date().toISOString()
      };

      await addDoc(collection(db, 'personas'), datosPersona);

      Alert.alert(
        'Éxito',
        `Datos guardados correctamente\nIMC calculado: ${imc}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNombre('');
              setPeso('');
              setAltura('');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error al guardar datos:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar cada persona en la lista
  const renderPersona = ({ item }) => {
    const clasificacion = getIMCClasificacion(item.imc);

    return (
      <View style={styles.personaCard}>
        <View style={styles.personaHeader}>
          <Text style={styles.personaNombre}>{item.nombre}</Text>
          <Text style={styles.personaFecha}>{formatearFecha(item.fecha || item.fechaLocal)}</Text>
        </View>

        <View style={styles.personaData}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Peso:</Text>
            <Text style={styles.dataValue}>{item.peso} kg</Text>
          </View>

          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Altura:</Text>
            <Text style={styles.dataValue}>{item.altura} m</Text>
          </View>

          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>IMC:</Text>
            <Text style={[styles.dataValue, { color: clasificacion.color, fontWeight: 'bold' }]}>
              {item.imc}
            </Text>
          </View>
        </View>

        <View style={[styles.imcBadge, { backgroundColor: clasificacion.color }]}>
          <Text style={styles.imcBadgeText}>{clasificacion.texto}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f0f4f8' }}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Báscula App</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre"
              keyboardType="default"
              value={nombre}
              onChangeText={setNombre}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 70.5"
              keyboardType="numeric"
              value={peso}
              onChangeText={setPeso}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Altura (m)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1.75"
              keyboardType="numeric"
              value={altura}
              onChangeText={setAltura}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={enviarDatos}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Enviar Datos</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de personas */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Últimas Mediciones</Text>
            <Text style={styles.listCount}>({personas.length})</Text>
          </View>

          {loadingList ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Cargando mediciones...</Text>
            </View>
          ) : personas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay mediciones registradas</Text>
              <Text style={styles.emptySubtext}>Las nuevas mediciones aparecerán aquí</Text>
            </View>
          ) : (
            <FlatList
              data={personas}
              renderItem={renderPersona}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
    width: 300,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  input: {
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: 300,
    shadowColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  personaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  personaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  personaFecha: {
    fontSize: 12,
    color: '#666',
  },
  personaData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dataItem: {
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  imcBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imcBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});