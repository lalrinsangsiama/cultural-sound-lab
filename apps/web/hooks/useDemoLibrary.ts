import { useState, useCallback, useEffect } from 'react';
import { 
  demoLibraryService, 
  DemoLibraryData, 
  DemoCategory, 
  DemoSubcategory, 
  CaseStudy 
} from '@/lib/services/demo-library';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export function useDemoLibrary() {
  const [metadata, setMetadata] = useState<DemoLibraryData | null>(null);
  const [metadataState, setMetadataState] = useState<LoadingState>({ isLoading: false, error: null });
  
  const [categoriesState, setCategoriesState] = useState<LoadingState>({ isLoading: false, error: null });
  const [caseStudiesState, setCaseStudiesState] = useState<LoadingState>({ isLoading: false, error: null });
  const [downloadState, setDownloadState] = useState<LoadingState>({ isLoading: false, error: null });
  const [generateState, setGenerateState] = useState<LoadingState>({ isLoading: false, error: null });
  const [favoritesState, setFavoritesState] = useState<LoadingState>({ isLoading: false, error: null });

  const loadMetadata = useCallback(async () => {
    setMetadataState({ isLoading: true, error: null });
    try {
      const data = await demoLibraryService.getMetadata();
      setMetadata(data);
      setMetadataState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load metadata';
      setMetadataState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const getCategories = useCallback(async (): Promise<Record<string, DemoCategory>> => {
    setCategoriesState({ isLoading: true, error: null });
    try {
      const categories = await demoLibraryService.getCategories();
      setCategoriesState({ isLoading: false, error: null });
      return categories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
      setCategoriesState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const getCaseStudies = useCallback(async (): Promise<CaseStudy[]> => {
    setCaseStudiesState({ isLoading: true, error: null });
    try {
      const caseStudies = await demoLibraryService.getCaseStudies();
      setCaseStudiesState({ isLoading: false, error: null });
      return caseStudies;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load case studies';
      setCaseStudiesState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const getDemosByCategory = useCallback(async (categoryId: string, subcategoryId?: string): Promise<DemoSubcategory | null> => {
    setCategoriesState({ isLoading: true, error: null });
    try {
      const demos = await demoLibraryService.getDemosByCategory(categoryId, subcategoryId);
      setCategoriesState({ isLoading: false, error: null });
      return demos;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load demos';
      setCategoriesState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const downloadDemo = useCallback(async (demoId: string, file: string): Promise<void> => {
    setDownloadState({ isLoading: true, error: null });
    try {
      await demoLibraryService.downloadDemo(demoId, file);
      setDownloadState({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download demo';
      setDownloadState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const generateSimilar = useCallback(async (demoId: string) => {
    setGenerateState({ isLoading: true, error: null });
    try {
      const result = await demoLibraryService.generateSimilar(demoId);
      setGenerateState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate similar track';
      setGenerateState({ isLoading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const addToFavorites = useCallback(async (demoId: string): Promise<boolean> => {
    setFavoritesState({ isLoading: true, error: null });
    try {
      const result = await demoLibraryService.addToFavorites(demoId);
      setFavoritesState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to favorites';
      setFavoritesState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  const removeFromFavorites = useCallback(async (demoId: string): Promise<boolean> => {
    setFavoritesState({ isLoading: true, error: null });
    try {
      const result = await demoLibraryService.removeFromFavorites(demoId);
      setFavoritesState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from favorites';
      setFavoritesState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  const getFavorites = useCallback(async (): Promise<string[]> => {
    setFavoritesState({ isLoading: true, error: null });
    try {
      const favorites = await demoLibraryService.getFavorites();
      setFavoritesState({ isLoading: false, error: null });
      return favorites;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load favorites';
      setFavoritesState({ isLoading: false, error: errorMessage });
      return [];
    }
  }, []);

  // Auto-load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return {
    // Data
    metadata,
    
    // Actions
    loadMetadata,
    getCategories,
    getCaseStudies,
    getDemosByCategory,
    downloadDemo,
    generateSimilar,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    
    // Loading states
    isLoadingMetadata: metadataState.isLoading,
    isLoadingCategories: categoriesState.isLoading,
    isLoadingCaseStudies: caseStudiesState.isLoading,
    isDownloading: downloadState.isLoading,
    isGenerating: generateState.isLoading,
    isLoadingFavorites: favoritesState.isLoading,
    
    // Error states
    metadataError: metadataState.error,
    categoriesError: categoriesState.error,
    caseStudiesError: caseStudiesState.error,
    downloadError: downloadState.error,
    generateError: generateState.error,
    favoritesError: favoritesState.error,
    
    // Utility methods
    getAudioUrl: demoLibraryService.getAudioUrl.bind(demoLibraryService),
    trackPlayback: demoLibraryService.trackPlayback.bind(demoLibraryService),
  };
}