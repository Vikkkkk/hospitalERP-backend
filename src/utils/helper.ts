// backend-api/src/utils/helper.ts

// Generate a random alphanumeric token
export const generateToken = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  };
  
  // Convert a date to a readable format (YYYY-MM-DD)
  export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Validate if a value is a valid number
  export const isValidNumber = (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };
  