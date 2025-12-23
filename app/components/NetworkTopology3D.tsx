import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Search, X } from 'lucide-react';

interface PNodeVisualization { 
  id: string;
  position: [number, number, number];
  score: number;
  status: 'active' | 'syncing' | 'offline';
  pubkey?: string;
  version?: string;
  storageCommitted?: number;
  connections: string[];
}

interface NodeSphereProps {
  node: PNodeVisualization;
  onClick: (node: PNodeVisualization) => void;
  selected: boolean;
}

const NodeSphere: React.FC<NodeSphereProps> = ({ node, onClick, selected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1;
      
      if (node.status === 'active') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const getNodeColor = () => {
    if (node.status === 'offline') return '#ef4444';
    if (node.status === 'syncing') return '#f59e0b';
    
    if (node.score >= 90) return '#10b981';
    if (node.score >= 80) return '#3b82f6';
    if (node.score >= 70) return '#8b5cf6';
    return '#f59e0b';
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={node.position}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[selected ? 0.3 : hovered ? 0.25 : 0.2, 32, 32]} />
        <meshStandardMaterial
          color={getNodeColor()}
          emissive={getNodeColor()}
          emissiveIntensity={selected ? 0.8 : hovered ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {(hovered || selected) && (
        <Text
          position={[node.position[0], node.position[1] + 0.5, node.position[2]]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {node.id.slice(0, 8)}...
        </Text>
      )}
      
      {selected && (
        <mesh position={node.position}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial
            color={getNodeColor()}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
};

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ start, end, active }) => {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end]);

  return (
    <Line
      points={points}
      color={active ? '#8b5cf6' : '#374151'}
      lineWidth={active ? 2 : 1}
      transparent
      opacity={active ? 0.6 : 0.2}
    />
  );
};

interface NetworkTopology3DProps {
  nodes: any[];
  onNodeSelect?: (node: any) => void;
}

const NetworkTopology3D: React.FC<NetworkTopology3DProps> = ({ nodes, onNodeSelect }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const controlsRef = useRef<any>(null);

  // Dedupe nodes by pubkey or id
  const uniqueNodes = useMemo(() => {
    const seen = new Set();
    return nodes.filter(node => {
      const key = node.pubkey || node.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [nodes]);

  // Generate 3D positions with simulated connections
  const visualizationNodes: PNodeVisualization[] = useMemo(() => {
    return uniqueNodes.map((node, index) => {
      const phi = Math.acos(-1 + (2 * index) / uniqueNodes.length);
      const theta = Math.sqrt(uniqueNodes.length * Math.PI) * phi;
      
      const radius = 5;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      
      // Simulate connections to nearby nodes
      const connections = uniqueNodes
        .filter((_, i) => i !== index && Math.random() > 0.7)
        .map(n => n.id)
        .slice(0, 3);
      
      return {
        id: node.id,
        position: [x, y, z] as [number, number, number],
        score: node.score || 0,
        status: node.status,
        pubkey: node.pubkey,
        version: node.version,
        storageCommitted: node.storageCommitted,
        connections,
      };
    });
  }, [uniqueNodes]);

  // Generate connection lines
  const connections = useMemo(() => {
    const lines: Array<{
      start: [number, number, number];
      end: [number, number, number];
      active: boolean;
    }> = [];

    visualizationNodes.forEach(node => {
      node.connections.forEach(connId => {
        const connectedNode = visualizationNodes.find(n => n.id === connId);
        if (connectedNode) {
          lines.push({
            start: node.position,
            end: connectedNode.position,
            active: selectedNode === node.id || selectedNode === connId,
          });
        }
      });
    });

    return lines;
  }, [visualizationNodes, selectedNode]);

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSelectedNode(null);
      return;
    }

    const found = visualizationNodes.find(n => 
      n.id.toLowerCase().includes(query.toLowerCase()) ||
      n.pubkey?.toLowerCase().includes(query.toLowerCase())
    );

    if (found && controlsRef.current) {
      setSelectedNode(found.id);
      
      // Move camera to node
      const [x, y, z] = found.position;
      controlsRef.current.target.set(x, y, z);
      controlsRef.current.update();
      
      if (onNodeSelect) {
        const originalNode = uniqueNodes.find(n => n.id === found.id);
        onNodeSelect(originalNode);
      }
    }
  };

  const handleNodeClick = (node: PNodeVisualization) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    if (onNodeSelect) {
      const originalNode = uniqueNodes.find(n => n.id === node.id);
      onNodeSelect(originalNode);
    }
  };

  const selectedNodeData = visualizationNodes.find(n => n.id === selectedNode);

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Connection lines */}
        {connections.map((conn, i) => (
          <ConnectionLine
            key={`conn-${i}`}
            start={conn.start}
            end={conn.end}
            active={conn.active}
          />
        ))}
        
        {/* Nodes */}
        {visualizationNodes.map(node => (
          <NodeSphere
            key={node.pubkey || node.id}
            node={node}
            onClick={handleNodeClick}
            selected={selectedNode === node.id}
          />
        ))}
        
        <gridHelper args={[20, 20, '#374151', '#1f2937']} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={!selectedNode}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by ID or pubkey..."
            className="w-full pl-10 pr-10 py-2 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg text-white text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedNode(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected node info card */}
      {selectedNodeData && (
        <div className="absolute top-20 left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 text-white text-sm w-64 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-purple-400">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">ID:</span>
              <div className="text-xs font-mono break-all">{selectedNodeData.id}</div>
            </div>
            
            {selectedNodeData.pubkey && (
              <div>
                <span className="text-gray-400">Pubkey:</span>
                <div className="text-xs font-mono break-all">
                  {selectedNodeData.pubkey.slice(0, 16)}...
                </div>
              </div>
            )}
            
            <div>
              <span className="text-gray-400">Score:</span>
              <span className="ml-2 font-bold text-green-400">{selectedNodeData.score}</span>
            </div>
            
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 font-semibold ${
                selectedNodeData.status === 'active' ? 'text-green-400' :
                selectedNodeData.status === 'syncing' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {selectedNodeData.status.toUpperCase()}
              </span>
            </div>
            
            {selectedNodeData.version && (
              <div>
                <span className="text-gray-400">Version:</span>
                <span className="ml-2">{selectedNodeData.version}</span>
              </div>
            )}
            
            {selectedNodeData.storageCommitted && (
              <div>
                <span className="text-gray-400">Storage:</span>
                <span className="ml-2">
                  {(selectedNodeData.storageCommitted / (1024 * 1024 * 1024)).toFixed(2)} GB
                </span>
              </div>
            )}
            
            <div>
              <span className="text-gray-400">Connections:</span>
              <span className="ml-2 text-purple-400">{selectedNodeData.connections.length}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
        <div className="font-semibold mb-2">Network Status</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Active (90+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Active (80-89)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Active (70-79)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Syncing / Low Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Offline</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          Click nodes • Drag to rotate • Scroll to zoom
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
        <div className="space-y-1">
          <div>Total: <span className="font-bold">{uniqueNodes.length}</span></div>
          <div>Active: <span className="font-bold text-green-400">
            {uniqueNodes.filter(n => n.status === 'active').length}
          </span></div>
          <div>Syncing: <span className="font-bold text-yellow-400">
            {uniqueNodes.filter(n => n.status === 'syncing').length}
          </span></div>
          <div>Offline: <span className="font-bold text-red-400">
            {uniqueNodes.filter(n => n.status === 'offline').length}
          </span></div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTopology3D;