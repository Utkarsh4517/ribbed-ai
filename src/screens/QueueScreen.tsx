import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  ScrollView, 
  Alert,
  StatusBar,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Linking
} from 'react-native';
import { RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, VideoJob } from '../services/api';
import { socketService, VideoStatusUpdate } from '../services/socketService';
import WhiteButton from '../components/WhiteButton';
import { HapticsService } from '../utils/haptics';
import Video from 'react-native-video';
// @ts-ignore
import RNFS from 'react-native-fs';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const videoWidth = screenWidth - 64; // Account for padding
const videoHeight = screenHeight - 200;

type QueueScreenNavigationProp = StackNavigationProp<MainStackParamList, 'QueueScreen'>;
type QueueScreenRouteProp = RouteProp<MainStackParamList, 'QueueScreen'>;

interface QueueScreenProps {
  route: QueueScreenRouteProp;
}

export default function QueueScreen({ route }: QueueScreenProps) {
  const navigation = useNavigation<QueueScreenNavigationProp>();
  const { scene, audioUrl } = route.params;

  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [userJobs, setUserJobs] = useState<VideoJob[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('fadeAnim', fadeAnim);
    console.log('slideAnim', slideAnim);
    console.log('progressAnim', progressAnim);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to download videos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const downloadVideo = async (videoUrl: string, jobId: string) => {
    try {
      setIsDownloading(true);
      
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is required to download videos.');
        return;
      }

      const fileName = `ribbed_video_${jobId}_${Date.now()}.mp4`;
      const downloadPath = Platform.OS === 'ios' 
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: videoUrl,
        toFile: downloadPath,
        background: true,
        discretionary: true,
        progress: (res) => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress: ${progressPercent.toFixed(2)}%`);
        }
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          'Download Complete',
          `Video saved to ${Platform.OS === 'ios' ? 'Files app' : 'Downloads folder'}`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download the video. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const openVideoInBrowser = async (videoUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
        HapticsService.light();
      } else {
        Alert.alert('Error', 'Unable to open video URL in browser.');
      }
    } catch (error) {
      console.error('Error opening video URL:', error);
      Alert.alert('Error', 'Failed to open video in browser.');
    }
  };

  const loadUserJobs = async () => {
    try {
      const response = await apiService.getUserVideoJobs();
      if (response.success) {
        setUserJobs(response.jobs.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading user jobs:', error);
    }
  };

  const handleVideoStatusUpdate = useCallback((update: VideoStatusUpdate) => {
    console.log('Queue received video update:', update);
    
    if (currentJob && update.jobId === currentJob.id) {
      setCurrentJob(prev => prev ? {
        ...prev,
        status: update.status,
        videoUrl: update.videoUrl || prev.videoUrl,
        duration: update.duration || prev.duration,
        error: update.error || prev.error
      } : null);

      setStatusMessage(update.message || '');
      setProgress(update.progress || 0);

      if (update.status === 'completed') {
        HapticsService.success();
        setIsGenerating(false);
        Alert.alert(
          'Video Ready!',
          'Your video has been generated successfully!',
          [
            { text: 'View Profile', onPress: () => navigation.navigate('ProfileScreen') },
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (update.status === 'failed') {
        HapticsService.error();
        setIsGenerating(false);
        Alert.alert('Generation Failed', update.error || 'Video generation failed');
      }
    }

    loadUserJobs();
  }, [currentJob, navigation]);

  useFocusEffect(
    useCallback(() => {
      socketService.connect();
      socketService.addVideoStatusListener('queue', handleVideoStatusUpdate);
      loadUserJobs();

      return () => {
        socketService.removeVideoStatusListener('queue');
      };
    }, [handleVideoStatusUpdate])
  );

  const handleStartVideoGeneration = async () => {
    if (isGenerating) return;

    try {
      HapticsService.medium();
      setIsGenerating(true);
      setProgress(0);
      setStatusMessage('Submitting video generation request...');

      const response = await apiService.generateVideo(scene, audioUrl);
      
      if (response.success && response.jobId) {
        const tempJob: VideoJob = {
          id: response.jobId,
          userId: 'current-user',
          sceneData: scene,
          audioUrl: audioUrl,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setCurrentJob(tempJob);
        setStatusMessage('Video generation started! Please wait...');
        
        Alert.alert(
          'Generation Started',
          `Video generation has been queued. Estimated time: ${response.estimatedTime || '2-5 minutes'}`
        );
      } else {
        throw new Error(response.error || 'Failed to start video generation');
      }
    } catch (error) {
      setIsGenerating(false);
      console.error('Error starting video generation:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start video generation');
    }
  };

  const handleCancelGeneration = async () => {
    if (!currentJob || !['pending', 'in-progress'].includes(currentJob.status)) return;

    HapticsService.warning();
    Alert.alert(
      'Cancel Generation',
      'Are you sure you want to cancel the video generation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelVideoJob(currentJob.id);
              setIsGenerating(false);
              setCurrentJob(null);
              setStatusMessage('');
              setProgress(0);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel generation');
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Queued', color: 'text-white/80', bg: 'bg-white/20' };
      case 'in-progress':
        return { text: 'Generating', color: 'text-white', bg: 'bg-white/30' };
      case 'completed':
        return { text: 'Completed', color: 'text-white', bg: 'bg-white/30' };
      case 'failed':
        return { text: 'Failed', color: 'text-white/80', bg: 'bg-white/20' };
      default:
        return { text: 'Unknown', color: 'text-white/60', bg: 'bg-white/10' };
    }
  };

  const renderVideoPlayer = (videoUrl: string, jobId: string) => {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-black rounded-3xl overflow-hidden mb-8">
          <Video
            source={{ uri: videoUrl }}
            style={{ width: videoWidth, height: videoHeight }}
            controls={true}
            resizeMode="contain"
            onLoad={(data) => {
              setVideoDuration(data.duration);
            }}
            onProgress={(data) => {
              setVideoProgress(data.currentTime);
            }}
            onEnd={() => {
              setIsVideoPlaying(false);
            }}
          />
        </View>
        
        <View className="w-full">
          <WhiteButton
            title="Open Video In Browser"
            onPress={() => openVideoInBrowser(videoUrl)}
          />
        </View>
      </View>
    );
  };

  const renderCurrentGeneration = () => {
    if (!currentJob) return null;

    const statusInfo = getStatusInfo(currentJob.status);
    const isActive = ['pending', 'in-progress'].includes(currentJob.status);
    if (currentJob.status === 'completed' && currentJob.videoUrl) {
      return renderVideoPlayer(currentJob.videoUrl, currentJob.id);
    }

    return (
      <View className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-sfpro-semibold">
            Video Generation
          </Text>
          <View className={`px-3 py-1 rounded-full ${statusInfo.bg}`}>
            <Text className={`text-sm font-sfpro-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {statusMessage && (
          <Text className="text-white/80 text-base font-sfpro-regular mb-4">
            {statusMessage}
          </Text>
        )}

        {progress > 0 && isActive && (
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white/70 text-sm font-sfpro-regular">Progress</Text>
              <Text className="text-white text-sm font-sfpro-medium">{progress}%</Text>
            </View>
            <View className="bg-white/20 rounded-full h-2 overflow-hidden">
              <Animated.View 
                className="bg-white h-2 rounded-full"
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }}
              />
            </View>
          </View>
        )}
        {isActive && (
          <TouchableOpacity
            onPress={() => {
              handleCancelGeneration();
            }}
            className="bg-white/20 border border-white/30 rounded-2xl p-3 items-center mb-4"
          >
            <Text className="text-white font-sfpro-medium">Cancel Generation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRecentVideos = () => {
    if (userJobs.length === 0) return null;

    return (
      <View className="bg-white/10 rounded-2xl p-6 border border-white/20">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-sfpro-semibold">Recent Videos</Text>
          <TouchableOpacity
            onPress={() => {
              HapticsService.light();
              navigation.navigate('ProfileScreen');
            }}
            className="bg-white/20 rounded-full px-4 py-2 border border-white/30"
          >
            <Text className="text-white text-sm font-sfpro-medium">View All</Text>
          </TouchableOpacity>
        </View>
        
        {userJobs.slice(0, 3).map((job, index) => {
          const statusInfo = getStatusInfo(job.status);
          return (
            <TouchableOpacity 
              key={job.id} 
              className={`flex-row items-center py-3 ${
                index < 2 ? 'border-b border-white/10' : ''
              }`}
              onPress={() => {
                if (job.status === 'completed' && job.videoUrl) {
                  HapticsService.light();
                  setCurrentJob(job);
                }
              }}
            >
              <View className={`w-3 h-3 rounded-full mr-4 ${
                job.status === 'completed' ? 'bg-white' :
                job.status === 'in-progress' ? 'bg-white/70' :
                job.status === 'failed' ? 'bg-white/50' : 'bg-white/30'
              }`} />
              <View className="flex-1">
                <Text className="text-white font-sfpro-medium">
                  {job.sceneData.name}
                </Text>
                <Text className="text-white/60 text-sm font-sfpro-regular">
                  {new Date(job.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className={`text-sm font-sfpro-medium capitalize ${statusInfo.color}`}>
                {statusInfo.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF5555" />
      <SafeAreaView className="flex-1 bg-[#FF5555]">
        <Animated.View 
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {!(currentJob?.status === 'completed' && currentJob?.videoUrl) && (
            <>
              <View className="flex-row items-center justify-between px-4 py-6">
                <TouchableOpacity
                  onPress={() => {
                    HapticsService.light();
                    navigation.goBack();
                  }}
                  className="bg-white/20 rounded-full px-5 py-2 border border-white/30"
                >
                  <Text className="text-white text-lg">←</Text>
                </TouchableOpacity>
                
                <View className="items-center">
                  <Text className="text-white text-2xl font-sfpro-semibold">Generate Video</Text>
                  <Text className="text-white/80 text-sm font-sfpro-regular mt-1">
                    {scene.name}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    HapticsService.light();
                    navigation.navigate('ProfileScreen');
                  }}
                  className="bg-white/20 rounded-full p-3 border border-white/30"
                >
                  <Text className="text-white text-sm font-sfpro-medium">Profile</Text>
                </TouchableOpacity>
              </View>

              <View className="items-center mb-8">
                {scene.imageUrl ? (
                  <Image
                    source={{ uri: scene.imageUrl }}
                    style={{
                      width: 160,
                      height: 160 * (16 / 9),
                      borderRadius: 20,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View 
                    style={{
                      width: 160,
                      height: 160 * (16 / 9),
                      borderRadius: 20,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                    className="items-center justify-center border-2 border-white/20"
                  >
                    <Text className="text-white/60 text-sm font-sfpro-regular">
                      No Image
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* {currentJob?.status === 'completed' && currentJob?.videoUrl && (
            <View className="absolute top-12 left-8 z-10">
              <TouchableOpacity
                onPress={() => {
                  HapticsService.light();
                  navigation.goBack();
                }}
                className="bg-white/20 rounded-full px-5 py-2 border border-white/30"
              >
                <Text className="text-white text-lg">←</Text>
              </TouchableOpacity>
            </View>
          )} */}

          {currentJob?.status === 'completed' && currentJob?.videoUrl ? (
            renderCurrentGeneration()
          ) : (
            <ScrollView 
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {currentJob ? (
                renderCurrentGeneration()
              ) : (
                <View className="mb-6">
                  {!isGenerating ? (
                    <WhiteButton
                      title="Render Video"
                      onPress={handleStartVideoGeneration}
                    />
                  ) : (
                    <View className="bg-white/10 rounded-2xl p-6 border border-white/20 items-center">
                      <ActivityIndicator size="large" color="white" />
                      <Text className="text-white font-sfpro-medium mt-3">
                        Starting Generation...
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* {renderRecentVideos()} */}
        </Animated.View>
      </SafeAreaView>
    </>
  );
}
