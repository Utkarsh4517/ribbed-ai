import React, { useState, useEffect, useCallback } from 'react';
import { Text, TouchableOpacity, View, Image, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, VideoJob } from '../services/api';
import { socketService, VideoStatusUpdate } from '../services/socketService';

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

  const loadUserJobs = async () => {
    try {
      const response = await apiService.getUserVideoJobs();
      if (response.success) {
        setUserJobs(response.jobs.slice(0, 5)); // Show last 5 jobs
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
        setIsGenerating(false);
        Alert.alert(
          'Video Ready! 🎉',
          'Your video has been generated successfully!',
          [
            { text: 'View Profile', onPress: () => navigation.navigate('ProfileScreen') },
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (update.status === 'failed') {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'failed': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Video Queue</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileScreen')}
            className="bg-blue-500 rounded-full p-2 shadow-sm"
          >
            <Text className="text-white text-sm">👤</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Scene Details</Text>
          
          <View className="flex-row">
            {scene.imageUrl ? (
              <Image
                source={{ uri: scene.imageUrl }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6'
                }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6'
                }}
                className="items-center justify-center border border-gray-200"
              >
                <Text className="text-xs text-gray-500 text-center px-2">
                  No Image
                </Text>
              </View>
            )}
            
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                {scene.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {scene.description}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Audio Status</Text>
          
          <View className="flex-row items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🎵</Text>
              <View>
                <Text className="text-green-800 font-semibold">Audio Ready</Text>
                <Text className="text-green-600 text-sm">Speech generated successfully</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-green-500 rounded-lg px-3 py-2"
              onPress={() => Alert.alert('Audio URL', audioUrl)}
            >
              <Text className="text-white font-medium text-sm">Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentJob ? (
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Current Generation</Text>
            
            <View className={`p-4 rounded-lg border mb-4 ${getStatusColor(currentJob.status)}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold">
                  {getStatusIcon(currentJob.status)} {currentJob.status.toUpperCase()}
                </Text>
                {(['pending', 'in-progress'].includes(currentJob.status)) && (
                  <TouchableOpacity
                    className="bg-red-500 rounded px-2 py-1"
                    onPress={handleCancelGeneration}
                  >
                    <Text className="text-white text-xs">Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {statusMessage && (
                <Text className="text-sm mb-2">{statusMessage}</Text>
              )}
              
              {progress > 0 && (
                <View className="bg-gray-200 rounded-full h-2 mb-2">
                  <View 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${progress}%` }}
                  />
                </View>
              )}

              {currentJob.videoUrl && (
                <TouchableOpacity
                  className="bg-blue-500 rounded-lg p-3 items-center mt-2"
                  onPress={() => Alert.alert('Video Ready!', currentJob.videoUrl!)}
                >
                  <Text className="text-white font-semibold">📹 View Video</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Video Generation</Text>
            
            <View className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-3">🎬</Text>
                <Text className="text-blue-800 font-semibold">Ready to Generate</Text>
              </View>
              <Text className="text-blue-600 text-sm">
                Your scene and audio are ready. Click below to start video generation.
              </Text>
            </View>

            <TouchableOpacity
              className={`rounded-lg p-4 items-center ${
                isGenerating ? 'bg-gray-400' : 'bg-purple-500'
              }`}
              onPress={handleStartVideoGeneration}
              disabled={isGenerating}
            >
              <Text className="text-white font-bold text-lg">
                {isGenerating ? '⏳ Starting Generation...' : '🚀 Start Video Generation'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {userJobs.length > 0 && (
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-800">Recent Videos</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileScreen')}
                className="bg-blue-500 rounded px-3 py-1"
              >
                <Text className="text-white text-sm">View All</Text>
              </TouchableOpacity>
            </View>
            
            {userJobs.slice(0, 3).map((job) => (
              <View key={job.id} className="flex-row items-center p-2 border-b border-gray-100">
                <View className={`w-3 h-3 rounded-full mr-3 ${
                  job.status === 'completed' ? 'bg-green-500' :
                  job.status === 'in-progress' ? 'bg-blue-500' :
                  job.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">
                    {job.sceneData.name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 capitalize">
                  {job.status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
