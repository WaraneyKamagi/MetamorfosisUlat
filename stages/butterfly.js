import * as THREE from 'three';
import { createVoxelMesh } from '../voxel.js';

/**
 * Membuat model 3D kupu-kupu voxel dengan sayap oranye-hitam (Monarch) yang dapat mengepak dan terbuka
 */
export function createButterflyObject() {
  const butterflyContainer = new THREE.Group();
  butterflyContainer.position.set(0, 1.7, 0.1);
  butterflyContainer.scale.set(0.001, 0.001, 0.001); // Awalnya sembunyi di dalam kepompong

  // 1. Tubuh Kupu-kupu (Kepala, Toraks, Abdomen, Sungut)
  const bodyVoxels = [];
  const colorBody = '#1e1e1e';
  const colorStripe = '#3e2723';
  const colorEye = '#000000';
  const colorAntenna = '#212121';

  // Toraks (dada)
  for (let y = 0; y <= 3; y++) {
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(z) <= 1) {
          bodyVoxels.push([x, y, z, colorBody]);
        }
      }
    }
  }

  // Kepala di bagian atas
  bodyVoxels.push([0, 4, 0, colorBody]);
  bodyVoxels.push([0, 4, 1, colorBody]);
  bodyVoxels.push([-1, 4, 1, colorEye]); // Mata kiri
  bodyVoxels.push([1, 4, 1, colorEye]);  // Mata kanan
  bodyVoxels.push([-1, 5, 1, '#ffffff']); // Kilau mata
  bodyVoxels.push([1, 5, 1, '#ffffff']);

  // Sungut melengkung elegan ke atas
  bodyVoxels.push([-1, 5, 0, colorAntenna]);
  bodyVoxels.push([-2, 6, 0, colorAntenna]);
  bodyVoxels.push([-3, 7, 0, '#ff9800']); // Ujung sungut oranye
  bodyVoxels.push([1, 5, 0, colorAntenna]);
  bodyVoxels.push([2, 6, 0, colorAntenna]);
  bodyVoxels.push([3, 7, 0, '#ff9800']);

  // Abdomen (perut memanjang beruas ke bawah)
  for (let y = -1; y >= -6; y--) {
    const col = (y % 2 === 0) ? colorBody : colorStripe;
    bodyVoxels.push([0, y, 0, col]);
    if (y >= -4) {
      bodyVoxels.push([0, y, -1, col]);
      bodyVoxels.push([0, y, 1, col]);
    }
  }

  const bodyMesh = createVoxelMesh(bodyVoxels, { scale: 0.08, gap: 0.96 });
  butterflyContainer.add(bodyMesh);

  // 2. Sayap Kupu-kupu (Voxel Mosaic Oranye Jingga dengan Tepi Hitam & Bintik Putih)
  const createWingVoxels = (isRight = false) => {
    const voxels = [];
    const dir = isRight ? 1 : -1;

    const colOrange1 = '#ff6f00';
    const colOrange2 = '#ff8f00';
    const colOrange3 = '#ffa000';
    const colBlack = '#1a1a1a';
    const colWhite = '#ffffff';

    // Sayap Depan (Forewing - Besar & Menjulang ke Atas-Samping)
    for (let u = 1; u <= 11; u++) {
      for (let v = -2; v <= 10; v++) {
        // Kontur sayap depan
        const inside = (u * 0.9 + (v > 0 ? v * 0.7 : -v * 1.1) <= 12);
        if (inside) {
          const x = u * dir;
          const y = v;
          const z = 0;

          let col = (u + v) % 2 === 0 ? colOrange1 : colOrange2;

          // Garis vena sayap
          if ((u + v) % 4 === 0 || u === 6 || v === 4) {
            col = colOrange3;
          }

          // Pinggiran hitam bergaris
          const isEdge = (u >= 9 || v >= 8 || (u * 0.9 + v * 0.7 >= 10.5));
          if (isEdge) {
            col = colBlack;
            // Bintik putih di sepanjang tepi sayap luar
            if ((u + v) % 3 === 0 && (u >= 10 || v >= 9)) {
              col = colWhite;
            }
          }

          voxels.push([x, y, z, col]);
        }
      }
    }

    // Sayap Belakang (Hindwing - Membulat di Bawah)
    for (let u = 1; u <= 8; u++) {
      for (let v = -7; v <= -1; v++) {
        const dist = Math.sqrt((u - 2) * (u - 2) + (v + 4) * (v + 4));
        if (dist <= 5.2) {
          const x = u * dir;
          const y = v;
          const z = 0;

          let col = colOrange2;
          if (dist >= 4.0) {
            col = colBlack;
            if ((u + v) % 2 === 0 && dist >= 4.6) {
              col = colWhite;
            }
          }
          voxels.push([x, y, z, col]);
        }
      }
    }

    return voxels;
  };

  // Pivot Sayap Kiri
  const leftWingPivot = new THREE.Group();
  leftWingPivot.position.set(-0.06, 0.15, 0);
  const leftWingVoxels = createWingVoxels(false);
  const leftWingMesh = createVoxelMesh(leftWingVoxels, { scale: 0.08, gap: 0.98 });
  leftWingPivot.add(leftWingMesh);
  butterflyContainer.add(leftWingPivot);

  // Pivot Sayap Kanman
  const rightWingPivot = new THREE.Group();
  rightWingPivot.position.set(0.06, 0.15, 0);
  const rightWingVoxels = createWingVoxels(true);
  const rightWingMesh = createVoxelMesh(rightWingVoxels, { scale: 0.08, gap: 0.98 });
  rightWingPivot.add(rightWingMesh);
  butterflyContainer.add(rightWingPivot);

  return {
    group: butterflyContainer,
    leftWingPivot: leftWingPivot,
    rightWingPivot: rightWingPivot
  };
}

/**
 * Menambahkan animasi tahap kupu-kupu ke timeline utama Anime.js
 * Rentang waktu: 7500 - 10000 ms
 */
export function addButterflyStageToTimeline(timeline, butterflyObj, chrysalisObj, context) {
  const { group, leftWingPivot, rightWingPivot } = butterflyObj;
  const { leftShellPivot, rightShellPivot, cocoonGroup } = chrysalisObj;
  const { camera, cameraTarget } = context;

  // 1. Kepompong retak & terbuka terbelah dua pada 7500ms - 7900ms
  timeline.add(leftShellPivot.position, {
    x: [-0.25, -0.65],
    duration: 400,
    ease: 'outQuad'
  }, 7500);

  timeline.add(leftShellPivot.rotation, {
    z: [0, -0.6],
    duration: 400,
    ease: 'outQuad'
  }, 7500);

  timeline.add(rightShellPivot.position, {
    x: [0.25, 0.65],
    duration: 400,
    ease: 'outQuad'
  }, 7500);

  timeline.add(rightShellPivot.rotation, {
    z: [0, 0.6],
    duration: 400,
    ease: 'outQuad'
  }, 7500);

  // 2. Kupu-kupu muncul dari dalam kepompong (sayap terlipat basah merapat) pada 7600ms
  timeline.add(group.scale, {
    x: [0.001, 1],
    y: [0.001, 1],
    z: [0.001, 1],
    duration: 350,
    ease: 'outBack'
  }, 7600);

  // Sudut awal sayap: terlipat rapat tegak di punggung
  leftWingPivot.rotation.y = -1.25;
  rightWingPivot.rotation.y = 1.25;

  // Sayap awalnya tampak sedikit mengkerut
  timeline.add(leftWingPivot.scale, {
    x: [0.35, 1],
    y: [0.35, 1],
    z: [0.35, 1],
    duration: 700,
    ease: 'outQuad'
  }, 7750);

  timeline.add(rightWingPivot.scale, {
    x: [0.35, 1],
    y: [0.35, 1],
    z: [0.35, 1],
    duration: 700,
    ease: 'outQuad'
  }, 7750);

  // Cangkang kepompong yang terbuka memudar/mengecil
  timeline.add(cocoonGroup.scale, {
    x: [1, 0.1],
    y: [1, 0.1],
    z: [1, 0.1],
    duration: 500,
    ease: 'inOutQuad'
  }, 8000);

  // 3. Sayap mengembang perlahan dan terbuka lebar pada 8000ms - 8600ms
  timeline.add(leftWingPivot.rotation, {
    y: [-1.25, -0.1],
    duration: 600,
    ease: 'inOutCubic'
  }, 8000);

  timeline.add(rightWingPivot.rotation, {
    y: [1.25, 0.1],
    duration: 600,
    ease: 'inOutCubic'
  }, 8000);

  // 4. Mengepakkan sayap pemanasan sebelum lepas landas pada 8600ms - 9100ms
  timeline.add(leftWingPivot.rotation, {
    y: [-0.1, -0.8, 0.4, -0.8, 0.4, -0.1],
    duration: 600,
    ease: 'inOutSine'
  }, 8600);

  timeline.add(rightWingPivot.rotation, {
    y: [0.1, 0.8, -0.4, 0.8, -0.4, 0.1],
    duration: 600,
    ease: 'inOutSine'
  }, 8600);

  // 5. Kupu-kupu lepas landas dan terbang melengkung ke angkasa pada 9100ms - 10000ms
  timeline.add(group.position, {
    x: [0, 1.2, 3.8],
    y: [1.7, 3.4, 6.2],
    z: [0.1, 1.0, 3.0],
    duration: 900,
    ease: 'inOutCubic'
  }, 9100);

  timeline.add(group.rotation, {
    x: [0, 0.35, 0.5],
    y: [0, 0.8, 1.2],
    z: [0, -0.2, -0.3],
    duration: 900,
    ease: 'inOutSine'
  }, 9100);

  // Kepakan sayap cepat dan anggun saat terbang
  timeline.add(leftWingPivot.rotation, {
    y: [-0.1, -0.85, 0.6, -0.85, 0.6, -0.85, 0.6, -0.85, 0.6, -0.2],
    duration: 900,
    ease: 'inOutSine'
  }, 9100);

  timeline.add(rightWingPivot.rotation, {
    y: [0.1, 0.85, -0.6, 0.85, -0.6, 0.85, -0.6, 0.85, -0.6, 0.2],
    duration: 900,
    ease: 'inOutSine'
  }, 9100);

  // 6. Pergerakan Kamera mengikuti penerbangan kupu-kupu ke langit hangat
  timeline.add(camera.position, {
    x: [0.9, 1.8],
    y: [2.5, 4.2],
    z: [4.4, 6.8],
    duration: 2500,
    ease: 'linear'
  }, 7500);

  timeline.add(cameraTarget, {
    x: [0, 1.2],
    y: [1.4, 3.2],
    z: [0, 1.6],
    duration: 2500,
    ease: 'linear'
  }, 7500);
}
