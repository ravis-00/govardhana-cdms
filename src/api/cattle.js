// src/api/cattle.js
import { 
  getCattle, 
  addCattle as addCattleApi, 
  getUnregisteredBirths as getBirthsApi // Import the new function
} from './masterApi';

// Export the existing fetch function
export const fetchCattle = getCattle;

// Export the new function so the Registration Page can use it
export const getUnregisteredBirths = getBirthsApi;

// Wrapper for adding cattle
export async function addCattle(cattle) {
  // Call the master API
  const response = await addCattleApi(cattle);
  
  // Return the FULL response object (id + message)
  return response; 
}