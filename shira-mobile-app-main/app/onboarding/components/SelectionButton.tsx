import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  Animated, 
  View 
} from 'react-native';
import { colors } from '../styles';

interface SelectionButtonProps {
  title: string;
  description?: string;
  onPress: () => void;
  selected: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  comingSoon?: boolean;
}

const SelectionButton: React.FC<SelectionButtonProps> = ({
  title,
  description,
  onPress,
  selected,
  disabled = false,
  icon,
  style,
  comingSoon = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        selected && styles.buttonSelected,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || comingSoon}
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.title,
              selected && styles.titleSelected,
              disabled && styles.textDisabled,
            ]}
          >
            {title}
          </Text>
          {description && (
            <Text 
              style={[
                styles.description,
                selected && styles.descriptionSelected,
                disabled && styles.textDisabled,
              ]}
            >
              {description}
            </Text>
          )}
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <View style={styles.checkmarkInner} />
          </View>
        )}
      </View>
      {comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.selectionBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.selectionBorder,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    width: '100%',
    position: 'relative', // For "coming soon" badge
  },
  buttonSelected: {
    backgroundColor: colors.selectionActive,
    borderColor: colors.selectionActiveBorder,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  titleSelected: {
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.subText,
    lineHeight: 18,
  },
  descriptionSelected: {
    color: colors.text,
  },
  textDisabled: {
    color: colors.mutedText,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
  },
  comingSoonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SelectionButton; 