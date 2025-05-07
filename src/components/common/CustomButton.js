import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * CustomButton - A reusable button component with customizable styles
 * 
 * @param {string} title - Button text
 * @param {function} onPress - Function to call when button is pressed
 * @param {string} icon - FontAwesome5 icon name (optional)
 * @param {string} color - Button background color (optional)
 * @param {Object} style - Additional style for the button (optional)
 * @param {Object} textStyle - Additional style for the button text (optional)
 * @param {boolean} disabled - Whether the button is disabled (optional)
 * @returns {JSX.Element} - Button component
 */
const CustomButton = ({ 
  title, 
  onPress, 
  icon, 
  color = '#4CAF50', 
  style, 
  textStyle,
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor: color },
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <FontAwesome5 name={icon} size={16} color="white" style={styles.icon} />}
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default CustomButton; 