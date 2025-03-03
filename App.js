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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Main App Component
export default function App() {
  const [cats, setCats] = useState([]);
  const [meals, setMeals] = useState([]);
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

  // Load data from AsyncStorage
  const loadData = async () => {
    try {
      const storedCats = await AsyncStorage.getItem('cats');
      const storedMeals = await AsyncStorage.getItem('meals');
      
      if (storedCats) setCats(JSON.parse(storedCats));
      if (storedMeals) setMeals(JSON.parse(storedMeals));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save data to AsyncStorage
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('cats', JSON.stringify(cats));
      await AsyncStorage.setItem('meals', JSON.stringify(meals));
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cat Meal Tracker</Text>
        <View style={styles.headerButtons}>
          {cats.length > 0 && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setAddMealModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Meal</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setAddCatModalVisible(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Cat</Text>
          </TouchableOpacity>
        </View>
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
            // Stats View
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
            // Meals View
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
});