import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AvatarParameters, ClothingItem, ClothingType } from '../types';
import { ZoomIn, ZoomOut, Maximize, Play, Pause, Compass } from 'lucide-react';

interface ThreeAvatarViewerProps {
  avatar: AvatarParameters;
  activeGarments: ClothingItem[];
  cameraPreset: 'fullbody' | 'torso' | 'headshot';
}

// ================= COGNITIVE HIGH-FIDELITY HUMAN BODY PROCEDURAL TEXTURING & MODELING PIPELINE =================

function createSkinNoiseTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // Fill base grey/neutral for bump map
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  
  // Create micro pore noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, 128 + noise));
    data[i+1] = Math.min(255, Math.max(0, 128 + noise));
    data[i+2] = Math.min(255, Math.max(0, 128 + noise));
  }
  ctx.putImageData(imgData, 0, 0);
  
  // Subtle organic unevenness / skin grain
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 300; i++) {
    const r = Math.random() * 4 + 1;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  return texture;
}

function createSkinColorTexture(skinToneHex: string, gender: string = 'none') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.fillStyle = skinToneHex;
  ctx.fillRect(0, 0, size, size);
  
  // Create a canvas texture with organic warmth / tonal variations
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // fine grain blood-flow vascular variations (subtle pink and peach micro tints)
    const deviation = (Math.random() - 0.5) * 10;
    const warmFactor = Math.random() > 0.82 ? 6 : 0;
    
    data[i] = Math.min(255, Math.max(0, data[i] + deviation + warmFactor));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + deviation - warmFactor * 0.4));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + deviation));
  }
  ctx.putImageData(imgData, 0, 0);

  if (gender !== 'none') {
    // Add professional organic facial cosmetic features for high photorealism on 2D skin layout:
    // Forehead soft skin glow in center
    const gradForehead = ctx.createLinearGradient(0, 0, 0, size * 0.4);
    gradForehead.addColorStop(0, 'rgba(255, 240, 230, 0.1)');
    gradForehead.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradForehead;
    ctx.fillRect(0, 0, size, size * 0.4);

    // Warm undertone blush around cheek areas
    const blushGradL = ctx.createRadialGradient(size * 0.28, size * 0.48, 5, size * 0.28, size * 0.48, 90);
    blushGradL.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
    blushGradL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blushGradL;
    ctx.beginPath();
    ctx.arc(size * 0.28, size * 0.48, 90, 0, Math.PI * 2);
    ctx.fill();

    const blushGradR = ctx.createRadialGradient(size * 0.72, size * 0.48, 5, size * 0.72, size * 0.48, 90);
    blushGradR.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
    blushGradR.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blushGradR;
    ctx.beginPath();
    ctx.arc(size * 0.72, size * 0.48, 90, 0, Math.PI * 2);
    ctx.fill();

    // Jaw ambient shadowing
    const gradSidesL = ctx.createLinearGradient(0, 0, size * 0.22, 0);
    gradSidesL.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
    gradSidesL.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradSidesL;
    ctx.fillRect(0, 0, size * 0.22, size);

    const gradSidesR = ctx.createLinearGradient(size * 0.78, 0, size, 0);
    gradSidesR.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradSidesR.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
    ctx.fillStyle = gradSidesR;
    ctx.fillRect(size * 0.78, 0, size * 0.22, size);

    if (gender === 'male') {
      // Short stubble mustache shadow below nose / above lips
      const mustacheGrad = ctx.createRadialGradient(size * 0.5, size * 0.64, size * 0.02, size * 0.5, size * 0.64, size * 0.16);
      mustacheGrad.addColorStop(0, 'rgba(38, 42, 53, 0.28)');
      mustacheGrad.addColorStop(0.6, 'rgba(38, 42, 53, 0.14)');
      mustacheGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mustacheGrad;
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 0.64, size * 0.14, size * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();

      // Professional 5 o'clock stubble beard shadow along bottom chin & jawline
      const beardGrad = ctx.createRadialGradient(size * 0.5, size * 0.82, size * 0.08, size * 0.5, size * 0.82, size * 0.28);
      beardGrad.addColorStop(0, 'rgba(28, 31, 38, 0.32)');
      beardGrad.addColorStop(0.7, 'rgba(28, 31, 38, 0.15)');
      beardGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beardGrad;
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.82, size * 0.28, 0, Math.PI, false);
      ctx.fill();

      // Sideburns shadow extending vertically down
      const sideShadowMat = ctx.createLinearGradient(0, 0, size * 0.18, 0);
      sideShadowMat.addColorStop(0, 'rgba(28, 31, 38, 0.24)');
      sideShadowMat.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sideShadowMat;
      ctx.fillRect(0, size * 0.25, size * 0.18, size * 0.44);

      const sideShadowMatR = ctx.createLinearGradient(size * 0.82, 0, size, 0);
      sideShadowMatR.addColorStop(0, 'rgba(0, 0, 0, 0)');
      sideShadowMatR.addColorStop(1, 'rgba(28, 31, 38, 0.24)');
      ctx.fillStyle = sideShadowMatR;
      ctx.fillRect(size * 0.82, size * 0.25, size * 0.18, size * 0.44);

      // Micro speckles representing stubble hair roots
      ctx.fillStyle = 'rgba(20, 22, 28, 0.16)';
      for (let s = 0; s < 1200; s++) {
        const theta = Math.random() * Math.PI;
        const rad = size * (0.05 + Math.random() * 0.22);
        const sx = size * 0.5 + Math.cos(theta) * rad;
        const sy = size * 0.8 + Math.sin(theta) * rad;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  if (gender === 'none') {
    texture.repeat.set(4, 4);
  } else {
    // Exact mapping for detailed face
    texture.repeat.set(1, 1);
  }
  return texture;
}

function createHairStrandsTexture(hairColorHex: string) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.fillStyle = hairColorHex;
  ctx.fillRect(0, 0, size, size);
  
  // Add dark/light linear strands
  for (let i = 0; i < size; i += 2) {
    const deviation = (Math.random() - 0.5) * 45;
    const baseCol = new THREE.Color(hairColorHex);
    // Draw individual strands with tiny shading difference
    ctx.fillStyle = `rgba(${Math.floor(baseCol.r*255 + deviation)}, ${Math.floor(baseCol.g*255 + deviation)}, ${Math.floor(baseCol.b*255 + deviation)}, 0.4)`;
    ctx.fillRect(i, 0, 2, size);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

function createKnitBumpTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  
  // High fidelity knit rib lanes
  ctx.fillStyle = '#b0b0b0';
  for (let i = 0; i < size; i += 16) {
    ctx.fillRect(i, 0, 8, size);
    
    // Fine vertical grain shading inside ribs
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(i + 2, 0, 4, size);
    ctx.fillStyle = '#b0b0b0';
  }
  
  // Horizontal threads
  ctx.fillStyle = '#505050';
  for (let j = 0; j < size; j += 4) {
    ctx.fillRect(0, j, size, 1);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

function createIrisTexture(colorHex: number) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const xc = size / 2;
  const yc = size / 2;
  
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, size, size);
  
  const baseColor = '#' + colorHex.toString(16).padStart(6, '0');
  
  // Create beautiful iris gradient
  const grad = ctx.createRadialGradient(xc, yc, size * 0.05, xc, yc, size * 0.5);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.25, baseColor);
  grad.addColorStop(0.78, baseColor);
  grad.addColorStop(1.0, '#000000');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(xc, yc, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw iris spokes
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  for (let angle = 0; angle < 360; angle += 4) {
    const rad = angle * Math.PI / 180;
    const len = size * (0.15 + Math.random() * 0.3);
    const x1 = xc + Math.cos(rad) * (size * 0.08);
    const y1 = yc + Math.sin(rad) * (size * 0.08);
    const x2 = xc + Math.cos(rad) * len;
    const y2 = yc + Math.sin(rad) * len;
    
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Darker fibers
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.8;
  for (let angle = 2; angle < 360; angle += 8) {
    const rad = angle * Math.PI / 180;
    const len = size * (0.2 + Math.random() * 0.22);
    const x1 = xc + Math.cos(rad) * (size * 0.12);
    const y1 = yc + Math.sin(rad) * (size * 0.12);
    const x2 = xc + Math.cos(rad) * len;
    const y2 = yc + Math.sin(rad) * len;
    
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createLipsTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // neutral gray base for bump mapping
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  
  // Lip rugae/wrinkles details
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1.5;
  for (let i = 8; i < size - 8; i += 5) {
    ctx.beginPath();
    ctx.moveTo(i, 20);
    ctx.bezierCurveTo(
      i - 4 + Math.random() * 8, 80,
      i - 4 + Math.random() * 8, 170,
      i, 236
    );
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createOrganicLimbGeometry(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments: number,
  bulgePositionRatio: number,
  bulgeScale: number
) {
  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 32);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (height / 2 - v.y) / height;
    const sigma = 0.16;
    const exponent = -Math.pow(t - bulgePositionRatio, 2) / (2 * Math.pow(sigma, 2));
    const factor = 1 + (bulgeScale - 1) * Math.exp(exponent);
    
    v.x *= factor;
    v.z *= factor;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return geom;
}

function createRealisticHeadGeometry(headSize: number) {
  const geom = new THREE.SphereGeometry(headSize * 0.44, 48, 48);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    
    // Core Sockets indentation around eyelevel (y ~ 0)
    if (v.z > 0 && Math.abs(v.y) < headSize * 0.08) {
      const eyeOffset = headSize * 0.16;
      const leftEyeDist = Math.sqrt(Math.pow(v.x + eyeOffset, 2) + Math.pow(v.y, 2));
      const rightEyeDist = Math.sqrt(Math.pow(v.x - eyeOffset, 2) + Math.pow(v.y, 2));
      const minDist = Math.min(leftEyeDist, rightEyeDist);
      
      if (minDist < headSize * 0.12) {
        const shrinkFactor = 0.14 * Math.cos((minDist / (headSize * 0.12)) * Math.PI * 0.5);
        v.z -= shrinkFactor * headSize;
        v.x *= (1 - shrinkFactor * 0.2);
      }
    }
    
    // Pronounced fashion high zygomatic cheekbones
    if (v.z > 0 && v.y < -headSize * 0.04 && v.y > -headSize * 0.25) {
      const cheekOffset = headSize * 0.26;
      const cheekLvl = -headSize * 0.12;
      const leftCheekDist = Math.sqrt(Math.pow(v.x + cheekOffset, 2) + Math.pow(v.y - cheekLvl, 2));
      const rightCheekDist = Math.sqrt(Math.pow(v.x - cheekOffset, 2) + Math.pow(v.y - cheekLvl, 2));
      const cheekDist = Math.min(leftCheekDist, rightCheekDist);
      
      if (cheekDist < headSize * 0.15) {
        const bulgeFactor = 0.08 * Math.cos((cheekDist / (headSize * 0.15)) * Math.PI * 0.5);
        v.z += bulgeFactor * headSize;
        v.x *= (1 + bulgeFactor * 0.08);
      }
    }
    
    // Heart-shaped/anatomically tapered jaw and chin
    if (v.y < -headSize * 0.08) {
      const jawFactor = ( -v.y - headSize * 0.08 ) / (headSize * 0.36);
      const taper = 1.0 - Math.min(1.0, jawFactor) * 0.23;
      v.x *= taper;
      
      if (v.z > 0 && Math.abs(v.x) < headSize * 0.1) {
        const chinFactor = 0.05 * (1.0 - Math.abs(v.x) / (headSize * 0.1));
        v.z += chinFactor * headSize;
        v.y += chinFactor * headSize * 0.1;
      }
    }
    
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return geom;
}

export default function ThreeAvatarViewer({
  avatar,
  activeGarments,
  cameraPreset
}: ThreeAvatarViewerProps) {
  const activeGarmentsKey = activeGarments.map(g => g.id).join(',');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // State for interactive overrides
  const [isRotating, setIsRotating] = useState(true);
  const [animationMode, setAnimationMode] = useState<'idle' | 'walk'>('idle');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Model parts refs for animation
  const skeletonRef = useRef<{
    skeletonGroup: THREE.Group;
    head: THREE.Group;
    torso: THREE.Group;
    leftUpperArm: THREE.Object3D;
    rightUpperArm: THREE.Object3D;
    leftForearm: THREE.Object3D;
    rightForearm: THREE.Object3D;
    leftThigh: THREE.Object3D;
    rightThigh: THREE.Object3D;
    leftCalf: THREE.Object3D;
    rightCalf: THREE.Object3D;
  } | null>(null);

  // Manual touch / mouse drag rotation states
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const modelRotationRef = useRef({ x: 0, y: 0 });

  // 1. Generate Parametric Dimensions based on parameters
  const getProportions = (params: AvatarParameters) => {
    // Proportions change from infancy to adulthood
    const ageFactor = params.age < 1 ? 0.35 : params.age < 5 ? 0.55 : params.age < 12 ? 0.75 : 1.0;
    
    // Base dimensions in units (1 unit = ~1 meter)
    let height = (params.height / 100); // e.g. 1.72m
    let headRatio = params.age < 1 ? 0.23 : params.age < 5 ? 0.18 : 0.13; // head size relative to height

    let chestWidth = 0.32 * ageFactor;
    let chestThickness = 0.18 * ageFactor;
    let waistWidth = 0.26 * ageFactor;
    let hipWidth = 0.3 * ageFactor;
    let legLength = height * 0.5;
    let armLength = height * 0.4;
    
    // Body Shape modifies widths and thicknesses
    switch (params.bodyShape) {
      case 'athletic':
        chestWidth *= 1.15;
        waistWidth *= 0.95;
        hipWidth *= 1.0;
        break;
      case 'muscular':
        chestWidth *= 1.25;
        chestThickness *= 1.25;
        waistWidth *= 0.95;
        hipWidth *= 0.98;
        break;
      case 'slim':
        chestWidth *= 0.85;
        chestThickness *= 0.82;
        waistWidth *= 0.84;
        hipWidth *= 0.85;
        break;
      case 'curvy':
        chestWidth *= 1.02;
        waistWidth *= 0.88;
        hipWidth *= 1.28;
        break;
      case 'plus':
        chestWidth *= 1.2;
        chestThickness *= 1.25;
        waistWidth *= 1.35;
        hipWidth *= 1.25;
        break;
      case 'regular':
      default:
        break;
    }

    // Gender adaptations
    if (params.gender === 'male') {
      chestWidth *= 1.12;
      hipWidth *= 0.94;
      waistWidth *= 1.02;
    } else if (params.gender === 'female') {
      chestWidth *= 0.94;
      hipWidth *= 1.12;
      waistWidth *= 0.90;
    }

    return {
      height,
      headRatio,
      chestWidth,
      chestThickness,
      waistWidth,
      hipWidth,
      legLength,
      armLength,
      ageFactor
    };
  };

  // 2. Camera presets animation hook
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    let targetY = 1.0;
    let targetZ = 3.0 / zoomLevel;

    if (cameraPreset === 'headshot') {
      const proportions = getProportions(avatar);
      targetY = proportions.height - (proportions.height * proportions.headRatio * 0.5) - 0.05;
      targetZ = 1.0 / zoomLevel;
    } else if (cameraPreset === 'torso') {
      const proportions = getProportions(avatar);
      targetY = proportions.height * 0.65;
      targetZ = 1.7 / zoomLevel;
    } else {
      targetY = getProportions(avatar).height * 0.52;
      targetZ = 2.6 / zoomLevel;
    }

    const startY = camera.position.y;
    const startZ = camera.position.z;
    const duration = 600;
    const startTime = performance.now();

    function animCamera(now: number) {
      if (!cameraRef.current) return;
      const progress = Math.min((now - startTime) / duration, 1);
      const t = progress * (2 - progress);
      cameraRef.current.position.y = startY + (targetY - startY) * t;
      cameraRef.current.position.z = startZ + (targetZ - startZ) * t;
      cameraRef.current.lookAt(new THREE.Vector3(0, targetY, 0));
      if (progress < 1) {
        requestAnimationFrame(animCamera);
      }
    }
    requestAnimationFrame(animCamera);
  }, [cameraPreset, zoomLevel, avatar]);

  // 3. Build & Rebuild WebGL Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0c101d');
    scene.fog = new THREE.FogExp2('#0c101d', 0.12);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    
    const prop = getProportions(avatar);
    camera.position.set(0, prop.height * 0.5, 2.6);
    camera.lookAt(new THREE.Vector3(0, prop.height * 0.5, 0));

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight('#263252', 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.4);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const softFillLight = new THREE.DirectionalLight('#7c3aed', 0.55);
    softFillLight.position.set(-3, 3, -2);
    scene.add(softFillLight);

    const rimLight = new THREE.DirectionalLight('#06b6d4', 0.4);
    rimLight.position.set(0, -1, -3);
    scene.add(rimLight);

    // Floor Mesh shadow receiver
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 24, '#475569', '#1e293b');
    grid.position.y = 0.001;
    scene.add(grid);

    // 4. Construct Parametric High-Fidelity Human Body Mannequin (Truly Seamless and Lifelike)
    const config = getProportions(avatar);
    const skeletonGroup = new THREE.Group();
    scene.add(skeletonGroup);

    // Real-time procedural high-resolution textures
    const skinNoiseMap = createSkinNoiseTexture();
    const bodySkinColorMap = createSkinColorTexture(avatar.skinTone, 'none');
    const faceSkinColorMap = createSkinColorTexture(avatar.skinTone, avatar.gender);
    const hairStrandMap = createHairStrandsTexture(avatar.gender === 'female' ? '#2b1b13' : '#141a24');
    const eyeIrisMap = createIrisTexture(avatar.gender === 'female' ? 0x22c55e : 0x2563eb);
    const lipBumpMap = createLipsTexture();
    const knitBumpMap = createKnitBumpTexture();

    const texturesToDispose: THREE.Texture[] = [];
    if (skinNoiseMap) texturesToDispose.push(skinNoiseMap);
    if (bodySkinColorMap) texturesToDispose.push(bodySkinColorMap);
    if (faceSkinColorMap) texturesToDispose.push(faceSkinColorMap);
    if (hairStrandMap) texturesToDispose.push(hairStrandMap);
    if (eyeIrisMap) texturesToDispose.push(eyeIrisMap);
    if (lipBumpMap) texturesToDispose.push(lipBumpMap);
    if (knitBumpMap) texturesToDispose.push(knitBumpMap);

    // Highly premium physical skin material simulating organic blood-flow subsurface scattering
    const skinMaterial = new THREE.MeshPhysicalMaterial({
      map: bodySkinColorMap || undefined,
      bumpMap: skinNoiseMap || undefined,
      bumpScale: 0.0018, // micro pores!
      roughnessMap: skinNoiseMap || undefined,
      roughness: 0.38,
      metalness: 0.01,
      clearcoat: 0.16,
      clearcoatRoughness: 0.32,
      sheen: 0.65,
      sheenColor: new THREE.Color('#ffa6a6'), // warm subsurface blood glow
      transmission: 0.12,
      thickness: 0.35,
      ior: 1.45
    });

    // Dedicated smooth face skin material with elevated subsurface scattering and gloss details
    const faceMaterial = new THREE.MeshPhysicalMaterial({
      map: faceSkinColorMap || undefined,
      bumpMap: skinNoiseMap || undefined,
      bumpScale: 0.0015,
      roughnessMap: skinNoiseMap || undefined,
      roughness: 0.34,
      metalness: 0.01,
      clearcoat: 0.22,
      clearcoatRoughness: 0.28,
      sheen: 0.72,
      sheenColor: new THREE.Color('#ffb3b3'),
      transmission: 0.15,
      thickness: 0.3,
      ior: 1.43
    });

    // Create dynamic layered fabric clothing materials based on category selections
    const createGarmentMaterial = (colorHex: string, type: string, imageUrl?: string) => {
      // Apply realistic ribbed woven knit textures for tops and outerwear (like knits/sweaters/polos)
      const isKnit = colorHex.toLowerCase() === '#d6c5b3' || type === 'top' || type === 'outerwear';
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: isKnit ? 0.8 : 0.60,
        metalness: isKnit ? 0.02 : 0.12,
        bumpMap: isKnit ? (knitBumpMap || undefined) : undefined,
        bumpScale: 0.015
      });

      if (imageUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin('anonymous');
        textureLoader.load(
          imageUrl,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.set(1, 1);
            texture.offset.set(0.5, 0); // Centers the front design of the garment directly facing the camera
            mat.map = texture;
            // Tint with a light shade so the original uploaded pattern's actual color details are prominent
            mat.color.set('#ffffff');
            mat.needsUpdate = true;
          },
          undefined,
          (err) => {
            console.warn('Could not load garment texture, falling back to color tint.', err);
          }
        );
      }

      return mat;
    };

    const headSize = config.height * config.headRatio;
    const bodyHeight = config.height - headSize - config.legLength;

    // A. Torso Master Group (combining Pelvis, Abdomen, Chest, Bust definitions for organic beauty)
    const torsoGroup = new THREE.Group() as any; 
    const torsoY = config.legLength + (bodyHeight / 2);
    torsoGroup.position.y = torsoY;
    skeletonGroup.add(torsoGroup);

    // 1. Pelvis Mesh (Spheroid representing hips)
    const pelvisGeo = new THREE.SphereGeometry(1, 32, 32);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, skinMaterial);
    pelvisMesh.scale.set(config.hipWidth * 0.48, bodyHeight * 0.3, config.chestThickness * 0.46);
    pelvisMesh.position.set(0, -bodyHeight * 0.35, 0);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    torsoGroup.add(pelvisMesh);

    // 2. Abdomen/Waist Mesh (tapering upward)
    const waistGeo = new THREE.CylinderGeometry(config.waistWidth * 0.45, config.hipWidth * 0.48, bodyHeight * 0.38, 32);
    const waistMesh = new THREE.Mesh(waistGeo, skinMaterial);
    waistMesh.position.set(0, -bodyHeight * 0.05, 0);
    waistMesh.castShadow = true;
    waistMesh.receiveShadow = true;
    torsoGroup.add(waistMesh);

    // 3. Upper Chest/Bust Spheroid
    const chestGeo = new THREE.SphereGeometry(1, 32, 32);
    const chestMesh = new THREE.Mesh(chestGeo, skinMaterial);
    chestMesh.scale.set(config.chestWidth * 0.5, bodyHeight * 0.45, config.chestThickness * 0.5);
    chestMesh.position.set(0, bodyHeight * 0.28, 0);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    torsoGroup.add(chestMesh);

    // 4. Shoulder ball joints for elegant smooth arm attachments
    const jointRadius = 0.055 * config.ageFactor;
    const shoulderGeo = new THREE.SphereGeometry(jointRadius, 32, 32);
    
    const leftShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
    leftShoulder.position.set(-config.chestWidth * 0.54, bodyHeight * 0.38, 0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
    rightShoulder.position.set(config.chestWidth * 0.54, bodyHeight * 0.38, 0);
    torsoGroup.add(rightShoulder);

    // 5. Hip skeletal joint spheres to completely close thigh gaps during split motions
    const thighRadius = 0.075 * config.ageFactor;
    const hipJointRadius = thighRadius * 1.05;
    const hipJointGeo = new THREE.SphereGeometry(hipJointRadius, 32, 32);

    const leftHipJoint = new THREE.Mesh(hipJointGeo, skinMaterial);
    leftHipJoint.position.set(-config.hipWidth * 0.24, -bodyHeight * 0.35, 0);
    torsoGroup.add(leftHipJoint);

    const rightHipJoint = new THREE.Mesh(hipJointGeo, skinMaterial);
    rightHipJoint.position.set(config.hipWidth * 0.24, -bodyHeight * 0.35, 0);
    torsoGroup.add(rightHipJoint);

    // 6. Seamless Hip-Bridging Athletic Undergarment Base Layer (prevents void-gaps around crotch/torso)
    const underwearMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.gender === 'female' ? '#111827' : '#1e293b'),
      roughness: 0.72,
      metalness: 0.1
    });

    // Elegant briefs cylinder overlapping pelvis and upper thigh sockets nicely
    const briefsGeo = new THREE.CylinderGeometry(
      config.hipWidth * 0.51,
      config.hipWidth * 0.48,
      bodyHeight * 0.35,
      32
    );
    const briefs = new THREE.Mesh(briefsGeo, underwearMaterial);
    briefs.position.set(0, -bodyHeight * 0.32, 0);
    briefs.castShadow = true;
    torsoGroup.add(briefs);

    if (avatar.gender === 'female') {
      // Sporty top bands
      const sportsBraGeo = new THREE.CylinderGeometry(
        config.chestWidth * 0.51,
        config.waistWidth * 0.51,
        bodyHeight * 0.22,
        32
      );
      const sportsBra = new THREE.Mesh(sportsBraGeo, underwearMaterial);
      sportsBra.position.set(0, bodyHeight * 0.22, 0);
      sportsBra.castShadow = true;
      torsoGroup.add(sportsBra);
    } else {
      // Male athletic waistband
      const waistBandGeo = new THREE.CylinderGeometry(
        config.waistWidth * 0.5,
        config.hipWidth * 0.49,
        bodyHeight * 0.1,
        32
      );
      const waistBand = new THREE.Mesh(waistBandGeo, underwearMaterial);
      waistBand.position.set(0, -bodyHeight * 0.18, 0);
      torsoGroup.add(waistBand);
    }

    // 7. Gender Specific Anatomical Enhancements
    if (avatar.gender === 'female') {
      // Add curvaceous breast spheres on the upper chest
      const breastGeo = new THREE.SphereGeometry(bodyHeight * 0.1, 32, 32);
      const isCurvyOrPlus = avatar.bodyShape === 'curvy' || avatar.bodyShape === 'plus';
      const breastScale = isCurvyOrPlus ? 1.25 : 1.0;
      
      const leftBreast = new THREE.Mesh(breastGeo, skinMaterial);
      leftBreast.position.set(-config.chestWidth * 0.22, bodyHeight * 0.22, config.chestThickness * 0.42);
      leftBreast.scale.set(1, 0.95, 1.2 * breastScale);
      torsoGroup.add(leftBreast);

      const rightBreast = new THREE.Mesh(breastGeo, skinMaterial);
      rightBreast.position.set(config.chestWidth * 0.22, bodyHeight * 0.22, config.chestThickness * 0.42);
      rightBreast.scale.set(1, 0.95, 1.2 * breastScale);
      torsoGroup.add(rightBreast);
    } else if (avatar.gender === 'male') {
      // Add pronounced athletic chest pecs coordinates
      const pecGeo = new THREE.BoxGeometry(config.chestWidth * 0.38, bodyHeight * 0.18, config.chestThickness * 0.12);
      const malePecs = new THREE.Mesh(pecGeo, skinMaterial);
      malePecs.position.set(0, bodyHeight * 0.26, config.chestThickness * 0.44);
      torsoGroup.add(malePecs);
    }

    // B. Neck & Anatomical Head with Facial features and Stylish Hair wig
    const neckHeight = bodyHeight * 0.2;
    const neckRadius = 0.045 * config.ageFactor;
    const neckGeo = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.set(0, bodyHeight * 0.55, 0);
    neck.castShadow = true;
    torsoGroup.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, bodyHeight * 0.56 + (headSize * 0.5), 0);
    torsoGroup.add(headGroup);

    // Anatomical Skull Ellipsoid (Sculpted organic shape with sockets and cheekbones)
    const headGeo = createRealisticHeadGeometry(headSize);
    const headSkull = new THREE.Mesh(headGeo, faceMaterial);
    headSkull.castShadow = true;
    headGroup.add(headSkull);

    // Tapered Jawline Chin segment
    const jawGeo = new THREE.CylinderGeometry(headSize * 0.24, headSize * 0.12, headSize * 0.34, 32);
    const jawChin = new THREE.Mesh(jawGeo, faceMaterial);
    jawChin.position.set(0, -headSize * 0.28, headSize * 0.05);
    jawChin.rotation.x = 0.18;
    headGroup.add(jawChin);

    // Beautiful Smooth Nose Tip and Bridge instead of geometric cones
    const noseGeo = new THREE.SphereGeometry(headSize * 0.052, 16, 16);
    const noseTip = new THREE.Mesh(noseGeo, faceMaterial);
    noseTip.position.set(0, -headSize * 0.075, headSize * 0.43);
    noseTip.scale.set(1.0, 1.25, 1.35);
    headGroup.add(noseTip);

    const noseBridgeGeo = new THREE.CylinderGeometry(headSize * 0.024, headSize * 0.045, headSize * 0.18, 12);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, faceMaterial);
    noseBridge.position.set(0, 0.0, headSize * 0.39);
    noseBridge.rotation.x = -0.15;
    headGroup.add(noseBridge);

    // Beautiful human ears
    const earGeo = new THREE.SphereGeometry(headSize * 0.09, 16, 16);
    const leftEar = new THREE.Mesh(earGeo, faceMaterial);
    leftEar.position.set(-headSize * 0.43, -headSize * 0.05, -headSize * 0.05);
    leftEar.scale.set(0.4, 1.1, 0.72);
    leftEar.rotation.z = -0.1;
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = headSize * 0.43;
    rightEar.rotation.z = 0.1;
    headGroup.add(rightEar);

    // ================= HIGH-FIDELITY FACIAL FEATURES ASSEMBLY =================
    // Realistic sparkling biological eyes capturing tiny catchlight reflections
    const eyeWhiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.02,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1
    });
    
    const irisMat = new THREE.MeshStandardMaterial({
      map: eyeIrisMap || undefined,
      roughness: 0.1,
      metalness: 0.1
    });

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const eyeGeo = new THREE.SphereGeometry(headSize * 0.075, 16, 16);
    const irisGeo = new THREE.SphereGeometry(headSize * 0.048, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(headSize * 0.024, 16, 16);
    const sparkleGeo = new THREE.SphereGeometry(headSize * 0.012, 8, 8);

    // Left Eyeball
    const leftEyeball = new THREE.Group();
    leftEyeball.position.set(-headSize * 0.155, -headSize * 0.02, headSize * 0.36);
    headGroup.add(leftEyeball);

    const leftWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftWhite.scale.set(1.15, 1.0, 0.85); // elegant stylized oval shape
    leftEyeball.add(leftWhite);

    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(0, 0, headSize * 0.046);
    leftIris.scale.set(1.0, 1.0, 0.2);
    leftEyeball.add(leftIris);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, headSize * 0.054);
    leftPupil.scale.set(1.0, 1.0, 0.2);
    leftEyeball.add(leftPupil);

    // Eye Catchlight sparkle representing vitality and consciousness
    const leftSparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
    leftSparkle.position.set(headSize * 0.015, headSize * 0.015, headSize * 0.06);
    leftEyeball.add(leftSparkle);

    // Right Eyeball
    const rightEyeball = new THREE.Group();
    rightEyeball.position.set(headSize * 0.155, -headSize * 0.02, headSize * 0.36);
    headGroup.add(rightEyeball);

    const rightWhite = leftWhite.clone();
    rightEyeball.add(rightWhite);

    const rightIris = leftIris.clone();
    rightEyeball.add(rightIris);

    const rightPupil = leftPupil.clone();
    rightEyeball.add(rightPupil);

    const rightSparkle = leftSparkle.clone();
    rightEyeball.add(rightSparkle);

    // Charming arched dark eyebrows
    const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x1f1d1d });
    const eyebrowGeo = new THREE.BoxGeometry(headSize * 0.15, headSize * 0.026, headSize * 0.04);
    
    const leftBrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
    leftBrow.position.set(-headSize * 0.165, headSize * 0.08, headSize * 0.392);
    leftBrow.rotation.z = -0.06;
    leftBrow.rotation.y = -0.15;
    headGroup.add(leftBrow);

    const rightBrow = leftBrow.clone();
    rightBrow.position.x = headSize * 0.165;
    rightBrow.rotation.z = 0.06;
    rightBrow.rotation.y = 0.15;
    headGroup.add(rightBrow);

    // Soft biological rosy cheek blush to express deep lifelike warmth
    const blushMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#f43f5e'),
      transparent: true,
      opacity: 0.18
    });
    const blushGeo = new THREE.SphereGeometry(headSize * 0.11, 16, 16);
    
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-headSize * 0.24, -headSize * 0.12, headSize * 0.33);
    leftBlush.scale.set(1.0, 0.9, 0.3);
    headGroup.add(leftBlush);

    const rightBlush = leftBlush.clone();
    rightBlush.position.x = headSize * 0.24;
    headGroup.add(rightBlush);

    // Plump smiling coral cherry lips
    const lipMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(avatar.gender === 'female' ? '#e11d48' : '#be123c').lerp(new THREE.Color(avatar.skinTone), 0.35),
      bumpMap: lipBumpMap || undefined,
      bumpScale: 0.004,
      roughness: 0.24,
      metalness: 0.02,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2
    });
    
    const lipsGroup = new THREE.Group();
    lipsGroup.position.set(0, -headSize * 0.21, headSize * 0.37);
    lipsGroup.rotation.x = 0.12;
    headGroup.add(lipsGroup);

    const lipGeo = new THREE.SphereGeometry(headSize * 0.038, 16, 16);
    
    const leftLip = new THREE.Mesh(lipGeo, lipMat);
    leftLip.position.set(-headSize * 0.045, 0, 0);
    leftLip.scale.set(1.35, 0.65, 0.6);
    lipsGroup.add(leftLip);

    const rightLip = leftLip.clone();
    rightLip.position.x = headSize * 0.045;
    lipsGroup.add(rightLip);

    const bottomLip = new THREE.Mesh(lipGeo, lipMat);
    bottomLip.position.set(0, -headSize * 0.034, 0);
    bottomLip.scale.set(1.7, 0.58, 0.72);
    lipsGroup.add(bottomLip);

    // Stylish luxurious hair physically lit with light highlights
    const hairMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(avatar.gender === 'female' ? '#2b1b13' : '#0c0c0d'),
      map: hairStrandMap || undefined,
      bumpMap: hairStrandMap || undefined,
      bumpScale: 0.006,
      roughness: 0.45,
      metalness: 0.08,
      clearcoat: 0.18,
      clearcoatRoughness: 0.4
    });

    const hairCapGeo = new THREE.SphereGeometry(headSize * 0.48, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCap.position.set(0, headSize * 0.08, -headSize * 0.02);
    hairCap.rotation.x = -0.15;
    headGroup.add(hairCap);

    const customHairGeoms: (THREE.BufferGeometry)[] = [];

    // Elegant multi-swept tresses and volume
    if (avatar.gender === 'female') {
      // Curve 1: Left front swooping curl
      const curlL1 = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, headSize * 0.35, headSize * 0.15),
        new THREE.Vector3(-headSize * 0.44, headSize * 0.15, headSize * 0.4),
        new THREE.Vector3(-headSize * 0.36, -headSize * 0.15, headSize * 0.26)
      );
      const curlL1Geo = new THREE.TubeGeometry(curlL1, 16, headSize * 0.1, 8, false);
      customHairGeoms.push(curlL1Geo);
      const curlL1Mesh = new THREE.Mesh(curlL1Geo, hairMaterial);
      curlL1Mesh.castShadow = true;
      headGroup.add(curlL1Mesh);

      // Curve 2: Left side curl
      const curlL2 = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-headSize * 0.2, headSize * 0.32, -headSize * 0.1),
        new THREE.Vector3(-headSize * 0.52, headSize * 0.05, headSize * 0.22),
        new THREE.Vector3(-headSize * 0.42, -headSize * 0.25, headSize * 0.1)
      );
      const curlL2Geo = new THREE.TubeGeometry(curlL2, 16, headSize * 0.08, 8, false);
      customHairGeoms.push(curlL2Geo);
      const curlL2Mesh = new THREE.Mesh(curlL2Geo, hairMaterial);
      curlL2Mesh.castShadow = true;
      headGroup.add(curlL2Mesh);

      // Curve 3: Right front swooping curl
      const curlR1 = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, headSize * 0.35, headSize * 0.15),
        new THREE.Vector3(headSize * 0.44, headSize * 0.15, headSize * 0.4),
        new THREE.Vector3(headSize * 0.36, -headSize * 0.15, headSize * 0.26)
      );
      const curlR1Geo = new THREE.TubeGeometry(curlR1, 16, headSize * 0.1, 8, false);
      customHairGeoms.push(curlR1Geo);
      const curlR1Mesh = new THREE.Mesh(curlR1Geo, hairMaterial);
      curlR1Mesh.castShadow = true;
      headGroup.add(curlR1Mesh);

      // Curve 4: Right side curl
      const curlR2 = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(headSize * 0.2, headSize * 0.32, -headSize * 0.1),
        new THREE.Vector3(headSize * 0.52, headSize * 0.05, headSize * 0.22),
        new THREE.Vector3(headSize * 0.42, -headSize * 0.25, headSize * 0.1)
      );
      const curlR2Geo = new THREE.TubeGeometry(curlR2, 16, headSize * 0.08, 8, false);
      customHairGeoms.push(curlR2Geo);
      const curlR2Mesh = new THREE.Mesh(curlR2Geo, hairMaterial);
      curlR2Mesh.castShadow = true;
      headGroup.add(curlR2Mesh);

      // Back sweeping locks cascading over the neck
      const backLockGeo = new THREE.CylinderGeometry(headSize * 0.15, headSize * 0.06, headSize * 1.1, 12);
      const leftBackLock = new THREE.Mesh(backLockGeo, hairMaterial);
      leftBackLock.position.set(-headSize * 0.22, -headSize * 0.45, -headSize * 0.15);
      leftBackLock.rotation.z = -0.05;
      leftBackLock.rotation.x = 0.12;
      headGroup.add(leftBackLock);

      const rightBackLock = leftBackLock.clone();
      rightBackLock.position.x = headSize * 0.22;
      rightBackLock.rotation.z = 0.05;
      headGroup.add(rightBackLock);

      // Soft back hair bun/ponytail
      const bunGeo = new THREE.SphereGeometry(headSize * 0.22, 16, 16);
      const hairBun = new THREE.Mesh(bunGeo, hairMaterial);
      hairBun.position.set(0, headSize * 0.25, -headSize * 0.38);
      headGroup.add(hairBun);
    } else {
      // Modern crop fade for male using textured overlapping volumetric curved sweeps
      const hairBumpGeo = new THREE.SphereGeometry(headSize * 0.24, 16, 16);
      
      const bump1 = new THREE.Mesh(hairBumpGeo, hairMaterial);
      bump1.position.set(0, headSize * 0.42, headSize * 0.08);
      bump1.scale.set(1.4, 0.8, 1.1);
      headGroup.add(bump1);

      const bump2 = new THREE.Mesh(hairBumpGeo, hairMaterial);
      bump2.position.set(-headSize * 0.15, headSize * 0.4, headSize * 0.16);
      bump2.scale.set(0.8, 0.6, 0.8);
      headGroup.add(bump2);

      const bump3 = bump2.clone();
      bump3.position.x = headSize * 0.15;
      headGroup.add(bump3);

      const sideFadeGeo = new THREE.BoxGeometry(headSize * 0.95, headSize * 0.3, headSize * 0.6);
      const sideFade = new THREE.Mesh(sideFadeGeo, hairMaterial);
      sideFade.position.set(0, headSize * 0.18, -headSize * 0.12);
      headGroup.add(sideFade);
    }

    // ================= CLASSIC HUMAN-ALIGNED DESIGNER SUNGLASSES =================
    // Sleek rectangular/oval sunglasses directly modeled to perfectly match the image
    const sunglassesGroup = new THREE.Group();
    // Positioned centered at eyeLevel on the face
    sunglassesGroup.position.set(0, -headSize * 0.02, headSize * 0.38);
    headGroup.add(sunglassesGroup);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1a120b, // Very dark brown/tortoiseshell-black
      roughness: 0.15,
      metalness: 0.8
    });

    const glassLensMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0a, // Deep charcoal obsidian dark lenses
      roughness: 0.05,
      metalness: 0.9,
      transmission: 0.15, // solid sunglasses glass
      opacity: 0.95,
      transparent: true
    });

    // Left Frame & Eye Lens
    const lensWidth = headSize * 0.165;
    const lensHeight = headSize * 0.088;
    const lensDepth = headSize * 0.015;
    
    // Lens geometry
    const lensGeo = new THREE.BoxGeometry(lensWidth, lensHeight, lensDepth);
    
    // Left Lens
    const leftLens = new THREE.Mesh(lensGeo, glassLensMat);
    leftLens.position.set(-headSize * 0.145, 0, headSize * 0.012);
    leftLens.rotation.set(0.06, -0.06, -0.02);
    sunglassesGroup.add(leftLens);

    // Left Border Frame (using slightly larger thin border coordinates)
    const frameBorderGeo = new THREE.BoxGeometry(lensWidth * 1.12, lensHeight * 1.15, lensDepth * 1.2);
    const leftFrameBorder = new THREE.Mesh(frameBorderGeo, frameMat);
    leftFrameBorder.position.set(-headSize * 0.145, 0, headSize * 0.008);
    leftFrameBorder.rotation.copy(leftLens.rotation);
    sunglassesGroup.add(leftFrameBorder);

    // Right Lens
    const rightLens = new THREE.Mesh(lensGeo, glassLensMat);
    rightLens.position.set(headSize * 0.145, 0, headSize * 0.012);
    rightLens.rotation.set(0.06, 0.06, 0.02);
    sunglassesGroup.add(rightLens);

    // Right Border Frame
    const rightFrameBorder = new THREE.Mesh(frameBorderGeo, frameMat);
    rightFrameBorder.position.set(headSize * 0.145, 0, headSize * 0.008);
    rightFrameBorder.rotation.copy(rightLens.rotation);
    sunglassesGroup.add(rightFrameBorder);

    // Strong, elegant bridge connector
    const bridgeGeo = new THREE.BoxGeometry(headSize * 0.12, headSize * 0.018, headSize * 0.018);
    const sunglassesBridge = new THREE.Mesh(bridgeGeo, frameMat);
    sunglassesBridge.position.set(0, headSize * 0.02, headSize * 0.014);
    sunglassesGroup.add(sunglassesBridge);

    // High fidelity temples (side poles of glasses extending backward to the ear positions)
    const templeLength = headSize * 0.44;
    const templeThickness = headSize * 0.012;
    const templeHeight = headSize * 0.016;
    const templeGeo = new THREE.BoxGeometry(templeThickness, templeHeight, templeLength);

    const leftTemple = new THREE.Mesh(templeGeo, frameMat);
    // Extends backward along x-axis boundary, wrapping ears
    leftTemple.position.set(-headSize * 0.22, 0, -templeLength * 0.48);
    leftTemple.rotation.set(0.04, 0.15, 0); // slightly curve inwards
    sunglassesGroup.add(leftTemple);

    const rightTemple = new THREE.Mesh(templeGeo, frameMat);
    rightTemple.position.set(headSize * 0.22, 0, -templeLength * 0.48);
    rightTemple.rotation.set(0.04, -0.15, 0); // symmetrical curve
    sunglassesGroup.add(rightTemple);

    // ================= C. HIERARCHICAL PIVOT LIMIT SHOT SKELETANS =================
    // Upper Limbs: Tapered shoulders, wrist nodes and modeled flat hands
    const armRadius = 0.045 * config.ageFactor;
    const upperArmLength = config.armLength * 0.45;
    const forearmLength = config.armLength * 0.45;

    // Muscular Upper arms (procedurally generated curves)
    const upperArmGeo = createOrganicLimbGeometry(armRadius * 1.15, armRadius * 0.88, upperArmLength, 24, 0.4, 1.12);
    // Forearm (procedurally generated curves)
    const forearmGeo = createOrganicLimbGeometry(armRadius * 0.85, armRadius * 0.65, forearmLength, 24, 0.3, 1.15);

    // Left Arm Pivot bone structure
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.copy(leftShoulder.position);
    torsoGroup.add(leftArmGroup);

    const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, skinMaterial);
    leftUpperArmMesh.position.set(0, -upperArmLength / 2, 0);
    leftUpperArmMesh.castShadow = true;
    leftUpperArmMesh.receiveShadow = true;
    leftArmGroup.add(leftUpperArmMesh);

    // Smooth Elbow socket
    const elbowRadius = armRadius * 0.95;
    const elbowGeo = new THREE.SphereGeometry(elbowRadius, 24, 24);
    const leftElbow = new THREE.Mesh(elbowGeo, skinMaterial);
    leftElbow.position.set(0, -upperArmLength, 0);
    leftArmGroup.add(leftElbow);

    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -upperArmLength, 0);
    leftArmGroup.add(leftForearmGroup);

    const leftForearmMesh = new THREE.Mesh(forearmGeo, skinMaterial);
    leftForearmMesh.position.set(0, -forearmLength / 2, 0);
    leftForearmMesh.castShadow = true;
    leftForearmMesh.receiveShadow = true;
    leftForearmGroup.add(leftForearmMesh);

    // Anatomical Wrist joint and hand capsule
    const handJointGeo = new THREE.SphereGeometry(armRadius * 0.72, 16, 16);
    const leftWrist = new THREE.Mesh(handJointGeo, skinMaterial);
    leftWrist.position.set(0, -forearmLength, 0);
    leftForearmGroup.add(leftWrist);

    const handGeo = new THREE.BoxGeometry(armRadius * 1.3, armRadius * 0.35, armRadius * 1.6);
    const leftHand = new THREE.Mesh(handGeo, skinMaterial);
    leftHand.position.set(0, -armRadius * 0.8, 0);
    leftWrist.add(leftHand);

    // Right Arm Pivot bone structure
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.copy(rightShoulder.position);
    torsoGroup.add(rightArmGroup);

    const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, skinMaterial);
    rightUpperArmMesh.position.set(0, -upperArmLength / 2, 0);
    rightUpperArmMesh.castShadow = true;
    rightUpperArmMesh.receiveShadow = true;
    rightArmGroup.add(rightUpperArmMesh);

    const rightElbow = new THREE.Mesh(elbowGeo, skinMaterial);
    rightElbow.position.set(0, -upperArmLength, 0);
    rightArmGroup.add(rightElbow);

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -upperArmLength, 0);
    rightArmGroup.add(rightForearmGroup);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, skinMaterial);
    rightForearmMesh.position.set(0, -forearmLength / 2, 0);
    rightForearmMesh.castShadow = true;
    rightForearmMesh.receiveShadow = true;
    rightForearmGroup.add(rightForearmMesh);

    const rightWrist = new THREE.Mesh(handJointGeo, skinMaterial);
    rightWrist.position.set(0, -forearmLength, 0);
    rightForearmGroup.add(rightWrist);

    const rightHand = leftHand.clone();
    rightWrist.add(rightHand);


    // ================= D. LOWER LIMBS RIGGING WITH DETAILED SHAPE CURVES =================
    const thighLength = config.legLength * 0.52;
    const calfLength = config.legLength * 0.48;
    const calfRadius = thighRadius * 0.72;

    // Tapered thigh (Thickest on hip connection, narrows to knee)
    const thighGeo = createOrganicLimbGeometry(thighRadius * 1.25, thighRadius * 0.76, thighLength, 24, 0.35, 1.14);
    // Calf (Defined muscle curve bulging in top half, tapering to slender ankle)
    const calfGeo = createOrganicLimbGeometry(calfRadius * 1.05, calfRadius * 0.52, calfLength, 24, 0.26, 1.25);

    const hipGlobalY = torsoY - bodyHeight * 0.35;

    // Left Thigh pivoting from Hip Socket
    const leftThighGroup = new THREE.Group();
    leftThighGroup.position.set(-config.hipWidth * 0.24, hipGlobalY, 0);
    skeletonGroup.add(leftThighGroup);

    const leftThighMesh = new THREE.Mesh(thighGeo, skinMaterial);
    leftThighMesh.position.set(0, -thighLength / 2, 0);
    leftThighMesh.castShadow = true;
    leftThighMesh.receiveShadow = true;
    leftThighGroup.add(leftThighMesh);

    // Knee sphere socket
    const kneeRadius = calfRadius * 1.05;
    const kneeGeo = new THREE.SphereGeometry(kneeRadius, 24, 24);
    const leftKnee = new THREE.Mesh(kneeGeo, skinMaterial);
    leftKnee.position.set(0, -thighLength, 0);
    leftThighGroup.add(leftKnee);

    const leftCalfGroup = new THREE.Group();
    leftCalfGroup.position.set(0, -thighLength, 0);
    leftThighGroup.add(leftCalfGroup);

    const leftCalfMesh = new THREE.Mesh(calfGeo, skinMaterial);
    leftCalfMesh.position.set(0, -calfLength / 2, 0);
    leftCalfMesh.castShadow = true;
    leftCalfMesh.receiveShadow = true;
    leftCalfGroup.add(leftCalfMesh);

    // Modeled Footwear structure (forward-pointing wedge shoes)
    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f8fafc'), // Pristine white designer sneakers
      roughness: 0.4,
      metalness: 0.1
    });
    const footGeo = new THREE.BoxGeometry(calfRadius * 1.4, calfRadius * 0.9, calfRadius * 2.8);
    const leftFoot = new THREE.Mesh(footGeo, shoeMaterial);
    leftFoot.position.set(0, -calfLength * 0.54, calfRadius * 0.7);
    leftFoot.castShadow = true;
    leftCalfMesh.add(leftFoot);

    // Dynamic blue stripes on left shoe (outer side is -X / left)
    const leftStripeGroup = new THREE.Group();
    leftStripeGroup.position.set(-calfRadius * 0.71, 0, 0);
    leftStripeGroup.rotation.y = -Math.PI / 2;
    leftStripeGroup.rotation.z = -0.3; 
    leftFoot.add(leftStripeGroup);

    const stripeMaterial = new THREE.MeshBasicMaterial({ color: '#2563eb' }); 
    const stripeGeo = new THREE.BoxGeometry(calfRadius * 0.08, calfRadius * 0.6, calfRadius * 0.12);

    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMaterial);
      stripe.position.set(0, 0, i * calfRadius * 0.25 - calfRadius * 0.25);
      leftStripeGroup.add(stripe);
    }

    // Sole contour
    const soleGeo = new THREE.BoxGeometry(calfRadius * 1.45, calfRadius * 0.2, calfRadius * 2.9);
    const leftSole = new THREE.Mesh(soleGeo, new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 }));
    leftSole.position.set(0, -calfLength * 0.54 - calfRadius * 0.45, calfRadius * 0.7);
    leftCalfMesh.add(leftSole);

    // Right Thigh pivoting from Hip Socket
    const rightThighGroup = new THREE.Group();
    rightThighGroup.position.set(config.hipWidth * 0.24, hipGlobalY, 0);
    skeletonGroup.add(rightThighGroup);

    const rightThighMesh = new THREE.Mesh(thighGeo, skinMaterial);
    rightThighMesh.position.set(0, -thighLength / 2, 0);
    rightThighMesh.castShadow = true;
    rightThighMesh.receiveShadow = true;
    rightThighGroup.add(rightThighMesh);

    const rightKnee = new THREE.Mesh(kneeGeo, skinMaterial);
    rightKnee.position.set(0, -thighLength, 0);
    rightThighGroup.add(rightKnee);

    const rightCalfGroup = new THREE.Group();
    rightCalfGroup.position.set(0, -thighLength, 0);
    rightThighGroup.add(rightCalfGroup);

    const rightCalfMesh = new THREE.Mesh(calfGeo, skinMaterial);
    rightCalfMesh.position.set(0, -calfLength / 2, 0);
    rightCalfMesh.castShadow = true;
    rightCalfMesh.receiveShadow = true;
    rightCalfGroup.add(rightCalfMesh);

    // Right Foot (re-modeled separately to ensure outward stripes align on +X side)
    const rightFoot = new THREE.Mesh(footGeo, shoeMaterial);
    rightFoot.position.set(0, -calfLength * 0.54, calfRadius * 0.7);
    rightFoot.castShadow = true;
    rightCalfMesh.add(rightFoot);

    const rightStripeGroup = new THREE.Group();
    rightStripeGroup.position.set(calfRadius * 0.71, 0, 0);
    rightStripeGroup.rotation.y = Math.PI / 2;
    rightStripeGroup.rotation.z = 0.3; 
    rightFoot.add(rightStripeGroup);

    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMaterial);
      stripe.position.set(0, 0, i * calfRadius * 0.25 - calfRadius * 0.25);
      rightStripeGroup.add(stripe);
    }

    const rightSole = new THREE.Mesh(soleGeo, new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 }));
    rightSole.position.set(0, -calfLength * 0.54 - calfRadius * 0.45, calfRadius * 0.7);
    rightCalfMesh.add(rightSole);


    // ================= D2. PHOTOREALISTIC HUMAN AVATAR LOADER ENGINE =================
    // Directly support the requested loadModel('/realistic-human.glb') under advanced mapping constraints
    const loader = new GLTFLoader();
    const loadModel = (url: string) => {
      console.log(`[Photorealistic Loader] Attempting to load static asset from: ${url}`);
      loader.load(
        url,
        (gltf) => {
          console.log(`[Photorealistic Loader] Successfully loaded GLTF human avatar model:`, gltf);
          const humanModel = gltf.scene;
          
          // Disable procedural mannequin meshes elegantly via material and structure queries to prevent clipping
          skeletonGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const mat = child.material;
              if (mat === skinMaterial || mat === faceMaterial || child.name.toLowerCase().includes("hair") || child.name.toLowerCase().includes("eye")) {
                child.visible = false;
              }
            }
          });
          
          headGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.visible = false;
            }
          });
          
          // Standardize scale of imported mesh matching customized heights
          const box = new THREE.Box3().setFromObject(humanModel);
          const size = box.getSize(new THREE.Vector3());
          const targetScaleFactor = config.height / (size.y || 1.75);
          humanModel.scale.set(targetScaleFactor, targetScaleFactor, targetScaleFactor);
          humanModel.position.set(0, 0, 0);
          
          // Inject glb model into skeletal structures
          skeletonGroup.add(humanModel);
          
          // Enable Physically-Based Rendering details and casting soft shadows
          humanModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 1.3;
                child.material.needsUpdate = true;
              }

              // Dynamic texture & color routing matched from global active garments state
              const mName = child.name.toLowerCase();
              activeGarments.forEach((garment) => {
                const isMatch = 
                  (garment.type === 'top' && (mName.includes('shirt') || mName.includes('top') || mName.includes('chest') || mName.includes('collar'))) ||
                  (garment.type === 'bottom' && (mName.includes('pants') || mName.includes('legs') || mName.includes('lower') || mName.includes('jeans') || mName.includes('trousers'))) ||
                  (garment.type === 'dress' && (mName.includes('dress') || mName.includes('gown') || mName.includes('skirt'))) ||
                  (garment.type === 'outerwear' && (mName.includes('coat') || mName.includes('jacket') || mName.includes('outer') || mName.includes('blazer')));

                if (isMatch) {
                  const colorHex = garment.primaryColor || '#7c3aed';
                  const isKnit = colorHex.toLowerCase() === '#d6c5b3' || garment.type === 'top' || garment.type === 'outerwear';
                  
                  // Construct customized MeshPhysicalMaterial matching DYNAMIC_GARMENT_MAPPING parameters
                  const pbrMat = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color(colorHex),
                    roughness: garment.sheenLevel !== undefined ? (1 - garment.sheenLevel) : (isKnit ? 0.8 : 0.60),
                    metalness: isKnit ? 0.02 : 0.12,
                    clearcoat: garment.sheenLevel && garment.sheenLevel > 0.4 ? 0.35 : 0.0,
                    clearcoatRoughness: 0.12,
                    bumpMap: isKnit ? (knitBumpMap || undefined) : undefined,
                    bumpScale: 0.015
                  });

                  if (garment.imageUrl) {
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.setCrossOrigin('anonymous');
                    textureLoader.load(
                      garment.imageUrl,
                      (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        if (garment.type === 'top' || garment.type === 'outerwear') {
                          texture.repeat.set(1.5, 1.5);
                        } else {
                          texture.repeat.set(1.5, 3);
                        }
                        pbrMat.map = texture;
                        pbrMat.color.set('#ffffff'); // Neutral tint to display uploaded pattern accurately
                        pbrMat.needsUpdate = true;
                      }
                    );
                  }

                  child.material = pbrMat;
                }
              });
            }
          });

          // Store references and helper APIs for runtime swapping on window scope as suggested
          (window as any).avatarModel = humanModel;
          
          (window as any).applyClothingTexture = (clothingType: string, texturePath: string) => {
            console.log(`[WearAI API] Swapping texture dynamically for: ${clothingType} -> ${texturePath}`);
            const tLoader = new THREE.TextureLoader();
            tLoader.setCrossOrigin('anonymous');
            tLoader.load(texturePath, (texture) => {
              humanModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  const meshName = child.name.toLowerCase();
                  const isMatch = 
                    (clothingType.includes('shirt') || clothingType.includes('top')) && (meshName.includes('shirt') || meshName.includes('top') || meshName.includes('chest')) ||
                    (clothingType.includes('pants') || clothingType.includes('bottom')) && (meshName.includes('pants') || meshName.includes('legs') || meshName.includes('lower') || meshName.includes('jeans')) ||
                    (clothingType.includes('shoes')) && (meshName.includes('shoes') || meshName.includes('feet') || meshName.includes('sole'));

                  if (isMatch) {
                    if (child.material) {
                      const mat = child.material as any;
                      mat.map = texture;
                      mat.color.set('#ffffff');
                      mat.needsUpdate = true;
                    }
                  }
                }
              });
            });
          };

          (window as any).updateClothing = (clothingType: string, texturePath: string) => {
            (window as any).applyClothingTexture(clothingType, texturePath);
          };
        },
        undefined,
        (err) => {
          console.warn(`[Photorealistic Loader] Asset "${url}" not found in project paths. Falling back safely to high-fidelity organic procedural PBR model.`, err);
        }
      );
    };

    // Trigger loading of the photorealistic human avatar glb
    loadModel('/realistic-human.glb');


    // ================= D3. ADVANCED CANNON.JS CLOTH PHYSICS SOLVER ENGINE =================
    const cannonWorld = new CANNON.World();
    cannonWorld.gravity.set(0, -9.81, 0);
    const gsSolver = new CANNON.GSSolver();
    gsSolver.iterations = 10;
    gsSolver.tolerance = 0.02;
    cannonWorld.solver = gsSolver;

    interface CannonClothSim {
      mesh: THREE.Mesh;
      type: string;
      radialSegs: number;
      heightSegs: number;
      heightVal: number;
      bodies: CANNON.Body[];
      parentGroup: THREE.Object3D;
    }

    const clothSimulations: CannonClothSim[] = [];

    const createCannonClothSim = (
      mesh: THREE.Mesh,
      type: string,
      radialSegs: number,
      heightSegs: number,
      heightVal: number,
      parentGroup: THREE.Object3D,
      radiusT: number,
      radiusB: number
    ) => {
      const bodies: CANNON.Body[] = [];
      parentGroup.updateMatrixWorld(true);

      for (let h = 0; h <= heightSegs; h++) {
        const t = h / heightSegs; // 0 to 1 (top to bottom of garment cylinder)
        const yVal = heightVal * 0.5 - t * heightVal;
        const radius = radiusT + t * (radiusB - radiusT);
        
        // Anchoring upper rings of cylinder to block sliding off bones
        const isLocked = h <= 1; 
        const weight = Math.pow(t, 1.6); // weight profile

        for (let r = 0; r < radialSegs; r++) {
          const angle = (r / radialSegs) * Math.PI * 2;
          const xVal = Math.sin(angle) * radius;
          const zVal = Math.cos(angle) * radius;

          // Project default local coordinates to global three.js positions
          const localPos = new THREE.Vector3(xVal, yVal, zVal);
          const relativePos = localPos.clone().add(mesh.position);
          const worldPos = relativePos.clone().applyMatrix4(parentGroup.matrixWorld);

          const body = new CANNON.Body({
            mass: isLocked ? 0 : 0.06, // Static/anchored nodes have 0 mass
            position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z),
            shape: new CANNON.Sphere(0.012),
            linearDamping: 0.45,
            angularDamping: 0.45
          });

          (body as any).userData = {
            hIndex: h,
            rIndex: r,
            localOffset: relativePos.clone(),
            isLocked: isLocked,
            weight: weight
          };

          cannonWorld.addBody(body);
          bodies.push(body);
        }
      }

      // Physics distance constraints
      for (let h = 0; h <= heightSegs; h++) {
        for (let r = 0; r < radialSegs; r++) {
          const idx = h * radialSegs + r;

          // Structural horizontal ring limits
          const nextRIdx = h * radialSegs + ((r + 1) % radialSegs);
          const distH = bodies[idx].position.distanceTo(bodies[nextRIdx].position);
          cannonWorld.addConstraint(new CANNON.DistanceConstraint(bodies[idx], bodies[nextRIdx], distH));

          // Vertical structural hanger limits
          if (h < heightSegs) {
            const belowIdx = (h + 1) * radialSegs + r;
            const distV = bodies[idx].position.distanceTo(bodies[belowIdx].position);
            cannonWorld.addConstraint(new CANNON.DistanceConstraint(bodies[idx], bodies[belowIdx], distV));

            // Diagonal shear supports preventing mesh flattening collapse
            const diagIdx = (h + 1) * radialSegs + ((r + 1) % radialSegs);
            const distD = bodies[idx].position.distanceTo(bodies[diagIdx].position);
            cannonWorld.addConstraint(new CANNON.DistanceConstraint(bodies[idx], bodies[diagIdx], distD));
          }
        }
      }

      clothSimulations.push({
        mesh: mesh,
        type: type,
        radialSegs: radialSegs,
        heightSegs: heightSegs,
        heightVal: heightVal,
        bodies: bodies,
        parentGroup: parentGroup
      });
    };

    // ================= E. LAYERED 3D APPAREL LAYER ENGINE =================
    // Sort active garments to ensure deeper clothes are drawn physically larger
    // bottom layer: 0, top layer: 1, dress: 2, outerwear: 3
    const typeLayers: Record<ClothingType, number> = {
      bottom: 0,
      top: 1,
      dress: 2,
      outerwear: 3
    };

    const sortedGarments = [...activeGarments].sort((a, b) => typeLayers[a.type] - typeLayers[b.type]);
    const garmentMaterialsToDispose: THREE.Material[] = [];

    sortedGarments.forEach((garment, index) => {
      // Scale padding/offset based on the sorted stack layer index to prevent intersecting faces
      const scaleOffset = index * 0.012;
      const garmentMaterial = createGarmentMaterial(garment.primaryColor || '#7c3aed', garment.type, garment.imageUrl);
      const solidMaterial = createGarmentMaterial(garment.primaryColor || '#7c3aed', garment.type); // Solid brand matching color material
      garmentMaterialsToDispose.push(garmentMaterial);
      garmentMaterialsToDispose.push(solidMaterial);

      let renderOrder = 0;
      if (garment.type === 'top') renderOrder = 1;
      else if (garment.type === 'dress') renderOrder = 2;
      else if (garment.type === 'outerwear') renderOrder = 3;

      if (garment.type === 'top') {
        const radialSegs = 16;
        const heightSegs = 6;
        const topHeight = bodyHeight * 0.76;
        const radiusT = config.chestWidth * (0.525 + scaleOffset);
        const radiusB = config.waistWidth * (0.535 + scaleOffset);

        const topVestGeo = new THREE.CylinderGeometry(radiusT, radiusB, topHeight, radialSegs, heightSegs);
        const topVest = new THREE.Mesh(topVestGeo, garmentMaterial);
        topVest.position.set(0, bodyHeight * 0.14, 0);
        topVest.castShadow = true;
        topVest.receiveShadow = true;
        topVest.renderOrder = renderOrder;
        torsoGroup.add(topVest);

        createCannonClothSim(topVest, 'top', radialSegs, heightSegs, topHeight, torsoGroup, radiusT, radiusB);

        // A folded collar placket going down the center chest (matching the polo sweater in the image)
        const placketGeo = new THREE.BoxGeometry(config.chestWidth * 0.12, bodyHeight * 0.22, 0.008);
        const placket = new THREE.Mesh(placketGeo, solidMaterial);
        placket.position.set(0, bodyHeight * 0.24, config.chestThickness * 0.525 + scaleOffset * config.chestThickness);
        placket.castShadow = true;
        topVest.add(placket);

        // Buttons along the placket
        const buttonGeo = new THREE.CylinderGeometry(headSize * 0.015, headSize * 0.015, 0.006, 12);
        const buttonMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 });
        for (let i = 0; i < 3; i++) {
          const button = new THREE.Mesh(buttonGeo, buttonMat);
          button.rotation.x = Math.PI / 2;
          button.position.set(0, bodyHeight * 0.07 - i * bodyHeight * 0.065, 0.006);
          placket.add(button);
        }

        // Fold-over polo collar laps wrapping the neck beautifully
        const collarGroup = new THREE.Group();
        collarGroup.position.set(0, bodyHeight * 0.38, 0); // Positioned at upper collar line
        topVest.add(collarGroup);
        
        const flapLength = bodyHeight * 0.12;
        const flapWidth = config.chestWidth * 0.24;
        const flapThickness = 0.012;
        const collarFlapGeo = new THREE.BoxGeometry(flapWidth, flapLength, flapThickness);
        
        const leftFlap = new THREE.Mesh(collarFlapGeo, solidMaterial);
        leftFlap.position.set(-flapWidth * 0.38, 0, config.chestThickness * 0.53 + scaleOffset * config.chestThickness);
        leftFlap.rotation.set(0.24, 0.35, -0.22); // angled fold
        leftFlap.castShadow = true;
        collarGroup.add(leftFlap);

        const rightFlap = new THREE.Mesh(collarFlapGeo, solidMaterial);
        rightFlap.position.set(flapWidth * 0.38, 0, config.chestThickness * 0.53 + scaleOffset * config.chestThickness);
        rightFlap.rotation.set(0.24, -0.35, 0.22); // angled fold opposite
        rightFlap.castShadow = true;
        collarGroup.add(rightFlap);

        // A circular back collar band wrapping the back of the neck structure
        const backCollarGeo = new THREE.CylinderGeometry(neckRadius * 1.55, neckRadius * 1.75, bodyHeight * 0.08, 16, 1, true, -Math.PI * 0.82, Math.PI * 1.64);
        const backCollar = new THREE.Mesh(backCollarGeo, solidMaterial);
        backCollar.position.set(0, bodyHeight * 0.05, -neckRadius * 0.2);
        backCollar.rotation.x = 0.12;
        collarGroup.add(backCollar);

        const sleeveGeo = new THREE.CylinderGeometry(
          armRadius * (1.25 + scaleOffset),
          armRadius * (1.15 + scaleOffset),
          upperArmLength * 0.7,
          12
        );
        
        const leftSleeve = new THREE.Mesh(sleeveGeo, solidMaterial);
        leftSleeve.position.set(0, upperArmLength * 0.1, 0);
        leftSleeve.castShadow = true;
        leftSleeve.receiveShadow = true;
        leftSleeve.renderOrder = renderOrder;
        leftUpperArmMesh.add(leftSleeve);

        const rightSleeve = new THREE.Mesh(sleeveGeo, solidMaterial);
        rightSleeve.position.set(0, upperArmLength * 0.1, 0);
        rightSleeve.castShadow = true;
        rightSleeve.receiveShadow = true;
        rightSleeve.renderOrder = renderOrder;
        rightUpperArmMesh.add(rightSleeve);
      }
      else if (garment.type === 'bottom') {
        const radialSegs = 12;
        const heightSegs = 5;
        const thighH = thighLength * 0.95;
        const radiusThighT = thighRadius * (1.34 + scaleOffset);
        const radiusThighB = thighRadius * (1.15 + scaleOffset);

        const pantsThighGeo = new THREE.CylinderGeometry(radiusThighT, radiusThighB, thighH, radialSegs, heightSegs);
        
        const leftPantsThigh = new THREE.Mesh(pantsThighGeo, garmentMaterial);
        leftPantsThigh.position.set(0, -thighLength * 0.04, 0);
        leftPantsThigh.castShadow = true;
        leftPantsThigh.receiveShadow = true;
        leftPantsThigh.renderOrder = renderOrder;
        leftThighMesh.add(leftPantsThigh);

        createCannonClothSim(leftPantsThigh, 'pants_left_thigh', radialSegs, heightSegs, thighH, leftThighMesh, radiusThighT, radiusThighB);

        const rightPantsThigh = new THREE.Mesh(pantsThighGeo, garmentMaterial);
        rightPantsThigh.position.set(0, -thighLength * 0.04, 0);
        rightPantsThigh.castShadow = true;
        rightPantsThigh.receiveShadow = true;
        rightPantsThigh.renderOrder = renderOrder;
        rightThighMesh.add(rightPantsThigh);

        createCannonClothSim(rightPantsThigh, 'pants_right_thigh', radialSegs, heightSegs, thighH, rightThighMesh, radiusThighT, radiusThighB);

        const calfH = calfLength * 0.9;
        const radiusCalfT = calfRadius * (1.25 + scaleOffset);
        const radiusCalfB = calfRadius * (1.14 + scaleOffset);

        const pantsCalfGeo = new THREE.CylinderGeometry(radiusCalfT, radiusCalfB, calfH, radialSegs, heightSegs);
        
        const leftPantsCalf = new THREE.Mesh(pantsCalfGeo, garmentMaterial);
        leftPantsCalf.position.set(0, -calfLength * 0.04, 0);
        leftPantsCalf.castShadow = true;
        leftPantsCalf.receiveShadow = true;
        leftPantsCalf.renderOrder = renderOrder;
        leftCalfMesh.add(leftPantsCalf);

        createCannonClothSim(leftPantsCalf, 'pants_left_calf', radialSegs, heightSegs, calfH, leftCalfMesh, radiusCalfT, radiusCalfB);

        const rightPantsCalf = new THREE.Mesh(pantsCalfGeo, garmentMaterial);
        rightPantsCalf.position.set(0, -calfLength * 0.04, 0);
        rightPantsCalf.castShadow = true;
        rightPantsCalf.receiveShadow = true;
        rightPantsCalf.renderOrder = renderOrder;
        rightCalfMesh.add(rightPantsCalf);

        createCannonClothSim(rightPantsCalf, 'pants_right_calf', radialSegs, heightSegs, calfH, rightCalfMesh, radiusCalfT, radiusCalfB);
      }
      else if (garment.type === 'dress') {
        const radialSegs = 16;
        const heightSegs = 8;
        const dressH = bodyHeight * 1.35;
        const radiusDressT = config.chestWidth * (0.525 + scaleOffset);
        const radiusDressB = config.hipWidth * (0.72 + scaleOffset);

        const dressGeo = new THREE.CylinderGeometry(radiusDressT, radiusDressB, dressH, radialSegs, heightSegs);
        const dressMesh = new THREE.Mesh(dressGeo, garmentMaterial);
        dressMesh.position.set(0, -bodyHeight * 0.15, 0);
        dressMesh.castShadow = true;
        dressMesh.receiveShadow = true;
        dressMesh.renderOrder = renderOrder;
        torsoGroup.add(dressMesh);

        createCannonClothSim(dressMesh, 'dress', radialSegs, heightSegs, dressH, torsoGroup, radiusDressT, radiusDressB);
      }
      else if (garment.type === 'outerwear') {
        const radialSegs = 16;
        const heightSegs = 8;
        const coatH = bodyHeight * 0.85;
        const radiusCoatT = config.chestWidth * (0.54 + scaleOffset);
        const radiusCoatB = config.waistWidth * (0.56 + scaleOffset);

        const coatGeo = new THREE.CylinderGeometry(radiusCoatT, radiusCoatB, coatH, radialSegs, heightSegs);
        const coatMesh = new THREE.Mesh(coatGeo, garmentMaterial);
        coatMesh.position.set(0, bodyHeight * 0.12, 0);
        coatMesh.castShadow = true;
        coatMesh.receiveShadow = true;
        coatMesh.renderOrder = renderOrder;
        torsoGroup.add(coatMesh);

        createCannonClothSim(coatMesh, 'outerwear', radialSegs, heightSegs, coatH, torsoGroup, radiusCoatT, radiusCoatB);

        const collarGeo = new THREE.BoxGeometry(config.chestWidth * 0.18, bodyHeight * 0.35, config.chestThickness * 0.22);
        
        const leftCollar = new THREE.Mesh(collarGeo, solidMaterial);
        leftCollar.position.set(-config.chestWidth * 0.22, bodyHeight * 0.22, config.chestThickness * 0.44);
        leftCollar.rotation.y = 0.25;
        leftCollar.renderOrder = renderOrder;
        coatMesh.add(leftCollar);

        const rightCollar = new THREE.Mesh(collarGeo, solidMaterial);
        rightCollar.position.set(config.chestWidth * 0.22, bodyHeight * 0.22, config.chestThickness * 0.44);
        rightCollar.rotation.y = -0.25;
        rightCollar.renderOrder = renderOrder;
        coatMesh.add(rightCollar);

        const coatSleeveGeo = new THREE.CylinderGeometry(
          armRadius * (1.35 + scaleOffset),
          armRadius * (1.22 + scaleOffset),
          upperArmLength * 0.82,
          12
        );
        
        const leftCoatSleeve = new THREE.Mesh(coatSleeveGeo, solidMaterial);
        leftCoatSleeve.position.set(0, upperArmLength * 0.05, 0);
        leftCoatSleeve.castShadow = true;
        leftCoatSleeve.receiveShadow = true;
        leftCoatSleeve.renderOrder = renderOrder;
        leftUpperArmMesh.add(leftCoatSleeve);

        const rightCoatSleeve = new THREE.Mesh(coatSleeveGeo, solidMaterial);
        rightCoatSleeve.position.set(0, upperArmLength * 0.05, 0);
        rightCoatSleeve.castShadow = true;
        rightCoatSleeve.receiveShadow = true;
        rightCoatSleeve.renderOrder = renderOrder;
        rightUpperArmMesh.add(rightCoatSleeve);
      }
    });

    // Save parts registry globally back to pivot groups
    skeletonRef.current = {
      skeletonGroup,
      head: headGroup,
      torso: torsoGroup,
      leftUpperArm: leftArmGroup,
      rightUpperArm: rightArmGroup,
      leftForearm: leftForearmGroup,
      rightForearm: rightForearmGroup,
      leftThigh: leftThighGroup,
      rightThigh: rightThighGroup,
      leftCalf: leftCalfGroup,
      rightCalf: rightCalfGroup
    };

    skeletonGroup.rotation.y = modelRotationRef.current.y;
    skeletonGroup.rotation.x = modelRotationRef.current.x;

    // 5. Animating Stride & Shaking Clock
    let animationClock = 0;
    let requestId: number;

    const renderAnim = () => {
      animationClock += 0.035;

      if (skeletonRef.current) {
        const parts = skeletonRef.current;

        // Auto 360 Rotate logic
        if (isRotating) {
          parts.skeletonGroup.rotation.y += 0.007;
          modelRotationRef.current.y = parts.skeletonGroup.rotation.y;
        }

        if (animationMode === 'idle') {
          // Beautiful diaphragmatic breathing animation
          const breath = Math.sin(animationClock * 1.25);
          parts.torso.scale.set(1 + (breath * 0.013), 1, 1 + (breath * 0.008));
          parts.leftUpperArm.rotation.z = -0.16 - (breath * 0.018);
          parts.rightUpperArm.rotation.z = 0.16 + (breath * 0.018);
          parts.leftUpperArm.rotation.x = (-breath * 0.012);
          parts.rightUpperArm.rotation.x = (breath * 0.012);
          parts.head.position.y = bodyHeight * 0.56 + (headSize * 0.5) + (breath * 0.0035);
          
          // Reset legs
          parts.leftThigh.rotation.x = 0;
          parts.rightThigh.rotation.x = 0;
          parts.leftCalf.rotation.x = 0;
          parts.rightCalf.rotation.x = 0;
        } else if (animationMode === 'walk') {
          // Dynamic leg strides animation swing
          const walkCycle = Math.sin(animationClock * 2.5);
          
          // Legs stride (alternated)
          parts.leftThigh.rotation.x = walkCycle * 0.42;
          parts.rightThigh.rotation.x = -walkCycle * 0.42;
          
          // Knees fold as leg steps back
          parts.leftCalf.rotation.x = Math.max(0, -walkCycle * 0.3);
          parts.rightCalf.rotation.x = Math.max(0, walkCycle * 0.3);

          // Arms swing (opposite to thigh swing)
          parts.leftUpperArm.rotation.x = -walkCycle * 0.36;
          parts.leftUpperArm.rotation.z = -0.1;
          parts.rightUpperArm.rotation.x = walkCycle * 0.36;
          parts.rightUpperArm.rotation.z = 0.1;
          
          // Soft body bobbing matching footstep cadence
          parts.torso.position.y = torsoY + (Math.abs(walkCycle) * -0.025);
        }
      }

      // ================= D4. CANNON.JS SIMULATION PHYSICS ITERATION CYCLE =================
      clothSimulations.forEach(sim => {
        sim.parentGroup.updateMatrixWorld(true);
        sim.bodies.forEach(body => {
          const bAny = body as any;
          if (bAny.userData.isLocked) {
            // Anchor coordinates snap to skeleton group transforms
            const targetWorld = bAny.userData.localOffset.clone().applyMatrix4(sim.parentGroup.matrixWorld);
            body.position.set(targetWorld.x, targetWorld.y, targetWorld.z);
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
          }
        });
      });

      // Step physics
      cannonWorld.step(0.016);

      // Apply physical mesh coordinates and fold-deformations back to CylinderGeometry vertices
      clothSimulations.forEach(sim => {
        const geom = sim.mesh.geometry;
        const posAttr = geom.attributes.position;
        
        sim.mesh.updateMatrixWorld(true);
        const meshInvMat = sim.mesh.matrixWorld.clone().invert();

        for (let i = 0; i < posAttr.count; i++) {
          const hIndex = Math.min(sim.heightSegs, Math.floor(i / (sim.radialSegs + 1)));
          const rIndex = i % (sim.radialSegs + 1);
          const rClamped = rIndex % sim.radialSegs;

          const bodyIndex = hIndex * sim.radialSegs + rClamped;
          const body = sim.bodies[bodyIndex];

          if (body) {
            const bAny = body as any;
            const worldPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
            const localPos = worldPos.applyMatrix4(meshInvMat);

            let wrinkleOffset = 0;
            if (animationMode === 'walk' && !bAny.userData.isLocked) {
              // Simulating elegant multi-layer wrinkled creasing
              const cycleSpeed = 3.6;
              const anglePhase = (rIndex / sim.radialSegs) * Math.PI * 4;
              const heightPhase = bAny.userData.hIndex * 1.5;
              const tPhase = animationClock * cycleSpeed;
              
              const sinWave = Math.sin(heightPhase - tPhase + anglePhase * 0.5);
              wrinkleOffset = sinWave * 0.006 * bAny.userData.weight;
            }

            posAttr.setXYZ(
              i,
              localPos.x + wrinkleOffset * 0.3,
              localPos.y,
              localPos.z + wrinkleOffset
            );
          }
        }
        posAttr.needsUpdate = true;
        geom.computeVertexNormals();
      });

      renderer.render(scene, camera);
      requestId = requestAnimationFrame(renderAnim);
    };

    renderAnim();

    // 6. Fluid Responsive Resize Observer
    const sizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const targetWidth = entry.contentRect.width;
      const targetHeight = entry.contentRect.height;
      
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = targetWidth / targetHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(targetWidth, targetHeight);
      }
    });

    sizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(requestId);
      sizeObserver.disconnect();
      
      // Clean up Cannon bodies and constraints to prevent memory leaks
      clothSimulations.forEach(sim => {
        sim.bodies.forEach(body => {
          cannonWorld.removeBody(body);
        });
      });
      pelvisGeo.dispose();
      waistGeo.dispose();
      chestGeo.dispose();
      shoulderGeo.dispose();
      neckGeo.dispose();
      headGeo.dispose();
      jawGeo.dispose();
      noseGeo.dispose();
      earGeo.dispose();
      hairCapGeo.dispose();
      upperArmGeo.dispose();
      forearmGeo.dispose();
      handJointGeo.dispose();
      handGeo.dispose();
      thighGeo.dispose();
      calfGeo.dispose();
      footGeo.dispose();
      soleGeo.dispose();
      grid.dispose();
      floorGeo.dispose();
      skinMaterial.dispose();
      customHairGeoms.forEach(g => g.dispose());
      texturesToDispose.forEach(t => t.dispose());
      garmentMaterialsToDispose.forEach(m => m.dispose());
      shoeMaterial.dispose();
      renderer.dispose();
    };
  }, [avatar, activeGarmentsKey, animationMode, isRotating]);

  // Handle Dragging rotation actions
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !skeletonRef.current) return;
    
    setIsRotating(false);

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    const parts = skeletonRef.current;
    parts.skeletonGroup.rotation.y += deltaX * 0.015;
    parts.skeletonGroup.rotation.x = Math.max(-0.3, Math.min(0.3, parts.skeletonGroup.rotation.x + deltaY * 0.015));

    modelRotationRef.current.y = parts.skeletonGroup.rotation.y;
    modelRotationRef.current.x = parts.skeletonGroup.rotation.x;

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      className="relative w-full h-[460px] md:h-full bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col"
      ref={containerRef}
    >
      <canvas
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            isDraggingRef.current = true;
            previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchMove={(e) => {
          if (isDraggingRef.current && e.touches.length > 0 && skeletonRef.current) {
            setIsRotating(false);
            const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
            const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
            skeletonRef.current.skeletonGroup.rotation.y += deltaX * 0.018;
            skeletonRef.current.skeletonGroup.rotation.x = Math.max(-0.35, Math.min(0.35, skeletonRef.current.skeletonGroup.rotation.x + deltaY * 0.018));
            modelRotationRef.current.y = skeletonRef.current.skeletonGroup.rotation.y;
            modelRotationRef.current.x = skeletonRef.current.skeletonGroup.rotation.x;
            previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchEnd={() => { isDraggingRef.current = false; }}
      />

      <div className="absolute top-4 left-4 flex flex-col gap-2.5 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-1 border border-slate-700/50 flex gap-1 shadow-lg">
          <button
            id="camera-preset-full"
            onClick={() => setAnimationMode('idle')}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${animationMode === 'idle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Idle Breathing"
          >
            <Pause className="w-4.5 h-4.5" />
          </button>
          <button
            id="camera-preset-walk"
            onClick={() => setAnimationMode('walk')}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${animationMode === 'walk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Walk Simulation"
          >
            <Play className="w-4.5 h-4.5" />
          </button>
          <div className="h-4.5 w-[1px] bg-slate-700 self-center mx-1" />
          <button
            id="camera-preset-rotate"
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${isRotating ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Auto Rotation"
          >
            <Compass className="w-4.5 h-4.5 animate-spin-slow" />
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/50 flex flex-col gap-1.5 shadow-lg">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.8))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.65))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-mono font-bold"
            title="Reset Zoom"
          >
            <Maximize className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-indigo-500/25 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 max-w-[200px] shadow-lg">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <div className="font-mono text-[10px] text-slate-300">
          <div className="font-bold uppercase tracking-wider text-cyan-400">WebGL Body Synth Live</div>
          <div>Mannequin Mesh: {avatar.bodyShape}</div>
        </div>
      </div>
    </div>
  );
}
