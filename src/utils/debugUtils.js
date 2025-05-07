/**
 * Debug utilities to help diagnose Firebase and program loading issues
 */

// Helper to visualize the structure of an object for debugging
export const inspectObject = (obj, label = 'Object') => {
  try {
    console.log(`=== ${label} Structure ===`);
    if (!obj) {
      console.log('Object is null or undefined');
      return;
    }
    
    if (typeof obj !== 'object') {
      console.log(`Not an object. Type: ${typeof obj}, Value:`, obj);
      return;
    }
    
    // Print keys
    console.log('Keys:', Object.keys(obj));
    
    // Print first level values with type info
    Object.entries(obj).forEach(([key, value]) => {
      const type = typeof value;
      const valuePreview = type === 'object' 
        ? (value === null 
            ? 'null' 
            : Array.isArray(value) 
              ? `Array(${value.length})` 
              : `Object with keys: ${Object.keys(value).join(', ')}`)
        : type === 'function' 
          ? 'function' 
          : String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '');
      
      console.log(`- ${key} (${type}): ${valuePreview}`);
    });
    
    console.log(`=== End ${label} ===`);
  } catch (error) {
    console.error('Error in inspectObject:', error);
  }
};

// Function to diagnose Firebase Firestore issues
export const diagnoseFirestore = async (firestore) => {
  try {
    console.log('=== Firestore Diagnostics ===');
    if (!firestore) {
      console.log('Firestore is null or undefined!');
      return;
    }
    
    // Check if Firestore instance has expected methods/properties
    const firestoreKeys = Object.keys(firestore);
    console.log('Firestore has these properties:', firestoreKeys);
    
    // Check app connection
    if (firestore._app) {
      console.log('Firestore is connected to Firebase app:', firestore._app.name);
    } else {
      console.log('Firestore is not connected to a Firebase app!');
    }
    
    // Check if settings are applied
    if (firestore._settings) {
      console.log('Firestore settings:', firestore._settings);
    } else {
      console.log('No Firestore settings found');
    }
    
    console.log('=== End Firestore Diagnostics ===');
  } catch (error) {
    console.error('Error in diagnoseFirestore:', error);
  }
};

// Function to check program data integrity
export const validateProgram = (program) => {
  try {
    console.log('=== Program Validation ===');
    if (!program) {
      console.log('Program is null or undefined!');
      return false;
    }
    
    const requiredFields = ['id', 'title', 'description', 'difficulty', 'duration', 'weeklySchedule'];
    const missingFields = requiredFields.filter(field => !program[field]);
    
    if (missingFields.length > 0) {
      console.log('Program is missing required fields:', missingFields);
      return false;
    }
    
    // Check weeklySchedule
    try {
      const schedule = typeof program.weeklySchedule === 'string' 
        ? JSON.parse(program.weeklySchedule) 
        : program.weeklySchedule;
        
      if (!Array.isArray(schedule)) {
        console.log('weeklySchedule is not an array:', schedule);
        return false;
      }
      
      if (schedule.length === 0) {
        console.log('weeklySchedule is empty');
        return false;
      }
      
      // Validate first week structure
      const firstWeek = schedule[0];
      if (!firstWeek.workouts || !Array.isArray(firstWeek.workouts) || firstWeek.workouts.length === 0) {
        console.log('First week has invalid or empty workouts array:', firstWeek);
        return false;
      }
      
      console.log(`Program looks valid: ${program.title}`);
      console.log(`- ${schedule.length} weeks`);
      console.log(`- ${schedule.reduce((total, week) => total + week.workouts.length, 0)} total workouts`);
    } catch (error) {
      console.error('Error validating weeklySchedule:', error);
      return false;
    }
    
    console.log('=== End Program Validation ===');
    return true;
  } catch (error) {
    console.error('Error in validateProgram:', error);
    return false;
  }
}; 