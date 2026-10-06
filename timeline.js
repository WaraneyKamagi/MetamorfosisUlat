import { createTimeline, onScroll } from 'animejs';
import * as THREE from 'three';
import { addEggStageToTimeline } from './stages/egg.js';
import { addCaterpillarStageToTimeline } from './stages/caterpillar.js';
import { addChrysalisStageToTimeline } from './stages/chrysalis.js';
import { addButterflyStageToTimeline } from './stages/butterfly.js';

export function setupMasterTimeline(sceneInstance, stageObjects, onProgressChange) {
  // Buat Timeline utama Anime.js v4
  const timeline = createTimeline({
    autoplay: false,
    defaults: {
      ease: 'linear'
    }
  });

  const { egg, caterpillar, chrysalis, butterfly } = stageObjects;
  const context = {
    camera: sceneInstance.camera,
    cameraTarget: sceneInstance.cameraTarget,
    sceneInstance: sceneInstance
  };

  // 1. Rangkai keempat tahap metamorfosis ke dalam satu timeline terpadu
  // Tahap 1: Telur (0 - 2500 ms)
  addEggStageToTimeline(timeline, egg, context);

  // Tahap 2: Ulat (2500 - 5000 ms)
  addCaterpillarStageToTimeline(timeline, caterpillar, context);

  // Tahap 3: Kepompong (5000 - 7500 ms)
  addChrysalisStageToTimeline(timeline, chrysalis, context);

  // Tahap 4: Kupu-Kupu (7500 - 10000 ms)
  addButterflyStageToTimeline(timeline, butterfly, chrysalis, context);

  // 2. Animasi Transisi Palet Warna Latar & Cahaya (Masing-masing tahap memiliki nuansa berbeda)
  // Objek perantara warna untuk dianimasikan oleh Anime.js
  const envColorState = {
    bgR: 212, bgG: 239, bgB: 223, // #d4efdf hijau segar (tahap 1)
    lightR: 255, lightG: 250, lightB: 237,
    lightIntensity: 1.3
  };

  // Transisi ke Hijau Daun Terang (Tahap 2)
  timeline.add(envColorState, {
    bgR: 213, bgG: 245, bgB: 227,
    lightIntensity: 1.4,
    duration: 2500,
    ease: 'linear'
  }, 0);

  // Transisi ke Kuning Keemasan/Coklat Amber (Tahap 3 - Kepompong)
  timeline.add(envColorState, {
    bgR: 250, bgG: 229, bgB: 211, // #fae5d3 hangat keemasan
    lightR: 255, lightG: 224, lightB: 178,
    lightIntensity: 1.35,
    duration: 2500,
    ease: 'linear'
  }, 2500);

  // Transisi ke Langit Cerah Hangat / Golden Hour (Tahap 4 - Kupu-Kupu Terbang)
  timeline.add(envColorState, {
    bgR: 254, bgG: 235, bgB: 208, // #feebd0 cerah hangat
    lightR: 255, lightG: 243, lightB: 224,
    lightIntensity: 1.5,
    duration: 5000,
    ease: 'linear'
  }, 5000);

  // Objek warna perantara Three.js
  const tempBgColor = new THREE.Color();
  const tempLightColor = new THREE.Color();

  // 3. Fungsi sinkronisasi posisi timeline dan scroll
  const totalDuration = 10000;

  function updateAtProgress(p) {
    const clampedProgress = Math.max(0, Math.min(1, p));
    const seekTime = clampedProgress * totalDuration;

    // Geser timeline ke waktu yang sesuai
    timeline.seek(seekTime);

    // Perbarui warna latar & lampu di Three.js
    tempBgColor.setRGB(
      envColorState.bgR / 255,
      envColorState.bgG / 255,
      envColorState.bgB / 255
    );
    tempLightColor.setRGB(
      envColorState.lightR / 255,
      envColorState.lightG / 255,
      envColorState.lightB / 255
    );

    sceneInstance.updateEnvironmentColors(
      tempBgColor,
      tempLightColor,
      envColorState.lightIntensity
    );

    // Panggil callback UI untuk mengaktifkan titik progres & kartu teks
    if (onProgressChange) {
      let stageIndex = 0;
      if (clampedProgress >= 0.75) stageIndex = 3;
      else if (clampedProgress >= 0.50) stageIndex = 2;
      else if (clampedProgress >= 0.25) stageIndex = 1;
      else stageIndex = 0;

      onProgressChange(clampedProgress, stageIndex);
    }
  }

  // 4. Integrasi onScroll dengan Anime.js v4
  // Target: elemen scroll-track dengan sync: true
  const scrollTrack = document.getElementById('scroll-track') || document.body;

  try {
    const scrollObserver = onScroll({
      target: scrollTrack,
      sync: true,
      enter: 'top top',
      leave: 'bottom bottom',
      onUpdate: (self) => {
        updateAtProgress(self.progress);
      }
    });

    if (scrollObserver && scrollObserver.link) {
      scrollObserver.link(timeline);
    }
  } catch (err) {
    console.warn('Anime.js onScroll hook fallback:', err);
  }

  // Fallback pengaman listener scroll native window agar terjamin 100% mulus di semua browser
  const handleWindowScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const p = maxScroll > 0 ? (currentScroll / maxScroll) : 0;
    updateAtProgress(p);
  };

  window.addEventListener('scroll', handleWindowScroll, { passive: true });

  // Panggil sekali untuk menetapkan posisi awal (Tahap 1, progress 0)
  updateAtProgress(0);

  return {
    timeline,
    updateAtProgress,
    destroy: () => {
      window.removeEventListener('scroll', handleWindowScroll);
    }
  };
}
