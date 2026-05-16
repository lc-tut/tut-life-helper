import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export function CameraRig({ targetPosition }: { targetPosition: THREE.Vector3 }) {
  const controlsRef = useRef<any>();
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (targetPosition) {
      isTransitioning.current = true;
    }
  }, [targetPosition]);

  useFrame(() => {
    if (controlsRef.current && isTransitioning.current && targetPosition) {
      // スムーズにカメラの注視点（Target）を選択した階へ移動
      controlsRef.current.target.lerp(targetPosition, 0.1);
      
      // 目標に十分近づいたらアニメーションを終了し、自由な操作を許可
      if (controlsRef.current.target.distanceTo(targetPosition) < 0.05) {
        isTransitioning.current = false;
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={true} 
      enableZoom={true} 
      enableRotate={true}
      maxPolarAngle={Math.PI / 2.2} 
      minPolarAngle={0} // 真上から見下ろせるように制限を緩和
      makeDefault
      onStart={() => {
        // ユーザーが手動でカメラ操作（パンや回転）を始めたら自動移動をキャンセル
        isTransitioning.current = false;
      }}
    />
  );
}
