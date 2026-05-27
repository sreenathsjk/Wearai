import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarParameters, ClothingItem, ClothingType } from '../types';
import { ZoomIn, ZoomOut, Maximize, Play, Pause, Compass } from 'lucide-react';

interface ThreeAvatarViewerProps {
  avatar: AvatarParameters;
  activeGarments: Record<ClothingType, ClothingItem | null>;
  cameraPreset: 'fullbody' | 'torso' | 'headshot';
}

export default function ThreeAvatarViewer({
  avatar,
  activeGarments,
  cameraPreset
}: ThreeAvatarViewerProps) {
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
    leftUpperArm: THREE.Mesh;
    rightUpperArm: THREE.Mesh;
    leftForearm: THREE.Mesh;
    rightForearm: THREE.Mesh;
    leftThigh: THREE.Mesh;
    rightThigh: THREE.Mesh;
    leftCalf: THREE.Mesh;
    rightCalf: THREE.Mesh;
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

    // 4. Construct Parametric High-Fidelity Human Body Mannequin
    const config = getProportions(avatar);
    const skeletonGroup = new THREE.Group();
    scene.add(skeletonGroup);

    // Premium Skin Satin-mannequin material with muscular shiny specularity
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.skinTone),
      roughness: 0.32,
      metalness: 0.12,
      bumpScale: 0.01,
    });

    // Create dynamic layered fabric clothing materials based on category selections
    const createGarmentMaterial = (colorHex: string) => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.65,
        metalness: 0.15,
        bumpScale: 0.02
      });
    };

    const topMaterial = createGarmentMaterial(activeGarments.top?.primaryColor || '#e2e8f0');
    const bottomMaterial = createGarmentMaterial(activeGarments.bottom?.primaryColor || '#1e293b');
    const dressMaterial = createGarmentMaterial(activeGarments.dress?.primaryColor || '#9f1239');
    const outerwearMaterial = createGarmentMaterial(activeGarments.outerwear?.primaryColor || '#78350f');

    const headSize = config.height * config.headRatio;
    const bodyHeight = config.height - headSize - config.legLength;

    // A. Torso Master Group (combining Pelvis, Abdomen, Chest, Bust definitions for organic beauty)
    const torsoGroup = new THREE.Group() as any; // Cast as Group but conforms to skeleton structure
    const torsoY = config.legLength + (bodyHeight / 2);
    torsoGroup.position.y = torsoY;
    skeletonGroup.add(torsoGroup);

    // 1. Pelvis Mesh (Spheroid representing hips)
    const pelvisGeo = new THREE.SphereGeometry(1, 24, 24);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, skinMaterial);
    pelvisMesh.scale.set(config.hipWidth * 0.48, bodyHeight * 0.3, config.chestThickness * 0.46);
    pelvisMesh.position.set(0, -bodyHeight * 0.35, 0);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    torsoGroup.add(pelvisMesh);

    // 2. Abdomen/Waist Mesh (tapering upward)
    const waistGeo = new THREE.CylinderGeometry(config.waistWidth * 0.45, config.hipWidth * 0.48, bodyHeight * 0.38, 24);
    const waistMesh = new THREE.Mesh(waistGeo, skinMaterial);
    waistMesh.position.set(0, -bodyHeight * 0.05, 0);
    waistMesh.castShadow = true;
    waistMesh.receiveShadow = true;
    torsoGroup.add(waistMesh);

    // 3. Upper Chest/Bust Spheroid
    const chestGeo = new THREE.SphereGeometry(1, 24, 24);
    const chestMesh = new THREE.Mesh(chestGeo, skinMaterial);
    chestMesh.scale.set(config.chestWidth * 0.5, bodyHeight * 0.45, config.chestThickness * 0.5);
    chestMesh.position.set(0, bodyHeight * 0.28, 0);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    torsoGroup.add(chestMesh);

    // 4. Shoulder ball joints for elegant smooth arm attachments
    const jointRadius = 0.055 * config.ageFactor;
    const shoulderGeo = new THREE.SphereGeometry(jointRadius, 16, 16);
    
    const leftShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
    leftShoulder.position.set(-config.chestWidth * 0.54, bodyHeight * 0.38, 0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
    rightShoulder.position.set(config.chestWidth * 0.54, bodyHeight * 0.38, 0);
    torsoGroup.add(rightShoulder);

    // 5. Gender Specific Anatomical Enhancements
    if (avatar.gender === 'female') {
      // Add curvaceous breast spheres on the upper chest
      const breastGeo = new THREE.SphereGeometry(bodyHeight * 0.1, 16, 16);
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
    const neckGeo = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 16);
    const neck = new THREE.Mesh(neckGeo, skinMaterial);
    neck.position.set(0, bodyHeight * 0.55, 0);
    neck.castShadow = true;
    torsoGroup.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, bodyHeight * 0.56 + (headSize * 0.5), 0);
    torsoGroup.add(headGroup);

    // Anatomical Skull Ellipsoid
    const headGeo = new THREE.SphereGeometry(headSize * 0.44, 24, 24);
    const headSkull = new THREE.Mesh(headGeo, skinMaterial);
    headSkull.scale.set(1, 1.15, 1.02);
    headSkull.castShadow = true;
    headGroup.add(headSkull);

    // Tapered Jawline Chin segment
    const jawGeo = new THREE.CylinderGeometry(headSize * 0.24, headSize * 0.12, headSize * 0.34, 16);
    const jawChin = new THREE.Mesh(jawGeo, skinMaterial);
    jawChin.position.set(0, -headSize * 0.28, headSize * 0.05);
    jawChin.rotation.x = 0.22;
    headGroup.add(jawChin);

    // Cute stylized nose bridge
    const noseGeo = new THREE.ConeGeometry(headSize * 0.06, headSize * 0.18, 4);
    const nose = new THREE.Mesh(noseGeo, skinMaterial);
    nose.position.set(0, -headSize * 0.06, headSize * 0.41);
    nose.rotation.x = 1.15;
    headGroup.add(nose);

    // Ear loops
    const earGeo = new THREE.SphereGeometry(headSize * 0.09, 12, 12);
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-headSize * 0.43, -headSize * 0.05, -headSize * 0.05);
    leftEar.scale.set(0.4, 1, 0.7);
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = headSize * 0.43;
    headGroup.add(rightEar);

    // Stylish manicured haircut wig
    const hairColor = avatar.gender === 'female' ? '#321d11' : '#1a2333'; // Deep brunette / Obsidian blue
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.25,
      metalness: 0.16
    });

    const hairCapGeo = new THREE.SphereGeometry(headSize * 0.48, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMaterial);
    hairCap.position.set(0, headSize * 0.07, -headSize * 0.02);
    hairCap.rotation.x = -0.15;
    headGroup.add(hairCap);

    // Adding fashionable bangs / side sweeps depending on gender
    if (avatar.gender === 'female') {
      const lockGeo = new THREE.SphereGeometry(headSize * 0.18, 12, 12);
      
      const leftLock = new THREE.Mesh(lockGeo, hairMaterial);
      leftLock.position.set(-headSize * 0.32, -headSize * 0.15, headSize * 0.25);
      leftLock.scale.set(0.6, 2.2, 0.8);
      headGroup.add(leftLock);

      const rightLock = leftLock.clone();
      rightLock.position.x = headSize * 0.32;
      headGroup.add(rightLock);
    } else {
      const crewLockGeo = new THREE.BoxGeometry(headSize * 0.6, headSize * 0.12, headSize * 0.3);
      const crewLock = new THREE.Mesh(crewLockGeo, hairMaterial);
      crewLock.position.set(0, headSize * 0.42, headSize * 0.15);
      headGroup.add(crewLock);
    }

    // C. Upper Limbs: Tapered shoulders, wrist nodes and modeled flat hands
    const armRadius = 0.045 * config.ageFactor;
    const upperArmLength = config.armLength * 0.45;
    const forearmLength = config.armLength * 0.45;

    // Muscular Upper arms (tapered)
    const upperArmGeo = new THREE.CylinderGeometry(armRadius * 1.15, armRadius * 0.88, upperArmLength, 12);
    // Forearm (tapered)
    const forearmGeo = new THREE.CylinderGeometry(armRadius * 0.85, armRadius * 0.65, forearmLength, 12);

    const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
    leftUpperArm.position.set(-config.chestWidth * 0.6, config.legLength + (bodyHeight * 0.82), 0);
    leftUpperArm.castShadow = true;
    skeletonGroup.add(leftUpperArm);

    const leftForearm = new THREE.Mesh(forearmGeo, skinMaterial);
    leftForearm.position.set(0, -upperArmLength * 0.85, 0);
    leftForearm.castShadow = true;
    leftUpperArm.add(leftForearm);

    // Anatomical Wrist joint and hand capsule
    const handJointGeo = new THREE.SphereGeometry(armRadius * 0.68, 12, 12);
    const leftWrist = new THREE.Mesh(handJointGeo, skinMaterial);
    leftWrist.position.set(0, -forearmLength * 0.52, 0);
    leftForearm.add(leftWrist);

    const handGeo = new THREE.BoxGeometry(armRadius * 1.2, armRadius * 0.3, armRadius * 1.5);
    const leftHand = new THREE.Mesh(handGeo, skinMaterial);
    leftHand.position.set(0, -armRadius * 0.9, 0);
    leftWrist.add(leftHand);

    // Right Arm Hierarchy
    const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
    rightUpperArm.position.set(config.chestWidth * 0.6, config.legLength + (bodyHeight * 0.82), 0);
    rightUpperArm.castShadow = true;
    skeletonGroup.add(rightUpperArm);

    const rightForearm = new THREE.Mesh(forearmGeo, skinMaterial);
    rightForearm.position.set(0, -upperArmLength * 0.85, 0);
    rightForearm.castShadow = true;
    rightUpperArm.add(rightForearm);

    const rightWrist = new THREE.Mesh(handJointGeo, skinMaterial);
    rightWrist.position.set(0, -forearmLength * 0.52, 0);
    rightForearm.add(rightWrist);

    const rightHand = leftHand.clone();
    rightWrist.add(rightHand);


    // D. Lower Limbs: Tapered Thighs, detailed calf curves and stylish sneakers wedges
    const thighLength = config.legLength * 0.52;
    const calfLength = config.legLength * 0.48;
    const thighRadius = 0.075 * config.ageFactor;
    const calfRadius = thighRadius * 0.72;

    // Tapered thigh (Thickest on hip connection, narrows to knee)
    const thighGeo = new THREE.CylinderGeometry(thighRadius * 1.25, thighRadius * 0.76, thighLength, 12);
    // Calf (Defined muscle curve bulging in top half, tapering to slender ankle)
    const calfGeo = new THREE.CylinderGeometry(calfRadius * 1.05, calfRadius * 0.52, calfLength, 12);

    const leftThigh = new THREE.Mesh(thighGeo, skinMaterial);
    leftThigh.position.set(-config.hipWidth * 0.24, config.legLength - (thighLength * 0.42), 0);
    leftThigh.castShadow = true;
    skeletonGroup.add(leftThigh);

    const leftCalf = new THREE.Mesh(calfGeo, skinMaterial);
    leftCalf.position.set(0, -thighLength * 0.86, 0);
    leftCalf.castShadow = true;
    leftThigh.add(leftCalf);

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
    leftCalf.add(leftFoot);

    // Sole contour
    const soleGeo = new THREE.BoxGeometry(calfRadius * 1.45, calfRadius * 0.2, calfRadius * 2.9);
    const leftSole = new THREE.Mesh(soleGeo, new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 }));
    leftSole.position.set(0, -calfLength * 0.54 - calfRadius * 0.45, calfRadius * 0.7);
    leftCalf.add(leftSole);

    // Right Leg Hierarchy
    const rightThigh = new THREE.Mesh(thighGeo, skinMaterial);
    rightThigh.position.set(config.hipWidth * 0.24, config.legLength - (thighLength * 0.42), 0);
    rightThigh.castShadow = true;
    skeletonGroup.add(rightThigh);

    const rightCalf = new THREE.Mesh(calfGeo, skinMaterial);
    rightCalf.position.set(0, -thighLength * 0.86, 0);
    rightCalf.castShadow = true;
    rightThigh.add(rightCalf);

    const rightFoot = leftFoot.clone();
    rightCalf.add(rightFoot);

    const rightSole = leftSole.clone();
    rightCalf.add(rightSole);


    // ================= E. LAYERED 3D APPAREL LAYER ENGINE =================
    // 1. TOP GARMENT OVERLAY (Knit / Shirts)
    if (activeGarments.top) {
      // Vest body wrapping the chest & waist
      const topVestGeo = new THREE.CylinderGeometry(
        config.chestWidth * 0.525,  // slightly larger than torso
        config.waistWidth * 0.535,
        bodyHeight * 0.76,
        24
      );
      const topVest = new THREE.Mesh(topVestGeo, topMaterial);
      topVest.position.set(0, bodyHeight * 0.14, 0); // Positioned over chest
      topVest.castShadow = true;
      torsoGroup.add(topVest);

      // Sleeves draping the upper arms automatically!
      const sleeveGeo = new THREE.CylinderGeometry(
        armRadius * 1.25,
        armRadius * 1.15,
        upperArmLength * 0.7,
        12
      );
      
      const leftSleeve = new THREE.Mesh(sleeveGeo, topMaterial);
      leftSleeve.position.set(0, upperArmLength * 0.1, 0);
      leftSleeve.castShadow = true;
      leftUpperArm.add(leftSleeve);

      const rightSleeve = new THREE.Mesh(sleeveGeo, topMaterial);
      rightSleeve.position.set(0, upperArmLength * 0.1, 0);
      rightSleeve.castShadow = true;
      rightUpperArm.add(rightSleeve);
    }

    // 2. BOTTOM WEAR OVERLAY (Trousers/Jeans)
    if (activeGarments.bottom) {
      // Left pants thighs drape
      const pantsThighGeo = new THREE.CylinderGeometry(
        thighRadius * 1.34,
        thighRadius * 1.15,
        thighLength * 0.95,
        12
      );
      const leftPantsThigh = new THREE.Mesh(pantsThighGeo, bottomMaterial);
      leftPantsThigh.position.set(0, -thighLength * 0.04, 0);
      leftPantsThigh.castShadow = true;
      leftThigh.add(leftPantsThigh);

      const rightPantsThigh = new THREE.Mesh(pantsThighGeo, bottomMaterial);
      rightPantsThigh.position.set(0, -thighLength * 0.04, 0);
      rightPantsThigh.castShadow = true;
      rightThigh.add(rightPantsThigh);

      // Calf trouser extensions draping below the knee
      const pantsCalfGeo = new THREE.CylinderGeometry(
        calfRadius * 1.25,
        calfRadius * 1.14,
        calfLength * 0.9,
        12
      );
      const leftPantsCalf = new THREE.Mesh(pantsCalfGeo, bottomMaterial);
      leftPantsCalf.position.set(0, -calfLength * 0.04, 0);
      leftPantsCalf.castShadow = true;
      leftCalf.add(leftPantsCalf);

      const rightPantsCalf = new THREE.Mesh(pantsCalfGeo, bottomMaterial);
      rightPantsCalf.position.set(0, -calfLength * 0.04, 0);
      rightPantsCalf.castShadow = true;
      rightCalf.add(rightPantsCalf);
    }

    // 3. DRESS WEAR OVERLAY (Elegant Flared Gown)
    if (activeGarments.dress) {
      // Elegant shape hugging the bust and expanding into a elegant skirt drape covering legs
      const dressGeo = new THREE.CylinderGeometry(
        config.chestWidth * 0.525,
        config.hipWidth * 0.72,
        bodyHeight * 1.35,
        24
      );
      const dressMesh = new THREE.Mesh(dressGeo, dressMaterial);
      dressMesh.position.set(0, -bodyHeight * 0.15, 0);
      dressMesh.castShadow = true;
      torsoGroup.add(dressMesh);
    }

    // 4. OUTERWEAR WEAR OVERLAY (Structured Open Coat / Blazer)
    if (activeGarments.outerwear) {
      // Overcoat wraps wider on top of the vest shirt to prevent clipping!
      const coatGeo = new THREE.CylinderGeometry(
        config.chestWidth * 0.54,
        config.waistWidth * 0.56,
        bodyHeight * 0.85,
        24
      );
      const coatMesh = new THREE.Mesh(coatGeo, outerwearMaterial);
      coatMesh.position.set(0, bodyHeight * 0.12, 0);
      coatMesh.castShadow = true;
      torsoGroup.add(coatMesh);

      // Outer collar details to make it look highly stylized & double breasted
      const collarGeo = new THREE.BoxGeometry(config.chestWidth * 0.18, bodyHeight * 0.35, config.chestThickness * 0.22);
      
      const leftCollar = new THREE.Mesh(collarGeo, outerwearMaterial);
      leftCollar.position.set(-config.chestWidth * 0.22, bodyHeight * 0.22, config.chestThickness * 0.44);
      leftCollar.rotation.y = 0.25;
      coatMesh.add(leftCollar);

      const rightCollar = new THREE.Mesh(collarGeo, outerwearMaterial);
      rightCollar.position.set(config.chestWidth * 0.22, bodyHeight * 0.22, config.chestThickness * 0.44);
      rightCollar.rotation.y = -0.25;
      coatMesh.add(rightCollar);

      // Long coat sleeves
      const coatSleeveGeo = new THREE.CylinderGeometry(
        armRadius * 1.35,
        armRadius * 1.22,
        upperArmLength * 0.82,
        12
      );
      
      const leftCoatSleeve = new THREE.Mesh(coatSleeveGeo, outerwearMaterial);
      leftCoatSleeve.position.set(0, upperArmLength * 0.05, 0);
      leftCoatSleeve.castShadow = true;
      leftUpperArm.add(leftCoatSleeve);

      const rightCoatSleeve = new THREE.Mesh(coatSleeveGeo, outerwearMaterial);
      rightCoatSleeve.position.set(0, upperArmLength * 0.05, 0);
      rightCoatSleeve.castShadow = true;
      rightUpperArm.add(rightCoatSleeve);
    }

    // Save parts registry globally
    skeletonRef.current = {
      skeletonGroup,
      head: headGroup,
      torso: torsoGroup,
      leftUpperArm,
      rightUpperArm,
      leftForearm,
      rightForearm,
      leftThigh,
      rightThigh,
      leftCalf,
      rightCalf
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
      topMaterial.dispose();
      bottomMaterial.dispose();
      dressMaterial.dispose();
      outerwearMaterial.dispose();
      shoeMaterial.dispose();
      renderer.dispose();
    };
  }, [avatar, activeGarments, animationMode, isRotating]);

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
