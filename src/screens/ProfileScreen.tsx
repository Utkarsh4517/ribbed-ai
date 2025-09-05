import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  RefreshControl,
  StatusBar,
  Animated,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParamList } from '../types/navigation';
import { apiService, VideoJob } from '../services/api';
import { socketService, VideoStatusUpdate } from '../services/socketService';
import { useAppContext } from '../contexts/AppContext';
import WhiteButton from '../components/WhiteButton';
import RedButton from '../components/RedButton';
import { HapticsService } from '../utils/haptics';

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ProfileScreen'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAppContext();
  
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [jobsByStatus, setJobsByStatus] = useState<{
    pending: VideoJob[];
    'in-progress': VideoJob[];
    completed: VideoJob[];
    failed: VideoJob[];
  }>({
    pending: [],
    'in-progress': [],
    completed: [],
    failed: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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

  const loadUserJobs = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      const response = await apiService.getUserVideoJobs();
      
      if (response.success) {
        setJobs(response.jobs);
        setJobsByStatus(response.jobsByStatus);
      }
    } catch (error) {
      console.error('Error loading user jobs:', error);
      Alert.alert('Error', 'Failed to load your videos');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserJobs(false);
    setIsRefreshing(false);
  };

  const handleVideoStatusUpdate = useCallback((update: VideoStatusUpdate) => {
    console.log('Profile received video update:', update);
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === update.jobId 
          ? { 
              ...job, 
              status: update.status,
              videoUrl: update.videoUrl || job.videoUrl,
              duration: update.duration || job.duration,
              error: update.error || job.error,
              updatedAt: new Date().toISOString(),
              completedAt: update.status === 'completed' ? new Date().toISOString() : job.completedAt
            }
          : job
      )
    );

    loadUserJobs(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      socketService.connect();
      socketService.addVideoStatusListener('profile', handleVideoStatusUpdate);
      loadUserJobs();

      return () => {
        socketService.removeVideoStatusListener('profile');
      };
    }, [handleVideoStatusUpdate])
  );

  const handleCancelJob = async (jobId: string) => {
    HapticsService.warning();
    Alert.alert(
      'Cancel Video Generation',
      'Are you sure you want to cancel this video generation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelVideoJob(jobId);
              loadUserJobs(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel job');
            }
          }
        }
      ]
    );
  };

  const handleDeleteJob = async (jobId: string) => {
    HapticsService.warning();
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteVideoJob(jobId);
              loadUserJobs(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete job');
            }
          }
        }
      ]
    );
  };

  const handleVideoPress = async (job: VideoJob) => {
    if (job.videoUrl) {
      HapticsService.light();
      try {
        const supported = await Linking.canOpenURL(job.videoUrl);
        if (supported) {
          await Linking.openURL(job.videoUrl);
        } else {
          Alert.alert('Error', 'Unable to open video link');
        }
      } catch (error) {
        console.error('Error opening video:', error);
        Alert.alert('Error', 'Failed to open video');
      }
    } else {
      Alert.alert('Video Not Ready', 'This video is still being processed.');
    }
  };

  const handleLogout = () => {
    HapticsService.warning();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Queued', color: 'text-white', bg: 'bg-white/20', dot: 'bg-white/60' };
      case 'in-progress':
        return { text: 'Generating', color: 'text-white', bg: 'bg-white/30', dot: 'bg-white' };
      case 'completed':
        return { text: 'Ready', color: 'text-white', bg: 'bg-white/30', dot: 'bg-white' };
      case 'failed':
        return { text: 'Failed', color: 'text-white/80', bg: 'bg-white/20', dot: 'bg-white/50' };
      default:
        return { text: 'Unknown', color: 'text-white/60', bg: 'bg-white/10', dot: 'bg-white/30' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'completed':
        return jobsByStatus.completed;
      case 'pending':
        return [...jobsByStatus.pending, ...jobsByStatus['in-progress']];
      case 'failed':
        return jobsByStatus.failed;
      default:
        return jobs;
    }
  };

  const renderJobCard = (job: VideoJob) => {
    const statusInfo = getStatusInfo(job.status);
    
    return (
      <TouchableOpacity
        key={job.id}
        className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/20"
        onPress={() => handleVideoPress(job)}
        activeOpacity={0.8}
        disabled={!job.videoUrl}
      >
        <View className="flex-row">
          <View className="mr-4">
            {job.sceneData.imageUrl ? (
              <Image
                source={{ uri: job.sceneData.imageUrl }}
                style={{ width: 80, height: 80, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{ width: 80, height: 80 }}
                className="bg-white/10 rounded-xl items-center justify-center border border-white/20"
              >
                <Text className="text-white/60 text-xs font-sfpro-regular">No Image</Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-white text-lg font-sfpro-semibold mb-1">
              {job.sceneData.name}
            </Text>
            <Text className="text-white/70 text-sm font-sfpro-regular mb-2" numberOfLines={2}>
              {job.sceneData.description}
            </Text>
            
            <View className="flex-row items-center mb-2">
              <View className={`w-2 h-2 rounded-full mr-2 ${statusInfo.dot}`} />
              <Text className={`text-sm font-sfpro-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </Text>
              {job.videoUrl && (
                <Text className="text-white/60 text-xs font-sfpro-regular ml-2">• Tap to play</Text>
              )}
            </View>

            <Text className="text-white/60 text-xs font-sfpro-regular">
              {formatDate(job.createdAt)}
            </Text>
            {job.duration && (
              <Text className="text-white/60 text-xs font-sfpro-regular">
                Duration: {job.duration.toFixed(1)}s
              </Text>
            )}
          </View>

          <View className="justify-center">
            {job.status === 'pending' || job.status === 'in-progress' ? (
              <TouchableOpacity
                className="bg-white/20 border border-white/30 rounded-full px-3 py-2"
                onPress={() => handleCancelJob(job.id)}
              >
                <Text className="text-white text-xs font-sfpro-medium">Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-white/20 border border-white/30 rounded-full px-3 py-2"
                onPress={() => handleDeleteJob(job.id)}
              >
                <Text className="text-white text-xs font-sfpro-medium">Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {job.error && (
          <View className="mt-3 p-3 bg-white/10 rounded-xl border border-white/20">
            <Text className="text-white/80 text-sm font-sfpro-regular">{job.error}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStatsGrid = () => (
    <View className="flex-row flex-wrap justify-between mb-6">
      <View className="bg-white/10 rounded-2xl p-4 border border-white/20" style={{ width: '48%' }}>
        <Text className="text-white/80 text-sm font-sfpro-regular">Total Videos</Text>
        <Text className="text-white text-2xl font-sfpro-semibold">{jobs.length}</Text>
      </View>
      <View className="bg-white/10 rounded-2xl p-4 border border-white/20" style={{ width: '48%' }}>
        <Text className="text-white/80 text-sm font-sfpro-regular">Completed</Text>
        <Text className="text-white text-2xl font-sfpro-semibold">{jobsByStatus.completed.length}</Text>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View className="bg-white/10 rounded-2xl p-2 border border-white/20 mb-6">
      <View className="flex-row">
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Ready' },
          { key: 'pending', label: 'Processing' },
          { key: 'failed', label: 'Failed' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              HapticsService.selection();
              setActiveTab(tab.key as any);
            }}
            className={`flex-1 py-2 px-3 rounded-xl items-center ${
              activeTab === tab.key ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-sfpro-medium ${
              activeTab === tab.key ? 'text-[#FF5555]' : 'text-white/70'
            }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#FF5555" />
        <SafeAreaView className="flex-1 bg-[#FF5555]">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white font-sfpro-regular mt-4">Loading your videos...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

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
          <View className="flex-row items-center justify-between px-8 py-6">
            <TouchableOpacity
              onPress={() => {
                HapticsService.light();
                navigation.goBack();
              }}
              className="bg-white/20 rounded-full px-4 py-2 border border-white/30"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>
            
            <View className="items-center">
              <Text className="text-white text-2xl font-sfpro-semibold">My Videos</Text>
              <Text className="text-white/80 text-sm font-sfpro-regular mt-1">
                {user?.email}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                handleLogout();
              }}
              className="bg-white/20 rounded-full px-4 py-2 border border-white/30"
            >
              <Text className="text-white text-lg">⏻</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1 px-8"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={handleRefresh}
                tintColor="white"
              />
            }
          >
            {renderStatsGrid()}
            {jobs.length > 0 && renderTabBar()}
            {jobs.length === 0 ? (
              <View className="bg-white/10 rounded-2xl p-8 items-center border border-white/20">
                <Text className="text-white text-lg font-sfpro-semibold mb-2">No videos yet</Text>
                <Text className="text-white/80 text-center font-sfpro-regular mb-6 leading-relaxed">
                  Create your first video by generating an avatar and scene!
                </Text>
                <WhiteButton
                  title="Get Started"
                  onPress={() => navigation.navigate('Home')}
                />
              </View>
            ) : (
              <View className="pb-4">
                {getFilteredJobs().map(renderJobCard)}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}
