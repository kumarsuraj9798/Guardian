import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const Button3D = ({ children, onClick }) => {
  const buttonRef = useRef();
  const { size } = useThree();
  
  // Button animation
  useFrame(({ clock, mouse }) => {
    if (!buttonRef.current) return;
    
    // Get mouse position in normalized device coordinates (-1 to +1)
    const x = (mouse.x * size.width) / size.width;
    const y = (mouse.y * size.height) / size.height;
    
    // Apply subtle 3D tilt based on mouse position
    buttonRef.current.rotation.x = THREE.MathUtils.lerp(
      buttonRef.current.rotation.x,
      -y * 0.2,
      0.1
    );
    buttonRef.current.rotation.y = THREE.MathUtils.lerp(
      buttonRef.current.rotation.y,
      x * 0.2,
      0.1
    );
    
    // Subtle floating animation
    buttonRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <group ref={buttonRef} onClick={onClick}>
      {/* Button base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6, 1.8, 1.2]} />
        <meshStandardMaterial 
          color="#FF3B30"
          metalness={0.2}
          roughness={0.1}
          emissive="#FF453A"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Button top with gradient */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[5.9, 0.9, 1.3]} />
        <meshStandardMaterial 
          color="#FF453A"
          metalness={0.8}
          roughness={0.2}
          emissive="#FF6257"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Button text */}
      <Text
        position={[0, 0.9, 0.7]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
        fontWeight="bold"
      >
        {children}
      </Text>
      
      {/* Glow effect */}
      <pointLight 
        position={[0, 0, 2]} 
        color="#C77DFF" 
        intensity={1} 
        distance={6}
        decay={2}
      />
    </group>
  );
};

export const ThreeDButton = ({ children, onClick, style = {} }) => {
  return (
    <div 
      className="button-3d-container" 
      style={{
        width: '220px',
        height: '70px',
        cursor: 'pointer',
        ...style
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 35 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <Button3D onClick={onClick}>
          {children}
        </Button3D>
      </Canvas>
    </div>
  );
};

export default ThreeDButton;
