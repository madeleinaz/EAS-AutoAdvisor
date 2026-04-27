import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function ResultsScreen({ route, navigation }) {
  const { report } = route.params;

  // parse notes into four labeled sections
  const parseNotes = (notesString) => {
    if (!notesString) return {};
    const sections = notesString.split('||SECTION||');
    const result = {};
    sections.forEach(section => {
      const trimmed = section.trim();
      if (trimmed.startsWith('CREDIT HOURS:')) {
        result.creditHours = trimmed.replace('CREDIT HOURS:', '').trim();
      } else if (trimmed.startsWith('NEXT STEPS:')) {
        result.nextSteps = trimmed.replace('NEXT STEPS:', '').trim();
      } else if (trimmed.startsWith('COURSE SEQUENCING:')) {
        result.sequencing = trimmed.replace('COURSE SEQUENCING:', '').trim();
      } else if (trimmed.startsWith('FEEDBACK:')) {
        result.feedback = trimmed.replace('FEEDBACK:', '').trim();
      }
    });
    return result;
  };

  // separate remaining into required courses, electives, and free electives
  const requiredRemaining = report.remaining?.filter(
    c => c.code !== 'ELECTIVE' && c.code !== 'CSCI-ELEC'
  ) ?? [];
  const csciElectives = report.remaining?.filter(c => c.code === 'CSCI-ELEC') ?? [];
  const freeElectives = report.remaining?.filter(c => c.code === 'ELECTIVE') ?? [];

  // combine csci electives into remaining for display — keeps UI clean
  const allRemaining = [...requiredRemaining, ...csciElectives];
  const notes = parseNotes(report.notes);

  const handleSaveReport = async () => {
    try {
      const formatRows = (courses) =>
        (courses ?? []).map(course => `
          <tr>
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${course.credits ?? 3}</td>
          </tr>`).join('');

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>AutoAdvisor Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333D29; background: #C2C5AA; }
    h1 { font-size: 20px; margin-bottom: 2px; color: #333D29; }
    h2 { font-size: 13px; font-weight: normal; color: #656D4A; margin-top: 0; }
    h3 { font-size: 15px; margin: 20px 0 6px; color: #333D29; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff; border-radius: 8px; overflow: hidden; }
    th { background: #333D29; color: #C2C5AA; padding: 10px 8px; text-align: left; font-size: 13px; }
    td { padding: 8px; font-size: 13px; border-bottom: 1px solid #e0e0e0; }
    tr:last-child td { border-bottom: none; }
    .notes { background: #fff; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 20px; }
    .notes p { margin: 0 0 8px; }
    .grad { background: #333D29; color: #B6AD90; text-align: center; padding: 14px; border-radius: 8px; font-size: 16px; margin-bottom: 16px; }
    .date { font-size: 12px; color: #656D4A; margin-bottom: 20px; }
    .label { font-weight: bold; color: #333D29; }
  </style>
</head>
<body>
  <h1>AutoAdvisor</h1>
  <h2>Academic Advisement Report: ${report.studentName ?? 'Student'}</h2>
  <p class="date">Generated: ${new Date().toLocaleDateString()}</p>
  ${report.readyToGraduate ? '<div class="grad">Ready to Graduate — Congratulations!</div>' : ''}
  <h3>Completed Courses</h3>
  <table>
    <tr><th>Code</th><th>Title</th><th>Hrs</th></tr>
    ${formatRows(report.completed)}
  </table>
  <h3>Remaining Courses</h3>
  <table>
    <tr><th>Code</th><th>Title</th><th>Hrs</th></tr>
    ${formatRows(allRemaining)}
  </table>
  <h3>Electives Needed</h3>
  <table>
    <tr><th>Details</th></tr>
    ${(freeElectives ?? []).map(e => `<tr><td>${e.name}</td></tr>`).join('')}
  </table>
  <h3>Recommended Next Semester</h3>
  <table>
    <tr><th>Code</th><th>Title</th><th>Hrs</th></tr>
    ${formatRows(report.recommended)}
  </table>
  <h3>Advisor Notes</h3>
  <div class="notes">
    <p><span class="label">Credit Hours</span><br/>${notes.creditHours ?? ''}</p>
    <p><span class="label">Next Steps</span><br/>${notes.nextSteps ?? ''}</p>
    <p><span class="label">Course Sequencing</span><br/>${notes.sequencing ?? ''}</p>
    <p><span class="label">Feedback</span><br/>${notes.feedback ?? ''}</p>
  </div>
</body>
</html>`;

      const fileUri = FileSystem.documentDirectory + `report_${Date.now()}.html`;
      await FileSystem.writeAsStringAsync(fileUri, html);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Save Advisement Report',
        UTI: 'public.html',
      });

    } catch (error) {
      Alert.alert('Error', 'Could not save the report.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* student name header */}
      <View style={styles.nameHeader}>
        <Text style={styles.nameHeaderText}>{report.studentName ?? 'Student'}</Text>
        <Text style={styles.nameHeaderSub}>Academic Advisement Report</Text>
      </View>

      {/* graduation banner */}
      {report.readyToGraduate && (
        <View style={styles.graduationBanner}>
          <Text style={styles.graduationTitle}>Ready to Graduate!</Text>
          <Text style={styles.graduationSubtext}>
            You have completed all required CS courses. Contact your advisor to apply for graduation.
          </Text>
        </View>
      )}

      {/* completed courses */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Completed Courses</Text>
          <Text style={styles.sectionCount}>{report.completed?.length ?? 0} courses</Text>
        </View>
        {report.completed?.map((course, index) => (
          <View key={index} style={styles.courseRow}>
            <Text style={styles.courseCode}>{course.code}</Text>
            <Text style={styles.courseName}>{course.name}</Text>
          </View>
        ))}
      </View>

      {/* remaining courses */}
      {allRemaining.length > 0 && (
        <View style={[styles.sectionCard, styles.remainingCard]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleLight}>Remaining Courses</Text>
            <Text style={styles.sectionCountLight}>{allRemaining.length} items</Text>
          </View>
          {allRemaining.map((course, index) => (
            <View key={index} style={styles.courseRow}>
              <Text style={styles.courseCodeLight}>{course.code}</Text>
              <Text style={styles.courseNameLight}>{course.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* electives needed */}
      {freeElectives.length > 0 && (
        <View style={[styles.sectionCard, styles.electiveCard]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleLight}>Electives Needed</Text>
          </View>
          {freeElectives.map((item, index) => (
            <View key={index} style={styles.courseRow}>
              <Text style={styles.courseNameLight}>{item.name}</Text>
            </View>
          ))}
          <Text style={styles.electiveHint}>
            Use electives for a minor, concentration, or any courses that interest you.
          </Text>
        </View>
      )}

      {/* recommended next semester */}
      <View style={[styles.sectionCard, styles.recommendedCard]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleLight}>Recommended Next Semester</Text>
          <Text style={styles.sectionCountLight}>{report.recommended?.length ?? 0} courses</Text>
        </View>
        {report.recommended?.map((course, index) => (
          <View key={index} style={styles.courseRow}>
            <Text style={styles.courseCodeLight}>{course.code}</Text>
            <Text style={styles.courseNameLight}>{course.name}</Text>
          </View>
        ))}
      </View>

      {/* advisor notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>Advisor Notes</Text>

        {notes.creditHours && (
          <View style={styles.notesSection}>
            <Text style={styles.notesSectionLabel}>Credit Hours</Text>
            <Text style={styles.notesText}>{notes.creditHours}</Text>
          </View>
        )}
        {notes.nextSteps && (
          <View style={styles.notesSection}>
            <Text style={styles.notesSectionLabel}>Next Steps</Text>
            <Text style={styles.notesText}>{notes.nextSteps}</Text>
          </View>
        )}
        {notes.sequencing && (
          <View style={styles.notesSection}>
            <Text style={styles.notesSectionLabel}>Course Sequencing</Text>
            <Text style={styles.notesText}>{notes.sequencing}</Text>
          </View>
        )}
        {notes.feedback && (
          <View style={styles.notesSection}>
            <Text style={styles.notesSectionLabel}>Feedback</Text>
            <Text style={styles.notesText}>{notes.feedback}</Text>
          </View>
        )}
      </View>

      {/* save report */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
        <Text style={styles.saveButtonText}>Save Report</Text>
      </TouchableOpacity>

      {/* advise another student */}
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.popToTop()}>
        <Text style={styles.homeButtonText}>Advise Another Student</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C2C5AA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  nameHeader: {
    backgroundColor: '#333D29',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  nameHeaderText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#B6AD90',
    marginBottom: 2,
  },
  nameHeaderSub: {
    fontSize: 12,
    color: '#A4AC86',
  },
  graduationBanner: {
    backgroundColor: '#333D29',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  graduationTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#B6AD90',
    marginBottom: 6,
  },
  graduationSubtext: {
    fontSize: 13,
    color: '#A4AC86',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#B6AD90',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  remainingCard: {
    backgroundColor: '#414833',
  },
  electiveCard: {
    backgroundColor: '#656D4A',
  },
  recommendedCard: {
    backgroundColor: '#582F0E',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333D29',
  },
  sectionTitleLight: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C2C5AA',
  },
  sectionCount: {
    fontSize: 12,
    color: '#656D4A',
  },
  sectionCountLight: {
    fontSize: 12,
    color: '#A4AC86',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333D29',
    width: 90,
  },
  courseName: {
    fontSize: 13,
    color: '#414833',
    flex: 1,
  },
  courseCodeLight: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B6AD90',
    width: 90,
  },
  courseNameLight: {
    fontSize: 13,
    color: '#C2C5AA',
    flex: 1,
  },
  electiveHint: {
    fontSize: 11,
    color: '#C2C5AA',
    marginTop: 10,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  notesCard: {
    backgroundColor: '#414833',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 4,
  },
notesTitle: {
  fontSize: 15,
  fontWeight: '500',
  color: '#C2C5AA',
  marginBottom: 12,
},
  notesSection: {
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  notesSectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A4AC86',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 13,
    color: '#C2C5AA',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#7F4F24',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#C2C5AA',
    fontSize: 16,
    fontWeight: '500',
  },
  homeButton: {
    borderWidth: 1.5,
    borderColor: '#656D4A',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#414833',
    fontSize: 15,
    fontWeight: '500',
  },
});