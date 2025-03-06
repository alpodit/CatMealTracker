import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { AppProvider } from './AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import AppNavigator from './navigation/AppNavigator';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './AuthContext';
import AuthScreens from './screens/AuthScreens';
import MainScreens from './screens/MainScreens';


// Main App Component
export default function App() {

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const [cats, setCats] = useState([]);
  const [meals, setMeals] = useState([]);
  const [mealPresets, setMealPresets] = useState(['1/4 cup', '1/2 cup', '1 cup', '1 can', '2 tablespoons']);
  const [newPreset, setNewPreset] = useState('');
  const [addCatModalVisible, setAddCatModalVisible] = useState(false);
  const [addMealModalVisible, setAddMealModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [mealType, setMealType] = useState('Wet Food');
  const [mealAmount, setMealAmount] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [mealDate, setMealDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statsView, setStatsView] = useState(false);

  // Load data from AsyncStorage on startup
  useEffect(() => {
    loadData();
  }, []);

  // Save data whenever cats or meals change
  useEffect(() => {
    saveData();
  }, [cats, meals]);

  // Firebase Authentication Functions
  const signUp = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      setUser(userCredential.user);
      setAuthModalVisible(false);
    } catch (error) {
      Alert.alert('Sign Up Error', error.message);
    }
  };

  const signIn = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      setUser(userCredential.user);
      setAuthModalVisible(false);
    } catch (error) {
      Alert.alert('Sign In Error', error.message);
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setCats([]);
    } catch (error) {
      Alert.alert('Sign Out Error', error.message);
    }
  };

  // Firestore Sync Functions
  const addCatToFirestore = async (catName) => {
    if (!user) return;

    try {
      const newCatRef = await firestore()
        .collection('cats')
        .doc();
      
      await newCatRef.set({
        name: catName,
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      Alert.alert('Add Cat Error', error.message);
    }
  };

  const addMealToFirestore = async (meal) => {
    if (!selectedCat || !user) return;

    try {
      await firestore()
        .collection('meals')
        .add({
          ...meal,
          catId: selectedCat.id,
          userId: user.uid,
          timestamp: firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      Alert.alert('Add Meal Error', error.message);
    }
  };

  // Real-time Listeners
  useEffect(() => {
    if (!user) return;

    // Listen for cats
    const catsSubscriber = firestore()
      .collection('cats')
      .where('userId', '==', user.uid)
      .onSnapshot(querySnapshot => {
        const fetchedCats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCats(fetchedCats);
      });

    // Listen for meals (optional, can be filtered by selected cat)
    const mealsSubscriber = firestore()
      .collection('meals')
      .where('userId', '==', user.uid)
      .onSnapshot(querySnapshot => {
        // Process meals here
      });

    // Cleanup subscriptions
    return () => {
      catsSubscriber();
      mealsSubscriber();
    };
  }, [user]);

  // Sharing Feature
  const shareCatTracker = async (partnerEmail) => {
    try {
      // Implement shared access logic
      await firestore()
        .collection('sharedAccess')
        .add({
          ownerUserId: user.uid,
          sharedWithEmail: partnerEmail
        });
      
      Alert.alert('Sharing', `Invited ${partnerEmail} to share cat tracker`);
    } catch (error) {
      Alert.alert('Sharing Error', error.message);
    }
  };
////

const AuthModal = ({ visible, onClose }) => {

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const [signUpMode, setSignUpMode] = useState(false);


  const handleAuth = async (mode) => {

    setError('');

    try {

      await auth().setPersistence(auth.Auth.Persistence.LOCAL); // Add persistence!


      if (mode === 'signup') {

        await auth().createUserWithEmailAndPassword(email, password);

      } else {

        await auth().signInWithEmailAndPassword(email, password);

      }

      onClose();

    } catch (error) {

      setError(error.message); // Set error message

      Alert.alert('Authentication Error', error.message);

    }

  };

  // Load data from AsyncStorage
  const loadData = async () => {
    try {
      const storedCats = await AsyncStorage.getItem('cats');
      const storedMeals = await AsyncStorage.getItem('meals');
      const storedPresets = await AsyncStorage.getItem('mealPresets');
      
      if (storedCats) setCats(JSON.parse(storedCats));
      if (storedMeals) setMeals(JSON.parse(storedMeals));
      if (storedPresets) setMealPresets(JSON.parse(storedPresets));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save data to AsyncStorage
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('cats', JSON.stringify(cats));
      await AsyncStorage.setItem('meals', JSON.stringify(meals));
      await AsyncStorage.setItem('mealPresets', JSON.stringify(mealPresets));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Add a new cat
  const addCat = () => {
    if (newCatName.trim() === '') {
      Alert.alert('Error', 'Please enter a cat name');
      return;
    }
    
    const newCat = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      created: new Date()
    };
    
    setCats([...cats, newCat]);
    setNewCatName('');
    setAddCatModalVisible(false);
  };

  // Add a new meal
  const addMeal = () => {
    if (!selectedCat) {
      Alert.alert('Error', 'Please select a cat');
      return;
    }
    
    if (mealAmount.trim() === '') {
      Alert.alert('Error', 'Please enter meal amount');
      return;
    }
    
    const newMeal = {
      id: Date.now().toString(),
      catId: selectedCat.id,
      type: mealType,
      amount: mealAmount,
      notes: mealNotes,
      date: mealDate,
    };
    
    setMeals([...meals, newMeal]);
    resetMealForm();
    setAddMealModalVisible(false);
  };

  // Reset meal form values
  const resetMealForm = () => {
    setMealType('Wet Food');
    setMealAmount('');
    setMealNotes('');
    setMealDate(new Date());
  };

  // Handle cat selection
  const handleSelectCat = (cat) => {
    setSelectedCat(cat.id === selectedCat?.id ? null : cat);
  };

  // Delete a meal record
  const deleteMeal = (mealId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this meal record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setMeals(meals.filter(meal => meal.id !== mealId));
          }
        }
      ]
    );
  };

  // Format date for display
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Get meals for selected cat
  const getCatMeals = () => {
    if (!selectedCat) return [];
    return meals
      .filter(meal => meal.catId === selectedCat.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get statistics for selected cat
  const getCatStats = () => {
    if (!selectedCat) return null;
    
    const catMeals = meals.filter(meal => meal.catId === selectedCat.id);
    
    if (catMeals.length === 0) return null;
    
    // Get meals from last 7 days
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentMeals = catMeals.filter(meal => new Date(meal.date) >= oneWeekAgo);
    
    // Count meal types
    const mealTypes = {};
    catMeals.forEach(meal => {
      mealTypes[meal.type] = (mealTypes[meal.type] || 0) + 1;
    });
    
    return {
      totalMeals: catMeals.length,
      recentMeals: recentMeals.length,
      lastMeal: catMeals.sort((a, b) => new Date(b.date) - new Date(a.date))[0],
      mealTypes
    };
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setMealDate(selectedDate);
    }
  };
  
  // Render cat list item
  const renderCatItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.catItem,
        selectedCat?.id === item.id && styles.selectedCatItem
      ]}
      onPress={() => handleSelectCat(item)}
    >
      <Ionicons name="paw" size={20} color={selectedCat?.id === item.id ? "#fff" : "#666"} />
      <Text style={[styles.catName, selectedCat?.id === item.id && styles.selectedCatName]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render meal list item
  const renderMealItem = ({ item }) => (
    <View style={styles.mealItem}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTypeContainer}>
          <Ionicons 
            name={item.type === 'Wet Food' ? 'water' : item.type === 'Dry Food' ? 'apps' : 'fast-food'} 
            size={18} 
            color="#666" 
          />
          <Text style={styles.mealType}>{item.type}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteMeal(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
      <View style={styles.mealDetails}>
        <Text style={styles.mealAmount}>{item.amount}</Text>
        <Text style={styles.mealDate}>{formatDate(item.date)}</Text>
      </View>
      {item.notes ? <Text style={styles.mealNotes}>{item.notes}</Text> : null}
    </View>
  );

  const addMealPreset = () => {
    if (newPreset.trim() === '') {
      Alert.alert('Error', 'Please enter a preset amount');
      return;
    }
    
    if (mealPresets.includes(newPreset.trim())) {
      Alert.alert('Error', 'This preset already exists');
      return;
    }
    
    setMealPresets([...mealPresets, newPreset.trim()]);
    setNewPreset('');
  };
  
  const removeMealPreset = (preset) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete the preset "${preset}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setMealPresets(mealPresets.filter(item => item !== preset));
          }
        }
      ]
    );
  };

  // Authentication Modal
  const renderAuthModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!user}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Sign In to Track Cat Meals</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={signIn}
            >
              <Text style={styles.confirmButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={signUp}
            >
              <Text style={styles.cancelButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
          <Modal visible={visible} transparent animationType="slide">

<View style={styles.modalOverlay}>

  <View style={styles.modalContainer}>

    <Text style={styles.modalTitle}>{signUpMode ? 'Sign Up' : 'Sign In'}</Text>

    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />

    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

    <Text style={styles.errorText}>{error}</Text> {/* Display error */}

    <TouchableOpacity style={styles.button} onPress={() => handleAuth(signUpMode ? 'signup' : 'signin')}>

      <Text style={styles.buttonText}>{signUpMode ? 'Sign Up' : 'Sign In'}</Text>

    </TouchableOpacity>

    <TouchableOpacity onPress={() => setSignUpMode(!signUpMode)}>

      <Text>{signUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</Text>

    </TouchableOpacity>

  </View>

</View>

</Modal>



      {/* Centered Header */}
      <View style={styles.centeredHeader}>
        <Text style={styles.title}>Cat Meal Tracker</Text>
      </View>
      
      {/* Cat List */}
      {cats.length > 0 ? (
        <View style={styles.catsContainer}>
          <Text style={styles.sectionTitle}>My Cats</Text>
          <FlatList
            horizontal
            data={cats}
            renderItem={renderCatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.catList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.emptyCatsContainer}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/splash.png' }}
            style={styles.placeholderImage}
          />
          <Text style={styles.emptyCatsText}>No cats added yet.</Text>
          <Text style={styles.emptyCatsSubtext}>Add your first cat to start tracking meals!</Text>
        </View>
      )}
      
      {/* Meal List or Stats */}
      {selectedCat && (
        <View style={styles.mealsContainer}>
          <View style={styles.mealsHeader}>
            <Text style={styles.sectionTitle}>
              {statsView ? `${selectedCat.name}'s Stats` : `${selectedCat.name}'s Meals`}
            </Text>
            <TouchableOpacity onPress={() => setStatsView(!statsView)}>
              <Text style={styles.toggleViewText}>
                {statsView ? 'View Meals' : 'View Stats'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {statsView ? (
            // Stats View (unchanged)
            <ScrollView style={styles.statsContainer}>
              {getCatStats() ? (
                <>
                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Total Meals Tracked</Text>
                    <Text style={styles.statValue}>{getCatStats().totalMeals}</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Meals (Last 7 Days)</Text>
                    <Text style={styles.statValue}>{getCatStats().recentMeals}</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Most Recent Meal</Text>
                    <Text style={styles.statType}>{getCatStats().lastMeal.type}</Text>
                    <Text style={styles.statAmount}>{getCatStats().lastMeal.amount}</Text>
                    <Text style={styles.statDate}>{formatDate(getCatStats().lastMeal.date)}</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Meal Type Breakdown</Text>
                    {Object.entries(getCatStats().mealTypes).map(([type, count]) => (
                      <View key={type} style={styles.mealTypeRow}>
                        <Text style={styles.mealTypeName}>{type}</Text>
                        <Text style={styles.mealTypeCount}>{count} meals</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.emptyMealsText}>No meal data available for stats.</Text>
              )}
            </ScrollView>
          ) : (
            // Meals View (unchanged)
            getCatMeals().length > 0 ? (
              <FlatList
                data={getCatMeals()}
                renderItem={renderMealItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.mealList}
              />
            ) : (
              <View style={styles.emptyMealsContainer}>
                <Ionicons name="fast-food-outline" size={60} color="#ddd" />
                <Text style={styles.emptyMealsText}>No meals recorded yet.</Text>
                <TouchableOpacity 
                  style={styles.emptyMealsButton} 
                  onPress={() => setAddMealModalVisible(true)}
                >
                  <Text style={styles.emptyMealsButtonText}>Add First Meal</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      )}
      
      {/* Bottom Buttons Container */}
      <View style={styles.bottomButtonsContainer}>
        {cats.length > 0 && (
          <TouchableOpacity 
            style={styles.bottomButton} 
            onPress={() => setAddMealModalVisible(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Add Meal</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.bottomButton} 
          onPress={() => setAddCatModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.bottomButtonText}>Add Cat</Text>
        </TouchableOpacity>
      </View>
  
      {/* Add Cat Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={addCatModalVisible}
              onRequestClose={() => setAddCatModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Add New Cat</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Cat Name"
                    value={newCatName}
                    onChangeText={setNewCatName}
                    autoFocus
                  />
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setNewCatName('');
                        setAddCatModalVisible(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={addCat}
                    >
                      <Text style={styles.confirmButtonText}>Add Cat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
      
      {/* Add Meal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addMealModalVisible}
        onRequestClose={() => setAddMealModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Meal</Text>
            
            {/* Cat Selection Dropdown (if no cat is already selected) */}
            {!selectedCat && (
              <View style={styles.selectContainer}>
                <Text style={styles.selectLabel}>Select Cat:</Text>
                <ScrollView style={styles.catDropdown}>
                  {cats.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.catDropdownItem}
                      onPress={() => setSelectedCat(cat)}
                    >
                      <Text style={styles.catDropdownText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Meal Type Selection */}
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Meal Type:</Text>
              <View style={styles.mealTypeButtons}>
                {['Wet Food', 'Dry Food', 'Treats'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeButton,
                      mealType === type && styles.mealTypeButtonSelected
                    ]}
                    onPress={() => setMealType(type)}
                  >
                    <Text style={[
                      styles.mealTypeButtonText,
                      mealType === type && styles.mealTypeButtonTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.selectContainer}>
  <Text style={styles.selectLabel}>Preset Amounts:</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsContainer}>
    {mealPresets.map((preset, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.presetButton,
          mealAmount === preset && styles.presetButtonSelected
        ]}
        onPress={() => setMealAmount(preset)}
      >
        <Text style={[
          styles.presetButtonText,
          mealAmount === preset && styles.presetButtonTextSelected
        ]}>
          {preset}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>


            {/* Meal Amount */}
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g. 1/4 cup, 1 can, 10g)"
              value={mealAmount}
              onChangeText={setMealAmount}
            />
            
            {/* Meal Date/Time */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.datePickerButtonText}>
                {formatDate(mealDate)}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={mealDate}
                mode="datetime"
                is24Hour={true}
                display="default"
                onChange={onDateChange}
              />
            )}
            
            {/* Meal Notes */}
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              value={mealNotes}
              onChangeText={setMealNotes}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetMealForm();
                  setAddMealModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addMeal}
              >
                <Text style={styles.confirmButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Authentication Modal */}
      {renderAuthModal()}

      {/* Invite Partner Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Invite Partner</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Partner's Email"
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              keyboardType="email-address"
            />
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={invitePartner}
            >
              <Text style={styles.confirmButtonText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5e72e4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  
  // Cats Section
  catsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  catList: {
    paddingVertical: 5,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedCatItem: {
    backgroundColor: '#5e72e4',
  },
  catName: {
    marginLeft: 5,
    fontWeight: '500',
    color: '#444',
  },
  selectedCatName: {
    color: '#fff',
  },
  emptyCatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyCatsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptyCatsSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  
  // Meals Section
  mealsContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleViewText: {
    color: '#5e72e4',
    fontWeight: '600',
  },
  mealList: {
    paddingBottom: 20,
  },
  mealItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealType: {
    fontWeight: '600',
    color: '#666',
    marginLeft: 5,
  },
  mealDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  mealAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  mealDate: {
    fontSize: 12,
    color: '#999',
  },
  mealNotes: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
  emptyMealsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMealsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyMealsButton: {
    backgroundColor: '#5e72e4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyMealsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Stats View
  statsContainer: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e72e4',
  },
  statType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '500',
    color: '#444',
    marginTop: 5,
  },
  statDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealTypeName: {
    fontSize: 14,
    color: '#666',
  },
  mealTypeCount: {
    fontSize: 14,
    color: '#5e72e4',
    fontWeight: '500',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#444',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f7f8fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f7f8fa',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#5e72e4',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Select Components
  selectContainer: {
    marginBottom: 15,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  catDropdown: {
    maxHeight: 150,
    backgroundColor: '#f7f8fa',
    borderRadius: 10,
  },
  catDropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  catDropdownText: {
    fontSize: 16,
    color: '#444',
  },
  mealTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  mealTypeButtonSelected: {
    backgroundColor: '#5e72e4',
  },
  mealTypeButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  mealTypeButtonTextSelected: {
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  datePickerButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#444',
  },
  presetsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  presetButton: {
    backgroundColor: '#f7f8fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  presetButtonSelected: {
    backgroundColor: '#5e72e4',
  },
  presetButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  presetButtonTextSelected: {
    color: '#fff',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  presetText: {
    fontSize: 16,
    color: '#444',
  },
  addPresetContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  presetInput: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  addPresetButton: {
    backgroundColor: '#5e72e4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPresetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centeredHeader: {
    paddingTop:40,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  
  // Bottom buttons container
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#007bff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Bottom button styles
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0056b3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  
  bottomButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  
  // Adjust container to allow space for bottom buttons
  container: {
    flex: 1,
    paddingBottom: 60, // Space for bottom buttons
  },
});