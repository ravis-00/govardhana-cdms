import { getCattle, addCattle as addCattleApi } from './masterApi';

export const fetchCattle = getCattle;

export async function addCattle(cattle) {
  // Call the master API
  const response = await addCattleApi(cattle);
  
  // FIXED: Return the FULL response object (id + message), not just id.
  // This allows the UI to show the real server status.
  return response; 
}