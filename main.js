import { MetamorphosisScene } from './scene.js';
import { createEggObject } from './stages/egg.js';
import { createCaterpillarObject } from './stages/caterpillar.js';
import { createChrysalisObject } from './stages/chrysalis.js';
import { createButterflyObject } from './stages/butterfly.js';
import { setupMasterTimeline } from './timeline.js';
import { MetamorphosisUI } from './ui.js';

// Inisialisasi aplikasi saat dokumen selesai dimuat
window.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) return;

  // 1. Buat Scene Three.js (Kamera, Lampu, Renderer, Latar Diorama)
  const sceneInstance = new MetamorphosisScene(canvasContainer);

  // 2. Buat seluruh objek 3D untuk 4 tahap metamorfosis
  const egg = createEggObject();
  const caterpillar = createCaterpillarObject();
  const chrysalis = createChrysalisObject();
  const butterfly = createButterflyObject();

  // Tambahkan semua objek ke dalam Three.js Scene
  sceneInstance.scene.add(egg.group);
  sceneInstance.scene.add(caterpillar.group);
  sceneInstance.scene.add(caterpillar.biteLeafGroup);
  sceneInstance.scene.add(chrysalis.group);
  sceneInstance.scene.add(butterfly.group);

  // 3. Inisialisasi UI (Indikator titik, Kartu narasi, Layar pemuatan)
  const ui = new MetamorphosisUI();

  // 4. Hubungkan Timeline Anime.js dengan Scroll & UI
  const masterTimeline = setupMasterTimeline(
    sceneInstance,
    { egg, caterpillar, chrysalis, butterfly },
    (progress, stageIndex) => {
      ui.update(progress, stageIndex);
    }
  );

  // 5. Hilangkan layar loading setelah beberapa frame rendering selesai
  requestAnimationFrame(() => {
    setTimeout(() => {
      ui.hideLoading();
    }, 450);
  });
});
