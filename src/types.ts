export type Gender = 'male' | 'female' | 'nonbinary';

export type BodyShape = 'regular' | 'athletic' | 'curvy' | 'muscular' | 'plus' | 'slim';

export interface AvatarParameters {
  age: number; // 0.1 to 100
  gender: Gender;
  bodyShape: BodyShape;
  skinTone: string; // Hex color code
  height: number; // in cm, default is estimated from age and gender, customizable from 40 to 220
  weight: number; // in kg, estimated, customizable from 3 to 150
}

export type ClothingType = 'top' | 'bottom' | 'dress' | 'outerwear';

export interface ClothingItem {
  id: string;
  name: string;
  type: ClothingType;
  imageUrl: string;
  sourceUrl?: string;
  description?: string;
  styleTags?: string[];
  primaryColor?: string;
  fitAdvice?: string;
  
  // DYNAMIC_GARMENT_MAPPING properties
  secondaryColors?: string[];
  pantoneMatch?: string;
  fabricType?: string;
  weavePattern?: string;
  surfaceFinish?: string;
  sheenLevel?: number;
  weightClass?: string;
  stretchFactor?: string;
  neckline?: string;
  sleeveStyle?: string;
  fitType?: string;
  patternType?: string;
  patternScale?: string;
  embellishments?: string[];
}

export interface TryOnResult {
  id: string;
  avatar: AvatarParameters;
  clothing: ClothingItem;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  result2DUrl?: string; // High-res completed try-on composited image
  stylingAdvice?: {
    stylingScore: number;
    fitRating: string; // Tight, Perfect, Loose
    sizeRecommendation: string;
    description: string;
    complimentaryItems: string[];
  };
}

export interface ScrapedProduct {
  name: string;
  imageUrl: string;
  description: string;
  price?: string;
  sourceUrl: string;
  type: ClothingType;
}

export interface SavedTryOn {
  id: string;
  timestamp: string;
  avatar: AvatarParameters;
  clothing: ClothingItem;
  imageUrl: string;
  score: number;
}
