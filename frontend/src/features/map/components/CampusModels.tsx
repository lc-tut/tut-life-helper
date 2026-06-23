import { useGLTF } from '@react-three/drei';

import { useEffect } from 'react';
import * as THREE from 'three';

export function CampusModels() {
  const { scene } = useGLTF('/models/tut.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.frustumCulled = false;
        
        const mesh = child as THREE.Mesh;
        if (!mesh.userData.hasEdges) {
          const edges = new THREE.EdgesGeometry(mesh.geometry);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
          );
          mesh.add(line);
          mesh.userData.hasEdges = true;
        }
      }
    });
  }, [scene]);

  return (
    <group position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// モデルのプリロード（パフォーマンス向上のため）
useGLTF.preload('/models/tut.glb');
