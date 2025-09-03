import React, { useState, useEffect, useCallback } from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  RefreshControl,
  Modal
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParamList } from '../types/navigation';
import { apiService, VideoJob } from '../services/api';
import { socketService, VideoStatusUpdate } from '../services/socketService';
import { useAppContext } from '../contexts/AppContext';

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
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

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

  const handleVideoPress = (job: VideoJob) => {
    if (job.videoUrl) {
      setSelectedVideo(job);
      setIsVideoModalVisible(true);
    } else {
      Alert.alert('Video Not Ready', 'This video is still being processed.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'failed': return 'bg-red-100 border-red-300 text-red-800';
      case 'cancelled': return 'bg-gray-100 border-gray-300 text-gray-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '⭕';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderJobCard = (job: VideoJob) => (
    <TouchableOpacity
      key={job.id}
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100"
      onPress={() => handleVideoPress(job)}
      activeOpacity={0.7}
    >
      <View className="flex-row">
        <View className="mr-4">
          {job.sceneData.imageUrl ? (
            <Image
              source={{ uri: job.sceneData.imageUrl }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <View 
              style={{ width: 80, height: 80 }}
              className="bg-gray-200 rounded-lg items-center justify-center"
            >
              <Text className="text-gray-500 text-xs">No Image</Text>
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {job.sceneData.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
            {job.sceneData.description}
          </Text>
          
          {/* Status */}
          <View className={`self-start px-2 py-1 rounded-full border ${getStatusColor(job.status)} mb-2`}>
            <Text className="text-xs font-medium">
              {getStatusIcon(job.status)} {job.status.toUpperCase()}
            </Text>
          </View>

          <Text className="text-xs text-gray-500">
            Created: {formatDate(job.createdAt)}
          </Text>
          {job.completedAt && (
            <Text className="text-xs text-gray-500">
              Completed: {formatDate(job.completedAt)}
            </Text>
          )}
          {job.duration && (
            <Text className="text-xs text-gray-500">
              Duration: {job.duration.toFixed(1)}s
            </Text>
          )}
        </View>

        <View className="justify-center">
          {job.status === 'pending' || job.status === 'in-progress' ? (
            <TouchableOpacity
              className="bg-red-500 rounded-lg px-3 py-2"
              onPress={() => handleCancelJob(job.id)}
            >
              <Text className="text-white text-xs font-medium">Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-gray-500 rounded-lg px-3 py-2"
              onPress={() => handleDeleteJob(job.id)}
            >
              <Text className="text-white text-xs font-medium">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {job.error && (
        <View className="mt-3 p-2 bg-red-50 rounded border border-red-200">
          <Text className="text-red-700 text-sm">{job.error}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStatusSection = (title: string, jobs: VideoJob[], color: string) => {
    if (jobs.length === 0) return null;

    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <Text className="text-lg font-bold text-gray-800">{title}</Text>
          <View className={`ml-2 px-2 py-1 rounded-full ${color}`}>
            <Text className="text-xs font-medium text-white">{jobs.length}</Text>
          </View>
        </View>
        {jobs.map(renderJobCard)}
      </View>
    );
  };

  const renderVideoModal = () => (
    <Modal
      visible={isVideoModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsVideoModalVisible(false)}
    >
      <View className="flex-1 bg-black bg-opacity-90 items-center justify-center">
        <View className="bg-white rounded-lg p-4 m-4 max-w-sm w-full">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            {selectedVideo?.sceneData.name}
          </Text>
          
          {selectedVideo?.videoUrl ? (
            <View className="mb-4">
              <TouchableOpacity
                className="bg-blue-500 rounded-lg p-4 items-center mb-3"
                onPress={() => {
                  Alert.alert('Video URL', selectedVideo.videoUrl!);
                }}
              >
                <Text className="text-white font-semibold">📹 Open Video</Text>
              </TouchableOpacity>
              
              <Text className="text-sm text-gray-600 text-center">
                Duration: {selectedVideo.duration?.toFixed(1)}s
              </Text>
            </View>
          ) : (
            <Text className="text-gray-600 text-center mb-4">
              Video is still processing...
            </Text>
          )}

          <TouchableOpacity
            className="bg-gray-500 rounded-lg p-3 items-center"
            onPress={() => setIsVideoModalVisible(false)}
          >
            <Text className="text-white font-medium">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading your videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">My Videos</Text>
          <TouchableOpacity
            className="bg-red-500 rounded-full p-2 shadow-sm"
          >
            <Text className="text-white text-sm">🚪</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-1">
              Welcome back!
            </Text>
            <Text className="text-sm text-gray-600">{user.email}</Text>
            <Text className="text-sm text-gray-500 mt-2">
              Total videos: {jobs.length}
            </Text>
          </View>
        )}

        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="bg-yellow-500 rounded-lg p-3 mb-2" style={{ width: '48%' }}>
            <Text className="text-white text-sm">Pending</Text>
            <Text className="text-white text-2xl font-bold">{jobsByStatus.pending.length}</Text>
          </View>
          <View className="bg-blue-500 rounded-lg p-3 mb-2" style={{ width: '48%' }}>
            <Text className="text-white text-sm">In Progress</Text>
            <Text className="text-white text-2xl font-bold">{jobsByStatus['in-progress'].length}</Text>
          </View>
          <View className="bg-green-500 rounded-lg p-3" style={{ width: '48%' }}>
            <Text className="text-white text-sm">Completed</Text>
            <Text className="text-white text-2xl font-bold">{jobsByStatus.completed.length}</Text>
          </View>
          <View className="bg-red-500 rounded-lg p-3" style={{ width: '48%' }}>
            <Text className="text-white text-sm">Failed</Text>
            <Text className="text-white text-2xl font-bold">{jobsByStatus.failed.length}</Text>
          </View>
        </View>

        {jobs.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-gray-600 text-lg mb-2">No videos yet</Text>
            <Text className="text-gray-500 text-center">
              Create your first video by going to the home screen and generating an avatar!
            </Text>
            <TouchableOpacity
              className="bg-blue-500 rounded-lg px-6 py-3 mt-4"
              onPress={() => navigation.navigate('Home')}
            >
              <Text className="text-white font-semibold">Get Started</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderStatusSection('In Progress', jobsByStatus['in-progress'], 'bg-blue-500')}
            {renderStatusSection('Pending', jobsByStatus.pending, 'bg-yellow-500')}
            {renderStatusSection('Completed', jobsByStatus.completed, 'bg-green-500')}
            {renderStatusSection('Failed', jobsByStatus.failed, 'bg-red-500')}
          </>
        )}
      </ScrollView>

      {renderVideoModal()}
    </SafeAreaView>
  );
}
