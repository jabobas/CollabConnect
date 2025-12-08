/*
  author: Lucas Matheson
  edited by: Lucas Matheson
  date: December 7th, 2025
  description: Utility functions to manage favorite researchers using localStorage
*/
const favoritesKey = 'favoriteResearchers';

export const getFavorites = () => {
  try {
    const favorites = localStorage.getItem(favoritesKey);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
    return [];
  }
};


export const addFavorite = (personId) => {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(personId)) {
      favorites.push(personId);
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }
    return favorites;
  } catch (error) {
    console.error('Error adding favorite to localStorage:', error);
    return getFavorites();
  }
};

export const removeFavorite = (personId) => {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter(id => id !== personId);
    localStorage.setItem(favoritesKey, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error removing favorite from localStorage:', error);
    return getFavorites();
  }
};


export const toggleFavorite = (personId) => {
  const favorites = getFavorites();
  const isFavorited = favorites.includes(personId);
  
  if (isFavorited) {
    removeFavorite(personId);
    return false;
  } else {
    addFavorite(personId);
    return true;
  }
};


export const isFavorite = (personId) => {
  const favorites = getFavorites();
  return favorites.includes(personId);
};


export const clearFavorites = () => {
  try {
    localStorage.removeItem(favoritesKey);
    return [];
  } catch (error) {
    console.error('Error clearing favorites from localStorage:', error);
    return [];
  }
};
