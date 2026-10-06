import * as THREE from 'three';
import { createVoxelMesh } from '../voxel.js';

/**
 * Membuat model 3D kepompong voxel di ranting (ulat menggantung bentuk J dan cangkang kokon berdenyut)
 */
export function createChrysalisObject() {
  const chrysalisContainer = new THREE.Group();
  // Posisi menggantung di bawah ranting horizontal (ranting berada di y ~ 2.6)
  chrysalisContainer.position.set(0, 2.1, 0);
  chrysalisContainer.scale.set(0.001, 0.001, 0.001); // Awalnya sembunyi

  // 1. Bantalan sutra (silk button) tempat kepompong menempel di ranting
  const silkVoxels = [
    [0, 5, 0, '#ffffff'],
    [-1, 5, 0, '#f5f5f5'],
    [1, 5, 0, '#f5f5f5'],
    [0, 5, -1, '#eeeeee'],
    [0, 5, 1, '#eeeeee'],
    [0, 4, 0, '#e0e0e0'], // Tali sutra gantungan
    [0, 3, 0, '#e0e0e0']
  ];
  const silkMesh = createVoxelMesh(silkVoxels, { scale: 0.1, gap: 0.95 });
  chrysalisContainer.add(silkMesh);

  // 2. Ulat menggantung berbentuk huruf "J" (tahap persiapan pra-pupa)
  const jCaterpillarGroup = new THREE.Group();
  jCaterpillarGroup.position.set(0, 0.3, 0);

  const jVoxels = [
    // Ujung ekor menempel di sutra
    [0, 3, 0, '#2e7d32'],
    [0, 2, 0, '#43a047'],
    [0, 1, 0, '#66bb6a'],
    [0, 0, 0, '#43a047'],
    [0, -1, 0, '#fdd835'], // Corak kuning
    // Lengkungan J ke depan dan atas
    [0, -2, 0, '#43a047'],
    [0, -2, 1, '#66bb6a'],
    [0, -1, 2, '#43a047'],
    // Kepala ulat menekuk ke atas
    [0, 0, 2, '#2e7d32'],
    [-1, 0, 2, '#212121'], // Mata
    [1, 0, 2, '#212121']
  ];
  const jCaterpillarMesh = createVoxelMesh(jVoxels, { scale: 0.12, gap: 0.95 });
  jCaterpillarGroup.add(jCaterpillarMesh);
  chrysalisContainer.add(jCaterpillarGroup);

  // 3. Cangkang Kepompong Voxel (Warna giok hijau zaitun dengan bintik emas khas Monarch Chrysalis)
  const cocoonGroup = new THREE.Group();
  cocoonGroup.position.set(0, 0, 0);
  cocoonGroup.scale.set(0.001, 0.001, 0.001); // Muncul membungkus ulat

  const cocoonVoxels = [];
  const colorJade1 = '#43a047';
  const colorJade2 = '#388e3c';
  const colorJade3 = '#66bb6a';
  const colorGoldDot = '#ffd700'; // Mahkota bintik emas khas
  const colorGoldRim = '#ffb300';

  const rx = 3;
  const ry = 6;
  const rz = 3;

  for (let x = -rx; x <= rx; x++) {
    for (let y = -ry; y <= ry; y++) {
      for (let z = -rz; z <= rz; z++) {
        // Bentuk kapsul kepompong: meruncing ke bawah, bahu melebar di bagian atas
        const shoulder = y > 0 ? (1 + y * 0.08) : (1 + y * 0.12);
        const d = (x * x) / ((rx * shoulder) * (rx * shoulder)) +
                  (y * y) / (ry * ry) +
                  (z * z) / ((rz * shoulder) * (rz * shoulder));

        if (d <= 1.05 && d >= 0.5) {
          let col = (y % 2 === 0) ? colorJade1 : colorJade2;
          if (y === 2) {
            // Garis cincin emas mahkota kepompong
            col = (Math.abs(x) >= 2 || Math.abs(z) >= 2) ? colorGoldDot : colorGoldRim;
          } else if (y === -ry) {
            col = '#2e7d32'; // Ujung bawah gelap
          } else if (d > 0.95) {
            col = colorJade3;
          }
          cocoonVoxels.push([x, y, z, col]);
        }
      }
    }
  }

  // Pisahkan cangkang kepompong menjadi 2 belahan (kiri dan kanan) agar bisa retak dan terbuka di tahap 4!
  const leftShellVoxels = cocoonVoxels.filter(v => v[0] <= 0);
  const rightShellVoxels = cocoonVoxels.filter(v => v[0] >= 0);

  const leftShellPivot = new THREE.Group();
  leftShellPivot.position.set(-0.25, 0, 0);
  const leftShellMesh = createVoxelMesh(leftShellVoxels, { scale: 0.11, gap: 0.96 });
  leftShellPivot.add(leftShellMesh);

  const rightShellPivot = new THREE.Group();
  rightShellPivot.position.set(0.25, 0, 0);
  const rightShellMesh = createVoxelMesh(rightShellVoxels, { scale: 0.11, gap: 0.96 });
  rightShellPivot.add(rightShellMesh);

  cocoonGroup.add(leftShellPivot);
  cocoonGroup.add(rightShellPivot);
  chrysalisContainer.add(cocoonGroup);

  return {
    group: chrysalisContainer,
    jCaterpillarGroup: jCaterpillarGroup,
    cocoonGroup: cocoonGroup,
    leftShellPivot: leftShellPivot,
    rightShellPivot: rightShellPivot
  };
}

/**
 * Menambahkan animasi tahap kepompong ke timeline utama Anime.js
 * Rentang waktu: 5000 - 7500 ms
 */
export function addChrysalisStageToTimeline(timeline, chrysalisObj, context) {
  const { group, jCaterpillarGroup, cocoonGroup, leftShellPivot, rightShellPivot } = chrysalisObj;
  const { camera, cameraTarget } = context;

  // 1. Munculkan kelompok kepompong di bawah ranting pada 5000ms
  timeline.add(group.scale, {
    x: [0.001, 1],
    y: [0.001, 1],
    z: [0.001, 1],
    duration: 350,
    ease: 'outBack'
  }, 5000);

  // 2. Kamera mengarah ke atas melihat ulat menggantung di ranting
  timeline.add(camera.position, {
    x: [2.6, 0.9],
    y: [2.2, 2.5],
    z: [4.5, 4.4],
    duration: 2500,
    ease: 'linear'
  }, 5000);

  timeline.add(cameraTarget, {
    x: [0.8, 0],
    y: [0.2, 1.4],
    z: [0.1, 0],
    duration: 2500,
    ease: 'linear'
  }, 5000);

  // 3. Ulat bergelantungan dan sedikit berayun lembut ditiup angin pada 5000ms - 5500ms
  timeline.add(jCaterpillarGroup.rotation, {
    z: [0, 0.08, -0.06, 0],
    duration: 600,
    ease: 'inOutSine'
  }, 5000);

  // 4. Balok-balok kepompong menyusun diri membungkus ulat pada 5500ms - 6200ms
  timeline.add(cocoonGroup.scale, {
    x: [0.001, 1],
    y: [0.001, 1],
    z: [0.001, 1],
    duration: 650,
    ease: 'outBack'
  }, 5500);

  // Ulat menghilang/terbungkus di dalam kokon
  timeline.add(jCaterpillarGroup.scale, {
    x: [1, 0.001],
    y: [1, 0.001],
    z: [1, 0.001],
    duration: 500,
    ease: 'inOutQuad'
  }, 5650);

  // 5. Denyutan halus kepompong (pulse scale 1.0 ke 1.03) seperti detak kehidupan metamorfosis pada 6200ms - 7200ms
  timeline.add(cocoonGroup.scale, {
    x: [1, 1.03, 1, 1.035, 1, 1.03, 1],
    y: [1, 1.03, 1, 1.035, 1, 1.03, 1],
    z: [1, 1.03, 1, 1.035, 1, 1.03, 1],
    duration: 1000,
    ease: 'inOutSine'
  }, 6200);

  // 6. Getaran menjelang retak pada akhir tahap kepompong (7200ms - 7500ms)
  timeline.add(cocoonGroup.rotation, {
    z: [0, 0.05, -0.05, 0.04, -0.03, 0],
    duration: 300,
    ease: 'inOutSine'
  }, 7200);
}
