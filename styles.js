import { 
    StyleSheet
  } from 'react-native';
// Shared styles
const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 18,
      marginBottom: 10,
      color: '#555',
    },
    content: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 10,
    },
    input: {
      width: '100%',
      height: 50,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      marginBottom: 15,
      paddingHorizontal: 15,
    },
    button: {
      width: '100%',
      height: 50,
      backgroundColor: '#007BFF',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkButton: {
      marginTop: 20,
    },
    linkText: {
      color: '#007BFF',
      fontSize: 16,
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      marginTop: 30,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    settingLabel: {
      fontSize: 16,
    },
    settingValue: {
      fontSize: 16,
      color: '#888',
    },
  });

export default styles;