import * as THREE from 'three';

// Geometri kubus tunggal yang dipakai bersama oleh seluruh model voxel untuk menghemat memori GPU
export const sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 1);

// Material default dengan MeshLambertMaterial sesuai aturan performa
export const defaultVoxelMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  flatShading: true
});

/**
 * Membuat satu InstancedMesh untuk sekumpulan balok voxel.
 * @param {Array<[number, number, number, string|number]>} voxels - Array berisi [x, y, z, hexColor]
 * @param {Object} options - Pengaturan ukuran voxel dan posisi pivot
 * @returns {THREE.InstancedMesh}
 */
export function createVoxelMesh(voxels, options = {}) {
  const {
    scale = 0.2,          // Ukuran satu balok (dalam unit Three.js)
    material = defaultVoxelMaterial,
    gap = 0.96,           // Sedikit celah antar balok untuk mempertegas siluet kubus voxel
    center = false
  } = options;

  const count = voxels.length;
  const instancedMesh = new THREE.InstancedMesh(sharedBoxGeometry, material, count);
  instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  // Hitung offset jika ingin pivot di tengah
  let offsetX = 0;
  let offsetY = 0;
  let offsetZ = 0;

  if (center && count > 0) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      const [x, y, z] = voxels[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    offsetX = (minX + maxX) / 2;
    offsetY = (minY + maxY) / 2;
    offsetZ = (minZ + maxZ) / 2;
  }

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const blockSize = scale * gap;

  for (let i = 0; i < count; i++) {
    const [x, y, z, hexColor] = voxels[i];

    dummy.position.set(
      (x - offsetX) * scale,
      (y - offsetY) * scale,
      (z - offsetZ) * scale
    );
    dummy.scale.set(blockSize, blockSize, blockSize);
    dummy.updateMatrix();

    instancedMesh.setMatrixAt(i, dummy.matrix);
    color.set(hexColor);
    instancedMesh.setColorAt(i, color);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }

  return instancedMesh;
}

/**
 * Generator voxel bola/telur sederhana (hanya bagian permukaan/cangkang luar)
 */
export function generateEllipsoidShell(rx, ry, rz, color, innerThickness = 1) {
  const blocks = [];
  const minR = Math.min(rx, ry, rz);
  for (let x = -rx; x <= rx; x++) {
    for (let y = -ry; y <= ry; y++) {
      for (let z = -rz; z <= rz; z++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz);
        if (d <= 1.0) {
          // Hanya simpan jika dekat dengan permukaan (cangkang luar)
          const dInner = (x * x) / ((rx - innerThickness) * (rx - innerThickness)) +
                         (y * y) / ((ry - innerThickness) * (ry - innerThickness)) +
                         (z * z) / ((rz - innerThickness) * (rz - innerThickness));
          if (dInner > 1.0 || minR <= innerThickness) {
            blocks.push([x, y, z, color]);
          }
        }
      }
    }
  }
  return blocks;
}
