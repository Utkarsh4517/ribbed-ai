import { Avatar } from "../services/api";

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
    InfluencerScreen: { avatar: Avatar };
    SceneScreen: undefined;
    ScriptScreen: undefined;
    QueueScreen: undefined;
  };
  