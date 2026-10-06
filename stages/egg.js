import * as THREE from 'three';
import { createVoxelMesh } from '../voxel.js';

/**
 * Membuat model 3D telur voxel di atas daun dengan tutup yang bisa retak dan bayi ulat di dalamnya
 */
export function createEggObject() {
  const eggContainer = new THREE.Group();
  eggContainer.position.set(0, -0.35, 0.5);

  const eggColorBase = '#f9fbe7';
  const eggColorHighlight = '#ffffff';
  const eggColorShade = '#e8f5e9';
  const eggColorPattern = '#dce775';

  const bottomVoxels = [];
  const topVoxels = [];

  // Dimensi voxel telur (radius x: 4, y: 6, z: 4 balok)
  const rx = 3;
  const ry = 5;
  const rz = 3;

  for (let x = -rx; x <= rx; x++) {
    for (let y = -ry; y <= ry; y++) {
      for (let z = -rz; z <= rz; z++) {
        // Persamaan bentuk elipsoid telur (bagian bawah agak lebih gemuk)
        const taper = 1.0 - (y / ry) * 0.15;
        const d = (x * x) / ((rx * taper) * (rx * taper)) +
          (y * y) / (ry * ry) +
          (z * z) / ((rz * taper) * (rz * taper));

        // Hanya buat cangkang luar (kulit telur) agar ringan
        if (d <= 1.05 && d >= 0.55) {
          let col = eggColorBase;
          if (y === ry || (x === 0 && z === -rz)) col = eggColorHighlight;
          else if (y === -ry) col = eggColorShade;
          else if ((x + y + z) % 4 === 0) col = eggColorPattern;

          // Pisahkan bagian atas (retak/terbuka) dan bawah
          if (y >= 1) {
            topVoxels.push([x, y - 1, z, col]);
          } else {
            bottomVoxels.push([x, y, z, col]);
          }
        }
      }
    }
  }

  // Mesh cangkang bawah
  const eggBottomMesh = createVoxelMesh(bottomVoxels, { scale: 0.12, gap: 0.98 });
  eggContainer.add(eggBottomMesh);

  // Pivot untuk cangkang atas (tutup telur) agar bisa terbuka miring
  const eggTopPivot = new THREE.Group();
  eggTopPivot.position.set(0, 0.12, 0);
  const eggTopMesh = createVoxelMesh(topVoxels, { scale: 0.12, gap: 0.98 });
  eggTopPivot.add(eggTopMesh);
  eggContainer.add(eggTopPivot);

  // Model bayi ulat mungil yang berada di dalam telur
  const babyGroup = new THREE.Group();
  babyGroup.position.set(0, 0, 0);
  babyGroup.scale.set(0.01, 0.01, 0.01); // Awalnya sembunyi di dalam telur

  const babyVoxels = [
    // Kepala ulat bayi
    [0, 1, 0, '#66bb6a'],
    [0, 2, 0, '#43a047'],
    [-1, 1, 0, '#66bb6a'],
    [1, 1, 0, '#66bb6a'],
    [0, 1, 1, '#43a047'],
    // Mata hitam mungil
    [-1, 2, 1, '#212121'],
    [1, 2, 1, '#212121'],
    // Sungut mungil
    [-1, 3, 0, '#388e3c'],
    [1, 3, 0, '#388e3c'],
    // Tubuh bayi
    [0, 0, -1, '#81c784'],
    [0, 0, -2, '#66bb6a'],
    [0, 0, -3, '#43a047']
  ];
  const babyMesh = createVoxelMesh(babyVoxels, { scale: 0.1, gap: 0.95 });
  babyGroup.add(babyMesh);
  eggContainer.add(babyGroup);

  return {
    group: eggContainer,
    eggBottom: eggBottomMesh,
    eggTopPivot: eggTopPivot,
    babyGroup: babyGroup
  };
}

/**
 * Menambahkan animasi tahap telur ke timeline utama Anime.js
 * Rentang waktu: 0 - 2500 ms
 */
export function addEggStageToTimeline(timeline, eggObj, context) {
  const { group, eggTopPivot, babyGroup } = eggObj;
  const { camera, cameraTarget, sceneInstance } = context;

  // 1. Posisi Kamera Awal (Zoom-in lembut ke arah telur di atas daun)
  timeline.add(camera.position, {
    x: [0.6, 1.2],
    y: [1.6, 1.8],
    z: [3.2, 3.8],
    duration: 2500,
    ease: 'linear'
  }, 0);

  timeline.add(cameraTarget, {
    x: [0, 0.2],
    y: [0.1, 0.15],
    z: [0.4, 0.5],
    duration: 2500,
    ease: 'linear'
  }, 0);

  // 2. Telur bergoyang pelan (tanda akan menetas) pada 600ms - 1200ms
  timeline.add(group.rotation, {
    z: [0, 0.08, -0.08, 0.06, -0.05, 0],
    x: [0, 0.04, -0.04, 0],
    duration: 700,
    ease: 'inOutSine'
  }, 600);

  // 3. Tutup telur retak & terangkat miring pada 1200ms - 1700ms
  timeline.add(eggTopPivot.position, {
    y: [0.12, 0.35],
    x: [0, 0.15],
    duration: 500,
    ease: 'outBack'
  }, 1250);

  timeline.add(eggTopPivot.rotation, {
    z: [0, -0.75],
    x: [0, 0.45],
    duration: 500,
    ease: 'outQuad'
  }, 1250);

  // 4. Bayi ulat membesar, mengintip dan keluar dari telur pada 1500ms - 2400ms
  timeline.add(babyGroup.scale, {
    x: [0.01, 1],
    y: [0.01, 1],
    z: [0.01, 1],
    duration: 400,
    ease: 'outBack'
  }, 1450);

  timeline.add(babyGroup.position, {
    y: [0, 0.25],
    z: [0, 0.3],
    duration: 600,
    ease: 'inOutQuad'
  }, 1600);

  timeline.add(babyGroup.position, {
    z: [0.3, 0.8],
    y: [0.25, 0.05],
    duration: 500,
    ease: 'inOutQuad'
  }, 2100);

  // 5. Menjelang akhir tahap 1, telur memudar/mengecil saat ulat memasuki tahap 2
  timeline.add(group.scale, {
    x: [1, 0.01],
    y: [1, 0.01],
    z: [1, 0.01],
    duration: 300,
    ease: 'inOutQuad'
  }, 2450);
}
