import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, 
  View, 
  Animated, 
  StatusBar
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import WhiteButton from '../components/WhiteButton';
import { HapticsService } from '../utils/haptics';


interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to Ribbed AI",
    description: "Create stunning AI avatars and bring them to life with custom voices and scenes.",
  },
  {
    id: 2,
    title: "Design Your Avatar",
    description: "Use AI to generate unique avatars that represent your brand or personality perfectly.",
  },
  {
    id: 3,
    title: "Create Custom Scenes",
    description: "Build reusable backgrounds and environments for your avatar to perform in.",
  },
  {
    id: 4,
    title: "Write Your Script",
    description: "Craft engaging audio scripts with custom voices that match your avatar's personality.",
  },
  {
    id: 5,
    title: "Generate TikTok Videos",
    description: "Combine everything into viral-ready UGC videos perfect for social media.",
  }
];

const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAppContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / onboardingSteps.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (isAnimating) return;
    HapticsService.light();
    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        slideAnim.setValue(30);
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start(() => {
            setIsAnimating(false);
          });
        }, 50);
      } else {
        HapticsService.success();
        completeOnboarding();
      }
    });
  };

  const currentStepData = onboardingSteps[currentStep];
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF5555" />
      <SafeAreaView className="flex-1 bg-[#FF5555]">
        <View className="flex-1">
          <View className="px-6 pt-4 pb-8">
            
            
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <Animated.View 
                className="h-full bg-white rounded-full"
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }}
              />
            </View>
          </View>

          <Animated.View 
            className="flex-1 justify-center items-center px-8"
            style={{
              opacity: fadeAnim,
              transform: [
                { 
                  translateY: slideAnim 
                },
                {
                  scale: scaleAnim
                }
              ]
            }}
          >
            <Text className="text-white text-3xl font-sfpro-semibold text-center mb-6 leading-tight">
              {currentStepData.title}
            </Text>

            <Text className="text-white/90 text-lg text-center leading-relaxed mb-12 px-4 font-sfpro-regular">
              {currentStepData.description}
            </Text>
          </Animated.View>

          <View className="px-8 pb-8">
            <WhiteButton
              title={currentStep === onboardingSteps.length - 1 ? "Get Started" : "Continue"}
              onPress={handleNext}
              disabled={isAnimating}
            >

            </WhiteButton>
           

           
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default OnboardingScreen;
