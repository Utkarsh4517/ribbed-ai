import { Avatar, Scene } from "../services/api";

export type RootStackParamList = {
    Onboarding: undefined;
    AuthNavigator: undefined;
    Main: undefined;
  };
  
  export type AuthStackParamList = {
    Auth: undefined;
  };
  
  export type MainStackParamList = {
    Home: undefined;
    InfluencerScreen: { 
      avatar: Avatar; 
      preloadedScenes?: Scene[]; 
      isPublicAvatar?: boolean; 
    };
    SceneScreen: undefined;
    ScriptScreen: { scene: Scene };
    QueueScreen: { scene: Scene; audioUrl: string };
    ProfileScreen: undefined;
  };
  