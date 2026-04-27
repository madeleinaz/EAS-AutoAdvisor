import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen({ navigation }) {

  const [studentName, setStudentName] = useState('');

  const handlePDFUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
     
      if (!result.canceled) {
        navigation.navigate('Process', { 
          fileUri: result.assets[0].uri,
          fileType: 'pdf',
          studentName: studentName || 'Student',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  const handleImageUpload = async () => {
    try {
      // request permission first
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled) {
        navigation.navigate('Process', { 
          fileUri: result.assets[0].uri,
          fileType: 'image',
          studentName: studentName || 'Student',
        });
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFirstYear = () => {
    // navigated to process with no file for first year students
    navigation.navigate('Process', { 
      fileUri: null,
      fileType: 'firstyear',
      studentName: studentName || 'Student',
    });
  };

  return (
    <View style={styles.container}>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome to AutoAdvisor</Text>
        <Text style={styles.welcomeSubtitle}>
          Upload your transcript and we'll build you a personalized graduation plan based on UNG's CS requirements.
        </Text>
      </View>

    
      <TextInput
        style={styles.nameInput}
        placeholder="Enter your name (optional)"
        placeholderTextColor="#656D4A"
        value={studentName}
        onChangeText={setStudentName}
      />

      <Text style={styles.sectionLabel}>Choose an option to get started</Text>

      {/* button for uploading pdf transcript */}
      <TouchableOpacity style={styles.primaryButton} onPress={handlePDFUpload}>
        <Text style={styles.primaryButtonText}>Upload PDF Transcript</Text>
        <Text style={styles.buttonSubtext}>Select a PDF from your files</Text>
      </TouchableOpacity>

      {/* button for uploading image of transcript */}
      <TouchableOpacity style={styles.secondaryButton} onPress={handleImageUpload}>
        <Text style={styles.secondaryButtonText}>Upload Image Transcript</Text>
        <Text style={styles.buttonSubtextDark}>Select a photo from your library</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* button for first year students with no transcript */}
      <TouchableOpacity style={styles.outlineButton} onPress={handleFirstYear}>
        <Text style={styles.outlineButtonText}>First Year Student</Text>
        <Text style={styles.outlineButtonSubtext}>No transcript yet? Get a starter plan</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C2C5AA',
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#B6AD90',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    marginTop: 8,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333D29',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#414833',
    lineHeight: 21,
  },
  // optional name input field
  nameInput: {
    backgroundColor: '#B6AD90',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333D29',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#656D4A',
    marginBottom: 12,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#582F0E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#B6AD90',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  buttonSubtext: {
    color: '#A68A64',
    fontSize: 12,
  },
  secondaryButton: {
    backgroundColor: '#7F4F24',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#C2C5AA',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  buttonSubtextDark: {
    color: '#B6AD90',
    fontSize: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#A4AC86',
  },
  dividerText: {
    color: '#656D4A',
    marginHorizontal: 12,
    fontSize: 13,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#656D4A',
    borderRadius: 10,
    padding: 16,
  },
  outlineButtonText: {
    color: '#414833',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  outlineButtonSubtext: {
    color: '#656D4A',
    fontSize: 12,
  },
});