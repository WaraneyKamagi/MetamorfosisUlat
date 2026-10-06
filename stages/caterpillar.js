import * as THREE from 'three';
import { createVoxelMesh, sharedBoxGeometry } from '../voxel.js';

/**
 * Membuat model 3D ulat voxel yang terdiri dari 7 segmen tubuh artikulasi dan potongan daun untuk dimakan
 */
export function createCaterpillarObject() {
  const caterpillarContainer = new THREE.Group();
  caterpillarContainer.position.set(0, -0.22, 0.5);
  caterpillarContainer.scale.set(0.001, 0.001, 0.001); // Awalnya sembunyi sebelum tahap 2 dimulai

  const segments = [];
  const numSegments = 7;
  const segSpacing = 0.22;

  // Warna khas ulat kupu-kupu raja (Monarch caterpillar / swallowtail)
  const colorsGreen = ['#43a047', '#4caf50', '#66bb6a', '#388e3c'];
  const colorStripeYellow = '#fdd835';
  const colorStripeBlack = '#212121';
  const colorFoot = '#1b5e20';

  for (let i = 0; i < numSegments; i++) {
    const segGroup = new THREE.Group();
    segGroup.position.set(0, 0, -i * segSpacing);

    const segVoxels = [];
    const isHead = (i === 0);
    const isTail = (i === numSegments - 1);
    const radius = isHead ? 2 : (isTail ? 1.5 : 2.2);

    // Bentuk cincin kubus untuk setiap segmen
    for (let x = -2; x <= 2; x++) {
      for (let y = 0; y <= 3; y++) {
        for (let z = -1; z <= 1; z++) {
          const d = (x * x) / (radius * radius) + ((y - 1.5) * (y - 1.5)) / (radius * radius);
          if (d <= 1.2 && d >= 0.4) {
            let col = colorsGreen[i % colorsGreen.length];
            if (y === 2 && Math.abs(x) === 2) {
              col = colorStripeYellow; // Corak kuning di samping
            } else if (z === 0 && (x + y) % 2 === 0) {
              col = colorStripeBlack;  // Aksen garis gelap
            }
            segVoxels.push([x, y, z, col]);
          }
        }
      }
    }

    // Kaki semu kecil di bawah segmen tubuh
    if (!isHead) {
      segVoxels.push([-2, -1, 0, colorFoot]);
      segVoxels.push([2, -1, 0, colorFoot]);
    }

    // Wajah & sungut khusus di segmen kepala (segmen 0)
    if (isHead) {
      // Mata hitam berkilau
      segVoxels.push([-1, 2, 2, '#000000']);
      segVoxels.push([1, 2, 2, '#000000']);
      // Titik putih pantulan mata
      segVoxels.push([-1, 3, 2, '#ffffff']);
      segVoxels.push([1, 3, 2, '#ffffff']);
      // Sungut ulat (tentakel hitam di kepala)
      segVoxels.push([-1, 4, 1, '#1b5e20']);
      segVoxels.push([-2, 5, 1, '#212121']);
      segVoxels.push([1, 4, 1, '#1b5e20']);
      segVoxels.push([2, 5, 1, '#212121']);
      // Rahang / mulut kecil
      segVoxels.push([0, 0, 2, '#2e7d32']);
    }

    const segMesh = createVoxelMesh(segVoxels, { scale: 0.08, gap: 0.95 });
    segGroup.add(segMesh);
    caterpillarContainer.add(segGroup);
    segments.push(segGroup);
  }

  // Daun yang bisa digigit (terdiri dari 6 balok gigitan yang akan hilang saat ulat makan)
  const biteLeafGroup = new THREE.Group();
  biteLeafGroup.position.set(1.4, -0.22, -0.2);

  const biteBlocks = [];
  const bitePositions = [
    [0, 0, 0], [0.15, 0, 0], [0.3, 0, 0],
    [0, 0, 0.15], [0.15, 0, 0.15], [0.3, 0, 0.15]
  ];
  const biteMat = new THREE.MeshLambertMaterial({ color: 0x81c784, flatShading: true });

  for (let i = 0; i < bitePositions.length; i++) {
    const bMesh = new THREE.Mesh(sharedBoxGeometry, biteMat);
    bMesh.scale.set(0.14, 0.06, 0.14);
    bMesh.position.set(...bitePositions[i]);
    biteLeafGroup.add(bMesh);
    biteBlocks.push(bMesh);
  }

  return {
    group: caterpillarContainer,
    segments: segments,
    biteLeafGroup: biteLeafGroup,
    biteBlocks: biteBlocks
  };
}

/**
 * Menambahkan animasi tahap ulat ke timeline utama Anime.js
 * Rentang waktu: 2500 - 5000 ms
 */
export function addCaterpillarStageToTimeline(timeline, caterpillarObj, context) {
  const { group, segments, biteLeafGroup, biteBlocks } = caterpillarObj;
  const { camera, cameraTarget } = context;

  // 1. Ulat muncul dan tumbuh dari bayi menjadi anak ulat aktif
  timeline.add(group.scale, {
    x: [0.001, 0.75],
    y: [0.001, 0.75],
    z: [0.001, 0.75],
    duration: 300,
    ease: 'outBack'
  }, 2500);

  // 2. Kamera beralih mengitari ulat yang merayap di atas daun
  timeline.add(camera.position, {
    x: [1.2, 2.6],
    y: [1.8, 2.2],
    z: [3.8, 4.5],
    duration: 2500,
    ease: 'linear'
  }, 2500);

  timeline.add(cameraTarget, {
    x: [0.2, 0.8],
    y: [0.15, 0.2],
    z: [0.5, 0.1],
    duration: 2500,
    ease: 'linear'
  }, 2500);

  // 3. Gerakan merayap (berjalan menuju area daun makanan) pada 2600ms - 3400ms
  timeline.add(group.position, {
    x: [0, 0.9],
    z: [0.5, 0.0],
    duration: 900,
    ease: 'inOutSine'
  }, 2600);

  // Gelombang merayap berurutan antar-segmen (inchworm wave stagger)
  segments.forEach((seg, idx) => {
    timeline.add(seg.position, {
      y: [0, 0.12, 0],
      duration: 400,
      ease: 'inOutQuad'
    }, 2600 + idx * 70);

    timeline.add(seg.rotation, {
      x: [0, 0.18, -0.15, 0],
      duration: 450,
      ease: 'inOutSine'
    }, 2600 + idx * 60);
  });

  // 4. Tahap Ulat Makan Daun pada 3500ms - 4400ms
  // Kepala mengangguk makan
  const head = segments[0];
  timeline.add(head.rotation, {
    x: [0, 0.35, -0.1, 0.35, -0.1, 0.3, 0],
    duration: 900,
    ease: 'inOutSine'
  }, 3500);

  // Balok daun berkurang satu demi satu seperti digigit ulat
  biteBlocks.forEach((block, bIdx) => {
    timeline.add(block.scale, {
      x: [0.14, 0.001],
      y: [0.06, 0.001],
      z: [0.14, 0.001],
      duration: 150,
      ease: 'inQuad'
    }, 3600 + bIdx * 120);
  });

  // 5. Tubuh ulat membesar secara nyata karena kenyang makan (scale 0.75 -> 1.35)
  timeline.add(group.scale, {
    x: [0.75, 1.35],
    y: [0.75, 1.35],
    z: [0.75, 1.35],
    duration: 800,
    ease: 'outBack'
  }, 3800);

  // 6. Ulat gemuk kenyang bergerak menuju pangkal ranting untuk bersiap menggantung pada 4400ms - 5000ms
  timeline.add(group.position, {
    x: [0.9, -0.4],
    z: [0.0, -0.4],
    duration: 600,
    ease: 'inOutSine'
  }, 4400);

  timeline.add(group.rotation, {
    y: [0, -0.6],
    duration: 600,
    ease: 'inOutSine'
  }, 4400);

  // Segmen bergelombang lagi saat berjalan ke ranting
  segments.forEach((seg, idx) => {
    timeline.add(seg.position, {
      y: [0, 0.1, 0],
      duration: 350,
      ease: 'inOutQuad'
    }, 4400 + idx * 50);
  });

  // Di akhir tahap 2 (5000ms), ulat mengecil/menghilang ke posisi ranting saat digantikan oleh ulat menggantung di tahap 3
  timeline.add(group.scale, {
    x: [1.35, 0.001],
    y: [1.35, 0.001],
    z: [1.35, 0.001],
    duration: 200,
    ease: 'inOutQuad'
  }, 4950);
}
