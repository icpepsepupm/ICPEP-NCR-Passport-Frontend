"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import { AdaptiveDpr, Center, Environment, OrbitControls, Preload, useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type { Group } from "three";

function CoinModel(props: ThreeElements["group"]) {
  const gltf = useGLTF("/icpep_coin.glb") as GLTF;
  // The glTF may have the mesh as the scene root; render it directly.
  return <primitive object={gltf.scene as Group} {...props} />;
}
// Preload for faster first paint
useGLTF.preload("/icpep_coin.glb");

export default function IcpepCoin() {
  const [auto, setAuto] = React.useState(true);
  React.useEffect(() => {
    const onVis = () => setAuto(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={0.9} />

        <Suspense fallback={null}>
          <Center>
            {/* Scale down further to fit fully in view */}
            <group scale={0.65}>
              <CoinModel />
            </group>
          </Center>
          {/* Subtle image-based lighting */}
          <Environment preset="city" />
          <Preload all />
          <AdaptiveDpr pixelated />
        </Suspense>

        {/* User interaction: limit to rotate only, with gentle autorotation */}
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={auto} autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
