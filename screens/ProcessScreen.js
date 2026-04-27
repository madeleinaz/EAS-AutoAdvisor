import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { fetchCatalogRequirements } from '../utils/catalogScraper';
import { analyzeTranscript } from '../utils/groqAgent';

export default function ProcessScreen({ route, navigation }) {
  // pull the file info and student name passed from HomeScreen
  const { fileUri, fileType, studentName } = route.params;



  const [statusMessage, setStatusMessage] = useState('Starting analysis...');

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    try {
      // scrape the UNG catalog for CS degree requirements
      setStatusMessage('Fetching UNG course catalog...');
      const catalogData = await fetchCatalogRequirements();

      // send transcript  catalog  student name to OpenAI for comparison
      setStatusMessage('Analyzing your transcript...');
      const report = await analyzeTranscript(fileUri, fileType, catalogData, studentName);

      // send the finished report to ResultsScreen
      navigation.replace('Results', { report });

    } catch (error) {
      Alert.alert('Something went wrong', error.message);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.card}>
        {/* spinning loading indicator */}
        <ActivityIndicator size="large" color="#582F0E" style={styles.spinner} />

        <Text style={styles.statusText}>{statusMessage}</Text>
        <Text style={styles.subText}>This may take a few seconds...</Text>
      </View>

      {/* shows what type of input was received */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Input type: </Text>
        <Text style={styles.infoValue}>
          {fileType === 'pdf' ? 'PDF Transcript'
          : fileType === 'image' ? 'Image Transcript'
          : 'First Year Student'}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C2C5AA',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#B6AD90',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333D29',
    marginBottom: 6,
    textAlign: 'center',
  },
  subText: {
    fontSize: 13,
    color: '#656D4A',
    textAlign: 'center',
  },
  // small row at the bottom showing what the user uploaded
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#656D4A',
  },
  infoValue: {
    fontSize: 13,
    color: '#414833',
    fontWeight: '500',
  },
});