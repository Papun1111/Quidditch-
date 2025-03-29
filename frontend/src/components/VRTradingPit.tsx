import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useTexture, Text } from '@react-three/drei';
import { AudioLoader, AudioListener, PositionalAudio, Vector3, Group, Mesh, MeshStandardMaterial } from 'three';
import axios from 'axios';
import * as THREE from 'three';

interface VRTradingPitProps {
  apiUrl?: string;
  updateInterval?: number;
}

interface Trader {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
  activity: number; // 0-1 scale of trading activity
}

// Animated Trading Floor
const TradingFloor: React.FC<{ volatility: number }> = ({ volatility }) => {
  const floorRef = useRef<Mesh>(null);
  const texture = useTexture('/assets/trading-floor.jpg');
  
  useFrame((state) => {
    if (floorRef.current) {
      // Make floor glow based on volatility
      const material = floorRef.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + volatility * 0.4;
    }
  });
  
  return (
    <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={texture} color="white" emissive="#4080ff" emissiveIntensity={0.2} />
    </mesh>
  );
};

// Animated pricing tickers that float in space
const PriceTickers: React.FC<{ volatility: number }> = ({ volatility }) => {
  const groupRef = useRef<Group>(null);
  const [prices, setPrices] = useState({
    BTC: 45000 + Math.random() * 1000,
    ETH: 2500 + Math.random() * 200,
    AAPL: 170 + Math.random() * 10,
    MSFT: 320 + Math.random() * 15,
  });
  
  useEffect(() => {
    // Update prices periodically based on volatility
    const interval = setInterval(() => {
      setPrices(prev => ({
        BTC: prev.BTC * (1 + (Math.random() - 0.5) * 0.02 * volatility),
        ETH: prev.ETH * (1 + (Math.random() - 0.5) * 0.02 * volatility),
        AAPL: prev.AAPL * (1 + (Math.random() - 0.5) * 0.01 * volatility),
        MSFT: prev.MSFT * (1 + (Math.random() - 0.5) * 0.01 * volatility),
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [volatility]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001 + 0.002 * volatility;
    }
  });
  
  const radius = 20;
  const height = 8;
  
  return (
    <group ref={groupRef}>
      {Object.entries(prices).map(([ticker, price], index) => {
        const angle = (index / Object.keys(prices).length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const isUp = price > prices[ticker as keyof typeof prices] - 0.1;
        
        return (
          <Text
            key={ticker}
            position={[x, height, z]}
            rotation={[0, -angle, 0]}
            fontSize={2}
            color={isUp ? '#00ff88' : '#ff4444'}
          >
            {ticker}: {price.toFixed(2)}
          </Text>
        );
      })}
    </group>
  );
};

// Animated traders moving around
const Traders: React.FC<{ volatility: number, count: number }> = ({ volatility, count }) => {
  const tradersRef = useRef<Trader[]>([]);
  
  // Initialize traders if they don't exist
  if (tradersRef.current.length === 0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      tradersRef.current.push({
        id: i,
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ],
        velocity: [
          (Math.random() - 0.5) * 0.1,
          0,
          (Math.random() - 0.5) * 0.1
        ],
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        size: 0.3 + Math.random() * 0.3,
        activity: Math.random()
      });
    }
  }
  
  useFrame((state) => {
    // Update trader positions
    tradersRef.current.forEach(trader => {
      // Add some random movement
      trader.velocity[0] += (Math.random() - 0.5) * 0.01 * volatility;
      trader.velocity[2] += (Math.random() - 0.5) * 0.01 * volatility;
      
      // Apply velocity
      trader.position[0] += trader.velocity[0];
      trader.position[2] += trader.velocity[2];
      
      // Boundary check - keep traders within a radius
      const dist = Math.sqrt(trader.position[0]**2 + trader.position[2]**2);
      if (dist > 20) {
        // Push back toward center
        trader.velocity[0] -= trader.position[0] * 0.01;
        trader.velocity[2] -= trader.position[2] * 0.01;
      }
      
      // Dampen velocity
      trader.velocity[0] *= 0.95;
      trader.velocity[2] *= 0.95;
      
      // Update activity based on volatility
      trader.activity = Math.min(1, Math.max(0, trader.activity + (Math.random() - 0.4) * 0.1 * volatility));
    });
  });
  
  return (
    <group>
      {tradersRef.current.map(trader => (
        <mesh
          key={trader.id}
          position={new Vector3(...trader.position)}
          scale={[trader.size, trader.size + trader.activity * 0.5, trader.size]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={trader.color} emissive={trader.color} emissiveIntensity={trader.activity * 0.5} />
        </mesh>
      ))}
    </group>
  );
};

const CrowdAudio: React.FC<{ volume: number }> = ({ volume }) => {
  const { camera } = useThree();
  const soundRef = useRef<PositionalAudio | null>(null);
  const [listener] = useState(() => new AudioListener());
  
  useEffect(() => {
    camera.add(listener);
    return () => {
      camera.remove(listener);
    };
  }, [camera, listener]);
  
  useEffect(() => {
    // Load audio
    const audioLoader = new AudioLoader();
    audioLoader.load('/assets/crowd.mp3', (buffer) => {
      if (soundRef.current) {
        soundRef.current.setBuffer(buffer);
        soundRef.current.setRefDistance(20);
        soundRef.current.setVolume(volume);
        soundRef.current.setLoop(true);
        soundRef.current.play();
      }
    });
  }, []);
  
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolume(volume);
    }
  }, [volume]);
  
  return <positionalAudio ref={soundRef} args={[listener]} />;
};

// Visual representation of market volatility
const VolatilityIndicator: React.FC<{ volatility: number }> = ({ volatility }) => {
  const pulseRef = useRef<Mesh>(null);
  
  useFrame((state, delta) => {
    if (pulseRef.current) {
      // Make it pulse faster with higher volatility
      pulseRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * (2 + volatility * 5)) * 0.2;
      pulseRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * (2 + volatility * 5)) * 0.2;
      pulseRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * (2 + volatility * 5)) * 0.2;
      
      // Color shifts from blue (calm) to red (volatile)
      const material = pulseRef.current.material as MeshStandardMaterial;
      material.color.setRGB(volatility, 0.3, 1 - volatility);
      material.emissiveIntensity = 0.2 + volatility * 0.8;
    }
  });
  
  return (
    <mesh ref={pulseRef} position={[0, 10, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={0.5} />
    </mesh>
  );
};

// Main scene component
const TradingPitScene: React.FC<{ marketVolatility: number }> = ({ marketVolatility }) => {
  return (
    <>
      <fog attach="fog" args={['#000020', 10, 100]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 15, -10]} intensity={0.5} color="#4080ff" />
      
      <TradingFloor volatility={marketVolatility} />
      <Traders volatility={marketVolatility} count={30} />
      <PriceTickers volatility={marketVolatility} />
      <VolatilityIndicator volatility={marketVolatility} />
      <CrowdAudio volume={0.2 + marketVolatility * 0.8} />
      
      <OrbitControls 
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={50}
      />
    </>
  );
};

const VRTradingPit: React.FC<VRTradingPitProps> = ({ 
  apiUrl = "http://localhost:3000/api/portfolio-risk", 
  updateInterval = 30000 
}) => {
  const [volatility, setVolatility] = useState(0.5);
  const [connecting, setConnecting] = useState(true);
  
  useEffect(() => {
    // Simulate connection process
    setTimeout(() => setConnecting(false), 2000);
    
    // Fetch portfolio risk to map to "market volatility"
    const fetchVolatility = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const res = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Map the portfolioRisk to a volume between 0 and 1
        const risk = res.data.portfolioRisk;
        const vol = Math.min(Math.max(risk / 100, 0), 1);
        setVolatility(vol);
      } catch (error) {
        console.error("Error fetching portfolio risk:", error);
        // Generate some random movement if API fails
        setVolatility(prev => {
          const change = (Math.random() - 0.5) * 0.1;
          return Math.min(Math.max(prev + change, 0), 1);
        });
      }
    };
    
    fetchVolatility();
    const interval = setInterval(fetchVolatility, updateInterval);
    return () => clearInterval(interval);
  }, [apiUrl, updateInterval]);
  
  if (connecting) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000020',
        color: 'white',
        fontSize: '2rem'
      }}>
        Connecting to Trading Pit...
      </div>
    );
  }
  
  return (
    <div style={{ height: '100vh', width: '100%', backgroundColor: '#000' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        Market Volatility: {(volatility * 100).toFixed(1)}%
      </div>
      <Canvas camera={{ position: [0, 5, 20], fov: 75 }}>
        <TradingPitScene marketVolatility={volatility} />
      </Canvas>
    </div>
  );
};

export default VRTradingPit;