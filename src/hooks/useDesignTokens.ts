import { tokens } from '../../design-system/tokens';

/**
 * Hook para acessar design tokens de forma consistente
 * @returns Objeto com tokens de design
 */
export const useDesignTokens = () => {
  return {
    colors: tokens.colors,
    typography: tokens.typography,
    chartColors: {
      primary: tokens.colors.primary.DEFAULT,    // Navy
      secondary: tokens.colors.secondary.DEFAULT, // Teal
      success: tokens.colors.success.DEFAULT,     // Green
      warning: tokens.colors.warning.DEFAULT,     // Yellow
      destructive: tokens.colors.destructive.DEFAULT, // Red
    },
    badgeColors: {
      success: {
        bg: tokens.colors.success[100],
        text: tokens.colors.success[800],
        hover: tokens.colors.success[100],
      },
      warning: {
        bg: tokens.colors.warning[100],
        text: tokens.colors.warning[800],
        hover: tokens.colors.warning[100],
      },
      destructive: {
        bg: tokens.colors.destructive[100],
        text: tokens.colors.destructive[800],
        hover: tokens.colors.destructive[100],
      },
      info: {
        bg: tokens.colors.primary[100],
        text: tokens.colors.primary[800],
        hover: tokens.colors.primary[100],
      },
      neutral: {
        bg: tokens.colors.neutral[100],
        text: tokens.colors.neutral[800],
        hover: tokens.colors.neutral[100],
      },
    },
    iconColors: {
      primary: tokens.colors.primary[600],
      secondary: tokens.colors.secondary[600],
      success: tokens.colors.success[600],
      warning: tokens.colors.warning[600],
      destructive: tokens.colors.destructive[600],
    },
  };
};
