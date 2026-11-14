'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Roof, PlacedPanel, SimulationState } from '@/types/solar';
import { calculateSunPosition } from '@/utils/solarCalc';
import { SunShadowControls } from './SunShadowControls';

interface Viewport3DProps {
  roof: Roof;
  panels: PlacedPanel[];
  simulation: SimulationState;
  onSimulationChange: (sim: SimulationState) => void;
}

/**
 * Haqiqiy quyosh paneli yuzasi uchun yuqori aniqlikdagi procedural tekstura
 * To'q ko'k/kulrang tus, monokristall kremniy katakchalar va kumushrang busbar chiziqlari
 */
function createPhotovoltaicTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // 1. Asosiy fotovoltaik monokristall fon (chuqur to'q ko'k-kulrang metallik gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 2048);
  bgGrad.addColorStop(0, '#0B1728');
  bgGrad.addColorStop(0.3, '#10233D');
  bgGrad.addColorStop(0.7, '#162C4B');
  bgGrad.addColorStop(1, '#0C1A2D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 2048);

  // 2. Quyosh kremniy katakchalari (Wafer cells: 10 qator x 6 ustun)
  const cols = 6;
  const rows = 10;
  const padding = 8;
  const cellW = (1024 - (cols + 1) * padding) / cols;
  const cellH = (2048 - (rows + 1) * padding) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padding + c * (cellW + padding);
      const y = padding + r * (cellH + padding);

      // Katak ichki qoplamasi (Anti-reflective coating gradient)
      const cellGrad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
      cellGrad.addColorStop(0, '#0F223D');
      cellGrad.addColorStop(0.5, '#1A355A');
      cellGrad.addColorStop(1, '#0D1E36');
      ctx.fillStyle = cellGrad;

      // Monokristall katak shakli (4 burchagi kesilgan psevdo-kvadrat)
      const chamfer = 12;
      ctx.beginPath();
      ctx.moveTo(x + chamfer, y);
      ctx.lineTo(x + cellW - chamfer, y);
      ctx.lineTo(x + cellW, y + chamfer);
      ctx.lineTo(x + cellW, y + cellH - chamfer);
      ctx.lineTo(x + cellW - chamfer, y + cellH);
      ctx.lineTo(x + chamfer, y + cellH);
      ctx.lineTo(x, y + cellH - chamfer);
      ctx.lineTo(x, y + chamfer);
      ctx.closePath();
      ctx.fill();

      // Nozik gorizontal kumushrang tok o'tkazgich panjaralari (Finger lines)
      ctx.strokeStyle = 'rgba(215, 228, 242, 0.22)';
      ctx.lineWidth = 1.2;
      for (let fy = y + 10; fy < y + cellH - 8; fy += 14) {
        ctx.beginPath();
        ctx.moveTo(x + 5, fy);
        ctx.lineTo(x + cellW - 5, fy);
        ctx.stroke();
      }
    }
  }

  // 3. Multi-Busbar (MBB) — 10 ta vertikal yaltiroq kumushrang o'tkazgich simlar
  const busbarCount = 10;
  const busbarSpacing = 1024 / (busbarCount + 1);
  for (let b = 1; b <= busbarCount; b++) {
    const bx = b * busbarSpacing;
    // O'tkazgich asosi (kumush/kulrang yaltiroq)
    ctx.strokeStyle = 'rgba(226, 235, 245, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, 2048);
    ctx.stroke();

    // Nozik markaziy nur aksi
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, 2048);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  roof,
  panels,
  simulation,
  onSimulationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const panelTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // 1. Sahna va WebGL initsializatsiyasi
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F1EFEA');
    scene.fog = new THREE.FogExp2('#F1EFEA', 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 13, 19);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 2;
    controls.maxDistance = 65;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // Yorug'lik
    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#CBD5E1', 0.65);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#FFF9EB', 2.3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    const d = 28;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Quyosh shari
    const sunGeom = new THREE.SphereGeometry(1.0, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#F59E0B' });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // Yer sathi
    const groundGeom = new THREE.PlaneGeometry(140, 140);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#E5E1D8',
      roughness: 0.85,
      metalness: 0.08,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(80, 80, '#CBD5E1', '#E2E8F0');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Tom guruhi
    const roofGroup = new THREE.Group();
    scene.add(roofGroup);
    roofGroupRef.current = roofGroup;

    // Procedural fotovoltaik tekstura yaratish
    panelTextureRef.current = createPhotovoltaicTexture();

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (panelTextureRef.current) {
        panelTextureRef.current.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. Quyosh pozitsiyasini yangilash
  useEffect(() => {
    if (!sunLightRef.current || !sunMeshRef.current) return;

    const sun = calculateSunPosition(simulation.time, simulation.season);
    const sunDistance = 38;

    const altitudeRad = THREE.MathUtils.degToRad(sun.altitudeDeg);
    const azimuthRad = THREE.MathUtils.degToRad(sun.azimuthDeg);

    const y = Math.sin(altitudeRad) * sunDistance;
    const horizontalDist = Math.cos(altitudeRad) * sunDistance;
    const x = Math.sin(azimuthRad) * horizontalDist;
    const z = Math.cos(azimuthRad) * horizontalDist;

    sunLightRef.current.position.set(x, y, z);
    sunLightRef.current.intensity = sun.altitudeDeg > 0 ? 2.4 * sun.intensity : 0.05;

    sunMeshRef.current.position.set(x, y, z);
    sunMeshRef.current.visible = sun.altitudeDeg > 0;
  }, [simulation.time, simulation.season]);

  // 3. Tom va Panellarni 3D da qayta qurish (Realistik metallik va tekstura bilan)
  useEffect(() => {
    if (!roofGroupRef.current) return;
    const group = roofGroupRef.current;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    const roofWM = roof.width / 100;
    const roofHM = roof.height / 100;
    const roofThicknessM = 0.15;

    // Tom asosi
    const roofGeom = new THREE.BoxGeometry(roofWM, roofThicknessM, roofHM);
    const roofMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.65,
      metalness: 0.1,
    });
    const roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.receiveShadow = true;
    roofMesh.castShadow = true;

    const tiltedGroup = new THREE.Group();
    tiltedGroup.position.y = 1.5;
    tiltedGroup.rotation.x = THREE.MathUtils.degToRad(-roof.pitch);

    tiltedGroup.add(roofMesh);

    // Umumiy materiallar:
    // 1. Panelning fotovoltaik yuzasi (Teksturali, quyosh nurida metallik yaltirovchi shisha va kremniy)
    const panelSurfaceMat = new THREE.MeshPhysicalMaterial({
      map: panelTextureRef.current || undefined,
      color: '#152B4D',
      roughness: 0.14,
      metalness: 0.75,
      clearcoat: 1.0,           // Quyosh nurida haqiqiy quyosh panelidek yarqiraydi
      clearcoatRoughness: 0.08,
      reflectivity: 0.85,
    });

    // 2. Anodlangan kumush/kulrang alyuminiy ramka (Anodized silver-grey aluminum)
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#A1A1AA',
      roughness: 0.24,
      metalness: 0.86,
    });

    // 3. Montaj relslari (Karkas)
    const railMat = new THREE.MeshStandardMaterial({
      color: '#71717A',
      roughness: 0.28,
      metalness: 0.9,
    });

    panels.forEach((p) => {
      const pWM = p.width / 100;
      const pHM = p.height / 100;
      const pThickM = 0.035;

      const posX = p.x / 100 + pWM / 2 - roofWM / 2;
      const posZ = p.y / 100 + pHM / 2 - roofHM / 2;
      const posY = roofThicknessM / 2 + pThickM / 2 + 0.04;

      const panelGroup = new THREE.Group();
      panelGroup.position.set(posX, posY, posZ);

      // Alyuminiy ramka
      const frameGeom = new THREE.BoxGeometry(pWM, pThickM, pHM);
      const frameMesh = new THREE.Mesh(frameGeom, frameMat);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      panelGroup.add(frameMesh);

      // Fotovoltaik ustki shisha/kremniy qatlam
      const cellGeom = new THREE.BoxGeometry(pWM * 0.965, pThickM * 1.06, pHM * 0.965);
      const cellMesh = new THREE.Mesh(cellGeom, panelSurfaceMat);
      cellMesh.castShadow = true;
      cellMesh.receiveShadow = true;
      panelGroup.add(cellMesh);

      // Montaj relslari (karkas)
      const railGeom = new THREE.BoxGeometry(pWM * 1.02, 0.04, 0.04);
      const rail1 = new THREE.Mesh(railGeom, railMat);
      rail1.position.set(0, -pThickM / 2 - 0.02, -pHM / 4);
      rail1.castShadow = true;
      panelGroup.add(rail1);

      const rail2 = new THREE.Mesh(railGeom, railMat);
      rail2.position.set(0, -pThickM / 2 - 0.02, pHM / 4);
      rail2.castShadow = true;
      panelGroup.add(rail2);

      tiltedGroup.add(panelGroup);
    });

    group.rotation.y = THREE.MathUtils.degToRad(-roof.azimuth + 180);
    group.add(tiltedGroup);
  }, [roof, panels]);

  return (
    <div className="relative w-full h-full bg-cream-100 overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      <SunShadowControls
        simulation={simulation}
        onSimulationChange={onSimulationChange}
        roofPitch={roof.pitch}
      />

      <div className="absolute bottom-28 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cream-200 shadow-sm text-xs text-navy-800">
        <div className="font-bold flex items-center gap-1.5 text-navy-950">
          <span>3D Tom: {roof.pitch}° qiyalik</span>
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          Quyosh nuri panel shishasida metallik akslanadi • 360° aylantiring
        </div>
      </div>
    </div>
  );
};
