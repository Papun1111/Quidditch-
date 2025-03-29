import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
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
} from 'recharts';
import { FaSmile, FaMeh, FaFrown } from 'react-icons/fa';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { AudioLoader, AudioListener, PositionalAudio } from 'three';

// Import audio files
import crowd from '../assets/crowd.mp3';
import neutral from '../assets/neutral.mp3';
import sad from '../assets/sad.mp3';
import panic from '../assets/panic.mp3';

interface VRPitData {
  avgPercentChange: number;
  crowdMood: string;
  noiseVolume: number;
  averageVolume: number;
  animationIntensity: number;
  audioLevel: number;
  message: string;
}

const AmbientAudio: React.FC<{ audioLevel: number; avgChange: number; mood: string }> = ({ audioLevel, avgChange, mood }) => {
  const { camera } = useThree();
  const listener = new AudioListener();
  camera.add(listener);
  const soundRef = React.useRef<PositionalAudio>(null);
  const audioLoader = new AudioLoader();

  const getAudioFile = () => {
    const lower = mood.toLowerCase();
    if (lower === 'panic') return panic;
    if (lower === 'concerned') return sad;
    if (lower === 'euphoric') return neutral;
    return crowd;
  };

  useEffect(() => {
    const audioFile = getAudioFile();
    audioLoader.load(audioFile, (buffer) => {
      if (soundRef.current) {
        soundRef.current.setBuffer(buffer);
        soundRef.current.setLoop(true);
        soundRef.current.setVolume(audioLevel);
        soundRef.current.play();
      }
    });
  }, [audioLoader, audioLevel, avgChange, mood]);

  // Ensure AudioContext resumes on user interaction (for autoplay)
  useEffect(() => {
    const resumeAudioContext = () => {
      if (soundRef.current && soundRef.current.context.state === 'suspended') {
        soundRef.current.context.resume();
      }
    };
    document.addEventListener('click', resumeAudioContext);
    return () => document.removeEventListener('click', resumeAudioContext);
  }, []);

  return <positionalAudio ref={soundRef} args={[listener]} />;
};

const VRTradingPitScene: React.FC<{ animationIntensity: number; noiseVolume: number; audioLevel: number; avgPercentChange: number; mood: string }> = ({ animationIntensity, noiseVolume, audioLevel, avgPercentChange, mood }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5 * animationIntensity;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * (animationIntensity * 0.2);
    }
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh ref={meshRef} position={[0, 1, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <OrbitControls />
      <AmbientAudio audioLevel={audioLevel} avgChange={avgPercentChange} mood={mood} />
      <Html position={[0, -1.8, 0]}>
        <motion.div
          className="bg-black bg-opacity-70 p-3 rounded-lg text-white text-sm shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>Noise Volume: {noiseVolume}</p>
          <p>Animation Intensity: {animationIntensity.toFixed(2)}</p>
          <p>Audio Level: {audioLevel.toFixed(2)}</p>
          <p>Avg Change: {avgPercentChange}%</p>
        </motion.div>
      </Html>
    </>
  );
};

const moodIcon = (mood: string) => {
  switch (mood.toLowerCase()) {
    case 'panic':
      return <FaFrown className="text-red-500 inline-block ml-2" />;
    case 'concerned':
      return <FaFrown className="text-orange-400 inline-block ml-2" />;
    case 'euphoric':
      return <FaSmile className="text-green-400 inline-block ml-2" />;
    case 'optimistic':
      return <FaSmile className="text-blue-400 inline-block ml-2" />;
    default:
      return <FaMeh className="text-gray-400 inline-block ml-2" />;
  }
};

const VRTradingPit: React.FC = () => {
  const [vrData, setVrData] = useState<VRPitData | null>(null);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initial HTTP fetch as fallback
  useEffect(() => {
    const fetchVRData = async () => {
      try {
        const res = await axios.get<VRPitData>('http://localhost:3000/api/vr-trading-pit');
        setVrData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching VR trading pit data');
      }
    };
    fetchVRData();
  }, []);

  // Setup Socket.IO for live updates
  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);
    newSocket.on("vrData", (data: VRPitData) => {
      setVrData(data);
    });
    return () => newSocket.disconnect();
  }, []);

  // Prepare chart data using fallback values
  const barData = [
    { name: 'Market Change', value: vrData ? vrData.avgPercentChange : 0 },
    { name: 'Noise Volume', value: vrData ? vrData.noiseVolume : 40 },
    { name: 'Avg Volume', value: vrData ? vrData.averageVolume : 0 }
  ];
  const histogramData = Array.from({ length: 7 }, (_, i) => ({
    name: `Bin ${i + 1}`,
    value: Math.floor(Math.random() * 100)
  }));
  const pieData = [
    { name: 'Mood', value: 1, mood: vrData ? vrData.crowdMood : 'neutral' }
  ];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Info Section */}
      <motion.div
        className="p-8 text-center bg-gray-700 bg-opacity-80 rounded-2xl shadow-2xl mb-8 max-w-2xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 className="text-5xl font-extrabold mb-4 text-white">
          VR Trading Pit {vrData && moodIcon(vrData.crowdMood)}
        </h2>
        {error && <p className="text-red-400">{error}</p>}
        {vrData && (
          <motion.div
            className="mb-6 space-y-3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-2xl text-gray-200">Market Change: {vrData.avgPercentChange}%</p>
            <p className="text-2xl text-gray-200">Crowd Mood: {vrData.crowdMood}</p>
            <p className="text-2xl text-gray-200">Average Volume: {vrData.averageVolume}</p>
            <p className="text-2xl text-gray-200">{vrData.message}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Charts Section */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Bar Chart */}
        <motion.div
          className="bg-white rounded-lg shadow-xl p-4"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-2 text-gray-800">Market Metrics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip />
              <Bar dataKey="value" fill="#4A90E2" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Pie Chart for Mood */}
        <motion.div
          className="bg-white rounded-lg shadow-xl p-4 flex flex-col items-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-2 text-gray-800">Current Mood</h3>
          <ResponsiveContainer width="100%" height={250}>
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
                <Cell fill={vrData ? (vrData.crowdMood.toLowerCase() === 'panic' ? '#F44336' : vrData.crowdMood.toLowerCase() === 'concerned' ? '#FFC107' : '#4CAF50') : '#999'} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Histogram */}
        <motion.div
          className="bg-white rounded-lg shadow-xl p-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-2 text-gray-800">Volume Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={histogramData}>
              <XAxis dataKey="name" stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip />
              <Bar dataKey="value" fill="#4A90E2" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 3D Scene Section with Ambient Audio */}
      <motion.div
        className="h-[500px] w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Canvas>
          <VRTradingPitScene
            noiseVolume={vrData ? vrData.noiseVolume : 40}
            animationIntensity={vrData ? vrData.animationIntensity : 0.5}
            audioLevel={vrData ? vrData.audioLevel : 0.4}
            avgPercentChange={vrData ? vrData.avgPercentChange : 0}
            mood={vrData ? vrData.crowdMood : 'neutral'}
          />
        </Canvas>
      </motion.div>
    </motion.div>
  );
};

export default VRTradingPit;
