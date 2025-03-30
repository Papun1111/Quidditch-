import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
} from 'recharts';
import { FaSmile, FaMeh, FaFrown, FaChartLine, FaVolumeUp, FaRandom } from 'react-icons/fa';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Float, Text3D, Environment, useGLTF } from '@react-three/drei';
import { AudioLoader, AudioListener, PositionalAudio, Vector3, Mesh, MathUtils } from 'three';
import TFPredictionsHoldings from './TFPredictions';

// Import audio files
import crowd from '../assets/crowd.mp3';
import neutral from '../assets/neutral.mp3';
import sad from '../assets/sad.mp3';
import panic from '../assets/panic.mp3';

// Define TypeScript interfaces
interface VRPitData {
  avgPercentChange: number;
  crowdMood: string;
  noiseVolume: number; 
  averageVolume: number;
  animationIntensity: number;
  audioLevel: number;
  message: string;
  timestamp?: number;
}

interface AudioProps {
  audioLevel: number;
  avgChange: number;
  mood: string;
}

interface VRSceneProps {
  animationIntensity: number;
  noiseVolume: number;
  audioLevel: number;
  avgPercentChange: number;
  mood: string;
  ambientAudioSrc: string;
}

interface MoodIconProps {
  mood: string;
  size?: number;
}

// Time series data for historical chart
const generateHistoricalData = (baseValue: number): Array<{ time: string; value: number }> => {
  const times = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
  return times.map((time, index) => {
    // Create some realistic market fluctuation patterns
    const randomFactor = Math.random() * 2 - 1; // Between -1 and 1
    const trendFactor = index < 7 ? 0.2 : -0.15; // Uptrend in morning, downtrend in afternoon
    const volatility = 0.7 + (Math.abs(baseValue) / 10); // Higher volatility for extreme market conditions
    
    const change = (randomFactor * volatility) + (trendFactor * index);
    const newValue = baseValue + change;
    
    return { time, value: parseFloat(newValue.toFixed(2)) };
  });
};

// Enhanced 3D floating objects for the VR scene
const FloatingTradeMarker: React.FC<{ position: [number, number, number]; size: number; color: string; speed: number }> = ({ position, size, color, speed }) => {
  const mesh = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * speed * 0.4) * 0.2;
      mesh.current.rotation.z = Math.cos(state.clock.getElapsedTime() * speed * 0.3) * 0.1;
      mesh.current.position.y += Math.sin(state.clock.getElapsedTime() * speed) * 0.003;
    }
  });
  
  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={[size, size, size * 0.2]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Enhanced ambient audio component with smoother transitions
const AmbientAudio: React.FC<AudioProps> = ({ audioLevel, avgChange, mood }) => {
  const { camera } = useThree();
  const listener = useRef<AudioListener>(new AudioListener());
  const soundRef = useRef<PositionalAudio | null>(null);
  const audioLoader = useRef<AudioLoader>(new AudioLoader());
  const currentMood = useRef<string>(mood);
  const fadeInterval = useRef<NodeJS.Timeout | null>(null);

  const getAudioFile = (moodType: string): string => {
    const lower = moodType.toLowerCase();
    if (lower === 'panic') return panic;
    if (lower === 'concerned') return sad;
    if (lower === 'euphoric') return crowd;
    if (lower === 'optimistic') return neutral;
    return crowd;
  };

  // Handle audio crossfade when mood changes
  useEffect(() => {
    if (currentMood.current !== mood && soundRef.current) {
      // Fade out current audio
      if (fadeInterval.current) clearInterval(fadeInterval.current);
      
      const startVolume = soundRef.current.getVolume();
      let volume = startVolume;
      fadeInterval.current = setInterval(() => {
        volume -= 0.05;
        if (volume <= 0) {
          if (soundRef.current) soundRef.current.stop();
          clearInterval(fadeInterval.current as NodeJS.Timeout);
          
          // Load and play new audio after fade out
          const audioFile = getAudioFile(mood);
          audioLoader.current.load(audioFile, (buffer) => {
            if (soundRef.current) {
              soundRef.current.setBuffer(buffer);
              soundRef.current.setLoop(true);
              soundRef.current.setVolume(0);
              soundRef.current.play();
              
              // Fade in
              let newVolume = 0;
              const fadeIn = setInterval(() => {
                newVolume += 0.05;
                if (newVolume >= audioLevel) {
                  if (soundRef.current) soundRef.current.setVolume(audioLevel);
                  clearInterval(fadeIn);
                } else {
                  if (soundRef.current) soundRef.current.setVolume(newVolume);
                }
              }, 50);
            }
          });
          
          currentMood.current = mood;
        } else {
          if (soundRef.current) soundRef.current.setVolume(volume);
        }
      }, 50);
    } else if (soundRef.current) {
      // Just adjust volume if mood hasn't changed
      soundRef.current.setVolume(audioLevel);
    }
  }, [audioLevel, mood]);

  // Initial audio setup
  useEffect(() => {
    camera.add(listener.current);
    
    const audioFile = getAudioFile(mood);
    audioLoader.current.load(audioFile, (buffer) => {
      if (!soundRef.current) {
        soundRef.current = new PositionalAudio(listener.current);
        soundRef.current.setBuffer(buffer);
        soundRef.current.setLoop(true);
        soundRef.current.setVolume(0);
        soundRef.current.play();
        
        // Fade in initial audio
        let volume = 0;
        const fadeIn = setInterval(() => {
          volume += 0.05;
          if (volume >= audioLevel) {
            if (soundRef.current) soundRef.current.setVolume(audioLevel);
            clearInterval(fadeIn);
          } else {
            if (soundRef.current) soundRef.current.setVolume(volume);
          }
        }, 50);
      }
    });
    
    // Ensure AudioContext resumes on user interaction
    const resumeAudioContext = () => {
      if (soundRef.current && soundRef.current.context.state === 'suspended') {
        soundRef.current.context.resume();
      }
    };
    
    document.addEventListener('click', resumeAudioContext);
    return () => {
      document.removeEventListener('click', resumeAudioContext);
      camera.remove(listener.current);
      if (soundRef.current) {
        soundRef.current.stop();
      }
      if (fadeInterval.current) clearInterval(fadeInterval.current);
    };
  }, []);

  return <primitive object={soundRef.current || new PositionalAudio(listener.current)} />;
};

// 3D market visualization with enhanced animations
const VRTradingPitScene: React.FC<VRSceneProps> = ({ 
  animationIntensity, 
  noiseVolume, 
  audioLevel, 
  avgPercentChange, 
  mood, 
  ambientAudioSrc 
}) => {
  const marketSphereRef = useRef<Mesh>(null);
  const floatingMarkersRef = useRef<Array<{ position: Vector3, color: string, speed: number }>>(
    Array.from({ length: 15 }, () => ({
      position: new Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      ),
      color: avgPercentChange > 0 ? 
        '#' + Math.floor(Math.random() * 128 + 127).toString(16) + 'ff' + Math.floor(Math.random() * 128).toString(16) :
        '#ff' + Math.floor(Math.random() * 128).toString(16) + Math.floor(Math.random() * 128).toString(16),
      speed: Math.random() * 0.8 + 0.2
    }))
  );
  
  // Get color based on market mood
  const getMoodColor = (): string => {
    const moodLower = mood.toLowerCase();
    if (moodLower === 'panic') return '#ff3d3d';
    if (moodLower === 'concerned') return '#ffa33d';
    if (moodLower === 'euphoric') return '#4cff3d';
    if (moodLower === 'optimistic') return '#3d8dff';
    return '#a3a3a3';
  };
  
  // Animate main market sphere
  useFrame((state, delta) => {
    if (marketSphereRef.current) {
      // Base rotation with intensity factor
      marketSphereRef.current.rotation.y += delta * 0.3 * animationIntensity;
      
      // Market change affects wobble
      const wobbleFactor = Math.abs(avgPercentChange) / 10;
      marketSphereRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * (wobbleFactor * animationIntensity);
      marketSphereRef.current.rotation.z = Math.cos(state.clock.getElapsedTime() * 0.3) * (wobbleFactor * animationIntensity * 0.5);
      
      // Pulse size based on noise volume
      const scaleFactor = 1 + (Math.sin(state.clock.getElapsedTime() * 2) * 0.05 * (noiseVolume / 100));
      marketSphereRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  });
  
  // Create responsive market visualization
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#ffedba" />
      
      {/* Main market sphere */}
      <mesh ref={marketSphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial 
          color={getMoodColor()} 
          roughness={0.4} 
          metalness={0.6} 
          emissive={getMoodColor()} 
          emissiveIntensity={0.2 * animationIntensity}
        />
      </mesh>
      
      {/* Floating trade markers */}
      {floatingMarkersRef.current.map((marker, i) => (
        <FloatingTradeMarker 
          key={i} 
          position={[marker.position.x, marker.position.y, marker.position.z]} 
          size={0.2 + (Math.random() * 0.3)} 
          color={marker.color} 
          speed={marker.speed * animationIntensity}
        />
      ))}
      
      {/* Lighting effects that respond to market conditions */}
      <pointLight 
        position={[0, 3, 0]} 
        intensity={Math.max(0.5, Math.min(2, Math.abs(avgPercentChange) / 5))} 
        color={avgPercentChange > 0 ? "#a3ffba" : "#ffa3a3"} 
        distance={10}
      />
      
      {/* Controls */}
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        enableRotate={true} 
        autoRotate={animationIntensity > 0.7}
        autoRotateSpeed={animationIntensity * 2}
      />
      
      {/* Ambient audio */}
      <AmbientAudio audioLevel={audioLevel} avgChange={avgPercentChange} mood={mood} />
      
      {/* Floating statistics */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Html position={[0, -2.5, 0]} transform distanceFactor={10}>
          <motion.div
            className="bg-black bg-opacity-80 p-4 rounded-xl backdrop-blur-sm text-white w-64 shadow-2xl border border-gray-700"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              transition: { duration: 0.6, ease: "easeOut" }
            }}
          >
            <h3 className="text-lg font-bold mb-2 text-center border-b border-gray-600 pb-2">
              Market Vitals
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="flex items-center text-sm">
                <FaChartLine className="mr-2" /> 
                <span className={avgPercentChange >= 0 ? "text-green-400" : "text-red-400"}>
                  {avgPercentChange.toFixed(2)}%
                </span>
              </p>
              <p className="flex items-center text-sm">
                <FaVolumeUp className="mr-2" /> 
                <span>{noiseVolume}</span>
              </p>
              <p className="flex items-center text-sm">
                <FaRandom className="mr-2" /> 
                <span>{(animationIntensity * 100).toFixed(0)}%</span>
              </p>
              <p className="flex items-center text-sm">
                {moodIcon({ mood, size: 16 })}
                <span className="ml-2">{mood}</span>
              </p>
            </div>
          </motion.div>
        </Html>
      </Float>
    </>
  );
};

// Enhanced mood icon component with size customization
const moodIcon = ({ mood, size = 20 }: MoodIconProps) => {
  const iconProps = { size, className: "inline-block ml-1" };
  
  switch (mood.toLowerCase()) {
    case 'panic':
      return <FaFrown {...iconProps} className={`${iconProps.className} text-red-500`} />;
    case 'concerned':
      return <FaFrown {...iconProps} className={`${iconProps.className} text-orange-400`} />;
    case 'euphoric':
      return <FaSmile {...iconProps} className={`${iconProps.className} text-green-400`} />;
    case 'optimistic':
      return <FaSmile {...iconProps} className={`${iconProps.className} text-blue-400`} />;
    default:
      return <FaMeh {...iconProps} className={`${iconProps.className} text-gray-400`} />;
  }
};

// Main VR Trading Pit component
const VRTradingPit: React.FC = () => {
  const [vrData, setVrData] = useState<VRPitData | null>(null);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<{ time: string; value: number }>>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  
  const mainControls = useAnimation();
  const chartsControls = useAnimation();
  const vrSceneControls = useAnimation();
  
  // Fetch initial data
  useEffect(() => {
    const fetchVRData = async () => {
      try {
        const res = await axios.get<VRPitData>('http://localhost:3000/api/vr-trading-pit');
        setVrData(res.data);
        setHistoricalData(generateHistoricalData(res.data.avgPercentChange));
        setIsDataLoaded(true);
        
        // Start staggered animations
        mainControls.start({ opacity: 1, y: 0, transition: { duration: 0.8 } });
        setTimeout(() => {
          chartsControls.start({ opacity: 1, scale: 1, transition: { duration: 0.6 } });
        }, 300);
        setTimeout(() => {
          vrSceneControls.start({ opacity: 1, scale: 1, transition: { duration: 0.7 } });
        }, 600);
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching VR trading pit data');
      }
    };
    
    fetchVRData();
  }, [mainControls, chartsControls, vrSceneControls]);
  
  // Socket connection for real-time updates
  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);
    
    newSocket.on("vrData", (data: VRPitData) => {
      setVrData(prev => {
        // Add new historical data point if timestamp indicates a new time period
        const shouldUpdateHistory = !prev || !prev.timestamp || !data.timestamp || 
          (data.timestamp - (prev.timestamp || 0) > 300000); // 5 minute intervals
          
        if (shouldUpdateHistory) {
          setHistoricalData(prevHistory => {
            const newHistory = [...prevHistory];
            if (newHistory.length > 13) {
              newHistory.shift(); // Remove oldest data point
            }
            
            // Add new data point with current time
            const now = new Date();
            const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
            newHistory.push({ time: timeStr, value: data.avgPercentChange });
            
            return newHistory;
          });
        }
        
        return data;
      });
    });
    
    return () => newSocket.disconnect();
  }, []);
  
  // Prepare chart data
  const barData = [
    { name: 'Market (%)', value: vrData ? Math.abs(vrData.avgPercentChange) : 0, color: vrData && vrData.avgPercentChange >= 0 ? '#4CAF50' : '#F44336' },
    { name: 'Noise', value: vrData ? vrData.noiseVolume : 40, color: '#FFC107' },
    { name: 'Volume', value: vrData ? vrData.averageVolume : 0, color: '#2196F3' }
  ];
  
  // Create volume distribution histogram with more realistic data
  const histogramData = vrData ? Array.from({ length: 7 }, (_, i) => {
    // Create a bell curve around the average volume
    const distance = Math.abs(i - 3);
    const baseFactor = Math.exp(-0.5 * Math.pow(distance / 2, 2));
    const randomFactor = 0.85 + Math.random() * 0.3;
    const value = vrData.averageVolume * baseFactor * randomFactor;
    
    return {
      name: `Bin ${i + 1}`,
      value: Math.floor(value)
    };
  }) : [];
  
  // Mood pie chart data
  const pieData = [
    { name: 'Mood', value: 1, mood: vrData ? vrData.crowdMood : 'neutral' }
  ];
  
  // Get mood color for styling
  const getMoodColor = (): string => {
    if (!vrData) return '#64748b';
    const mood = vrData.crowdMood.toLowerCase();
    if (mood === 'panic') return '#ef4444';
    if (mood === 'concerned') return '#f97316';
    if (mood === 'euphoric') return '#22c55e';
    if (mood === 'optimistic') return '#3b82f6';
    return '#64748b';
  };
  
  // Get audio source
  const getAudioSource = (mood: string): string => {
    const lower = mood.toLowerCase();
    if (lower === 'panic') return panic;
    if (lower === 'concerned') return sad;
    if (lower === 'euphoric') return neutral;
    return crowd;
  };
  
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-opacity-10"
            style={{
              backgroundColor: getMoodColor(),
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 60px ${getMoodColor()}`
            }}
            initial={{
              opacity: 0.05 + Math.random() * 0.1
            }}
            animate={{
              x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
              y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
              opacity: [0.05 + Math.random() * 0.1, 0.1 + Math.random() * 0.15, 0.05 + Math.random() * 0.1]
            }}
            transition={{
              duration: 20 + Math.random() * 30,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
      
      {/* Header Section */}
      <motion.div
        className="relative z-10 w-full max-w-6xl mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={mainControls}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 flex items-center">
              VR Trading Pit
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.6, type: 'spring' }}
                className="ml-3"
              >
                {vrData && moodIcon({ mood: vrData.crowdMood, size: 36 })}
              </motion.span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl">
              {vrData?.message || 'Loading market dynamics...'}
            </p>
          </div>
          
          {vrData && (
            <div className="flex flex-col items-center">
              <motion.div 
                className="text-4xl md:text-5xl font-bold p-4"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  color: vrData.avgPercentChange >= 0 ? ['#ffffff', '#22c55e'] : ['#ffffff', '#ef4444']
                }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {vrData.avgPercentChange >= 0 ? '+' : ''}{vrData.avgPercentChange.toFixed(2)}%
              </motion.div>
              <div className="flex space-x-4 text-sm text-gray-300">
                <span>Mood: <span className="font-semibold" style={{ color: getMoodColor() }}>{vrData.crowdMood}</span></span>
                <span>Volume: <span className="font-semibold">{vrData.averageVolume}</span></span>
              </div>
            </div>
          )}
        </div>
        {error && (
          <motion.div 
            className="mt-4 p-4 bg-red-900 bg-opacity-80 text-white rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
      
      {/* Charts Section */}
      <motion.div
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={chartsControls}
      >
        {/* Historical Trend Chart */}
        <motion.div
          className="bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-xl shadow-xl p-4 md:col-span-2 border border-gray-700"
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <h3 className="text-xl font-bold mb-3 text-white">Market Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={vrData && vrData.avgPercentChange >= 0 ? '#22c55e' : '#ef4444'} 
                strokeWidth={3}
                dot={{ r: 4, fill: vrData && vrData.avgPercentChange >= 0 ? '#22c55e' : '#ef4444' }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        
        {/* Bar Chart */}
        <motion.div
          className="bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-xl shadow-xl p-4 border border-gray-700"
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <h3 className="text-xl font-bold mb-3 text-white">Market Metrics</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" domain={[0, 'dataMax']} stroke="#aaa" />
              <YAxis dataKey="name" type="category" stroke="#aaa" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                barSize={24}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        
        {/* Volume Distribution */}
        <motion.div
          className="bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-xl shadow-xl p-4 border border-gray-700"
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <h3 className="text-xl font-bold mb-3 text-white">Volume Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histogramData}>
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
      
      {/* 3D Scene Section */}
      <motion.div
       className="relative z-10 w-full max-w-6xl h-[600px] mb-8 bg-gray-800 bg-opacity-50 rounded-2xl overflow-hidden shadow-2xl border border-gray-700"
       initial={{ opacity: 0, scale: 0.95 }}
       animate={vrSceneControls}
     >
       {/* Info overlay */}
       <motion.div 
         className="absolute top-4 left-4 z-20 bg-gray-900 bg-opacity-80 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white text-sm"
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 1.2, duration: 0.5 }}
       >
         <div className="text-lg font-bold mb-1">VR Market Environment</div>
         <p className="text-gray-300 mb-2">Interactive 3D visualization of current market conditions</p>
         <motion.button 
           className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full flex items-center"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1.8 }}
           onClick={() => setShowTooltip(!showTooltip)}
         >
           {showTooltip ? 'Hide' : 'Show'} Controls
         </motion.button>
       </motion.div>
       
       {/* Controls tooltip */}
       <AnimatePresence>
         {showTooltip && (
           <motion.div 
             className="absolute bottom-4 right-4 z-20 bg-gray-900 bg-opacity-80 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white text-sm"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 20 }}
             transition={{ duration: 0.3 }}
           >
             <div className="font-bold mb-1">Controls</div>
             <ul className="text-gray-300 text-xs space-y-1">
               <li>• Left click + drag: Rotate view</li>
               <li>• Scroll: Zoom in/out</li>
               <li>• Right click + drag: Pan view</li>
             </ul>
           </motion.div>
         )}
       </AnimatePresence>
       
       {/* 3D Canvas */}
       <Canvas shadows camera={{ position: [0, 0, 6], fov: 60 }}>
         {vrData && (
           <VRTradingPitScene
             noiseVolume={vrData.noiseVolume}
             animationIntensity={vrData.animationIntensity}
             audioLevel={vrData.audioLevel}
             avgPercentChange={vrData.avgPercentChange}
             mood={vrData.crowdMood}
             ambientAudioSrc={getAudioSource(vrData.crowdMood)}
           />
         )}
       </Canvas>
     </motion.div>
     
     {/* Mood Section with Animated Transitions */}
     <motion.div
       className="relative z-10 w-full max-w-6xl mb-8 overflow-hidden"
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.9, duration: 0.7 }}
     >
       <div className="p-6 bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700">
         <h2 className="text-2xl font-bold text-white mb-4">Market Mood Analysis</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Mood Indicator */}
           <div className="flex flex-col items-center justify-center p-4 bg-gray-700 bg-opacity-60 rounded-lg">
             <h3 className="text-lg font-medium text-gray-300 mb-3">Current Mood</h3>
             <motion.div
               className="w-32 h-32 rounded-full flex items-center justify-center"
               style={{ 
                 backgroundColor: `${getMoodColor()}20`,
                 boxShadow: `0 0 20px ${getMoodColor()}40`
               }}
               animate={{
                 scale: [1, 1.05, 1],
               }}
               transition={{
                 duration: 3,
                 repeat: Infinity,
                 repeatType: "reverse"
               }}
             >
               <motion.div
                 className="text-6xl"
                 animate={{ rotate: vrData?.animationIntensity ? vrData.animationIntensity * 10 : 0 }}
                 transition={{ duration: 0.5 }}
               >
                 {vrData && moodIcon({ mood: vrData.crowdMood, size: 64 })}
               </motion.div>
             </motion.div>
             <motion.p 
               className="mt-4 text-xl font-bold"
               style={{ color: getMoodColor() }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
             >
               {vrData?.crowdMood || 'Loading...'}
             </motion.p>
           </div>
           
           {/* Mood Pie Chart */}
           <div className="flex flex-col items-center justify-center p-4 bg-gray-700 bg-opacity-60 rounded-lg">
             <h3 className="text-lg font-medium text-gray-300 mb-3">Mood Distribution</h3>
             <ResponsiveContainer width="100%" height={200}>
               <PieChart>
                 <Pie
                   data={pieData}
                   dataKey="value"
                   nameKey="name"
                   cx="50%"
                   cy="50%"
                   outerRadius={80}
                   label={({ payload }) => payload.mood}
                 >
                   <Cell fill={getMoodColor()} />
                 </Pie>
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                     borderColor: '#475569', 
                     borderRadius: '8px' 
                   }}
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
           
           {/* Mood Description */}
           <div className="p-4 bg-gray-700 bg-opacity-60 rounded-lg">
             <h3 className="text-lg font-medium text-gray-300 mb-3">Mood Indicators</h3>
             {vrData && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 1, duration: 0.5 }}
               >
                 <div className="space-y-3">
                   <div>
                     <h4 className="text-white font-medium">Market Sentiment</h4>
                     <div className="w-full bg-gray-600 h-2 rounded-full mt-1">
                       <motion.div 
                         className="h-full rounded-full"
                         style={{ 
                           backgroundColor: getMoodColor(),
                           width: `${Math.min(100, Math.max(1, 50 + vrData.avgPercentChange * 5))}%` 
                         }}
                         initial={{ width: '50%' }}
                         animate={{ 
                           width: `${Math.min(100, Math.max(1, 50 + vrData.avgPercentChange * 5))}%` 
                         }}
                         transition={{ duration: 1 }}
                       />
                     </div>
                   </div>
                   
                   <div>
                     <h4 className="text-white font-medium">Trading Volume</h4>
                     <div className="w-full bg-gray-600 h-2 rounded-full mt-1">
                       <motion.div 
                         className="h-full rounded-full bg-blue-500"
                         style={{ width: `${Math.min(100, vrData.averageVolume)}%` }}
                         initial={{ width: '0%' }}
                         animate={{ width: `${Math.min(100, vrData.averageVolume)}%` }}
                         transition={{ duration: 1 }}
                       />
                     </div>
                   </div>
                   
                   <div>
                     <h4 className="text-white font-medium">Volatility</h4>
                     <div className="w-full bg-gray-600 h-2 rounded-full mt-1">
                       <motion.div 
                         className="h-full rounded-full bg-purple-500"
                         style={{ width: `${vrData.animationIntensity * 100}%` }}
                         initial={{ width: '0%' }}
                         animate={{ width: `${vrData.animationIntensity * 100}%` }}
                         transition={{ duration: 1 }}
                       />
                     </div>
                   </div>
                 </div>
               </motion.div>
             )}
           </div>
         </div>
       </div>
     </motion.div>
     
     {/* TensorFlow Predictions Section with enhanced animations */}
     <motion.div
       className="relative z-10 w-full max-w-6xl"
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 1.1, duration: 0.7 }}
     >
       <div className="p-6 bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700">
         <motion.h2 
           className="text-2xl font-bold text-white mb-6 flex items-center"
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ delay: 1.3, duration: 0.5 }}
         >
           AI Market Predictions
           <motion.span 
             className="ml-2 px-3 py-1 text-xs bg-blue-600 rounded-full"
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 1.5, type: 'spring' }}
           >
             Powered by TensorFlow
           </motion.span>
         </motion.h2>
         
         <TFPredictionsHoldings />
       </div>
     </motion.div>
   </motion.div>
 );
};

export default VRTradingPit;