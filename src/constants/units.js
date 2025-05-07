/**
 * Constants for measurement units
 */

// Unit system types
export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial'
};

// Specific unit types
export const UNITS = {
  // Distance units
  DISTANCE: {
    KM: 'km',
    MILES: 'mi',
    METERS: 'm'
  },
  
  // Weight units
  WEIGHT: {
    KG: 'kg',
    LBS: 'lbs'
  },
  
  // Height units
  HEIGHT: {
    CM: 'cm',
    FEET_INCHES: 'ft_in'
  },
  
  // Speed units
  SPEED: {
    KMH: 'km/h',
    MPH: 'mph',
    PACE_MIN_KM: 'min/km',
    PACE_MIN_MILE: 'min/mi'
  },
  
  // Calorie units
  ENERGY: {
    KCAL: 'kcal',
    KJ: 'kJ'
  },
  
  // Volume units
  VOLUME: {
    LITERS: 'L',
    FL_OZ: 'fl oz'
  }
};

// Default unit preferences
export const DEFAULT_UNITS = {
  unitSystem: UNIT_SYSTEMS.METRIC,
  distanceUnit: UNITS.DISTANCE.KM,
  weightUnit: UNITS.WEIGHT.KG,
  heightUnit: UNITS.HEIGHT.CM,
  speedUnit: UNITS.SPEED.KMH,
  paceUnit: UNITS.SPEED.PACE_MIN_KM,
  energyUnit: UNITS.ENERGY.KCAL,
  volumeUnit: UNITS.VOLUME.LITERS
};

// Conversion factors
export const CONVERSION_FACTORS = {
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
  KG_TO_LBS: 2.20462,
  LBS_TO_KG: 0.453592,
  CM_TO_INCHES: 0.393701,
  INCHES_TO_CM: 2.54,
  KCAL_TO_KJ: 4.184,
  KJ_TO_KCAL: 0.239,
  LITER_TO_FL_OZ: 33.814,
  FL_OZ_TO_LITER: 0.0295735
};

/**
 * Convert a value between unit systems
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The unit to convert from
 * @param {string} toUnit - The unit to convert to
 * @returns {number} - The converted value
 */
export const convertUnits = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  switch (`${fromUnit}_TO_${toUnit}`) {
    case `${UNITS.DISTANCE.KM}_TO_${UNITS.DISTANCE.MILES}`:
      return value * CONVERSION_FACTORS.KM_TO_MILES;
    case `${UNITS.DISTANCE.MILES}_TO_${UNITS.DISTANCE.KM}`:
      return value * CONVERSION_FACTORS.MILES_TO_KM;
    case `${UNITS.WEIGHT.KG}_TO_${UNITS.WEIGHT.LBS}`:
      return value * CONVERSION_FACTORS.KG_TO_LBS;
    case `${UNITS.WEIGHT.LBS}_TO_${UNITS.WEIGHT.KG}`:
      return value * CONVERSION_FACTORS.LBS_TO_KG;
    case `${UNITS.HEIGHT.CM}_TO_${UNITS.HEIGHT.FEET_INCHES}`:
      const inches = value * CONVERSION_FACTORS.CM_TO_INCHES;
      const feet = Math.floor(inches / 12);
      const remainingInches = Math.round(inches % 12);
      return { feet, inches: remainingInches };
    case `${UNITS.ENERGY.KCAL}_TO_${UNITS.ENERGY.KJ}`:
      return value * CONVERSION_FACTORS.KCAL_TO_KJ;
    case `${UNITS.ENERGY.KJ}_TO_${UNITS.ENERGY.KCAL}`:
      return value * CONVERSION_FACTORS.KJ_TO_KCAL;
    default:
      console.warn(`Unsupported unit conversion: ${fromUnit} to ${toUnit}`);
      return value;
  }
}; 