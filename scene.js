import * as THREE from 'three';
import { createVoxelMesh, sharedBoxGeometry } from './voxel.js';

export class MetamorphosisScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // 1. Setup Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#d4efdf'); // Warna awal segar (daun/telur)

    // 2. Setup Kamera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 3.5, 7.5);
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);
    this.updateCameraResponsiveness();
    this.camera.lookAt(this.cameraTarget);

    // 3. Setup Renderer (Performa Ringan)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 4. Pencahayaan: Maksimal 1 Directional Light + 1 Ambient Light (Sesuai Aturan)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    this.dirLight.position.set(6, 12, 8);
    this.scene.add(this.dirLight);

    // Objek lingkungan diorama
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.environmentGroup);

    // Polin/partikel melayang
    this.pollenMesh = null;
    this.pollenCount = 35;
    this.pollenData = [];

    // Variabel loop & render
    this.isRunning = true;
    this.startTime = performance.now();
    this.pausedTime = 0;

    // Inisialisasi lingkungan
    this.buildDioramaEnvironment();
    this.buildFloatingPollen();

    // Event listener resize & visibility
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Mulai animasi loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /**
   * Membuat latar diorama berupa daun raksasa berlekuk, ranting kayu, dan dekorasi tanaman kubus
   */
  buildDioramaEnvironment() {
    const leafVoxels = [];
    const leafColorMain = '#43a047';
    const leafColorAlt = '#4caf50';
    const leafColorVein = '#2e7d32';
    const leafColorEdge = '#81c784';

    // Buat daun lebar melengkung di tanah sebagai panggung (Grid x: -14 sampai 14, z: -10 sampai 10)
    for (let x = -13; x <= 13; x++) {
      for (let z = -9; z <= 9; z++) {
        // Bentuk elips daun
        const distNorm = (x * x) / (14 * 14) + (z * z) / (10 * 10);
        if (distNorm <= 1.0) {
          // Lengkungan daun: sisi pinggir sedikit melengkung ke atas
          const curveY = (x * x * 0.012) + (z * z * 0.015) * 0.5;
          const y = Math.round(curveY);

          let col = leafColorMain;
          // Tulang daun di sepanjang sumbu z (x dekat 0)
          if (Math.abs(x) <= 1) {
            col = leafColorVein;
          } else if ((x + z * 2) % 6 === 0) {
            col = leafColorVein; // Garis vena daun menyamping
          } else if (distNorm > 0.85) {
            col = leafColorEdge;
          } else if ((x + z) % 2 === 0) {
            col = leafColorAlt;
          }

          leafVoxels.push([x, y - 2, z, col]);
        }
      }
    }

    const leafMesh = createVoxelMesh(leafVoxels, { scale: 0.22, gap: 0.98 });
    this.environmentGroup.add(leafMesh);

    // Buat ranting pohon tempat kepompong akan menggantung (bercabang ke atas di sebelah kiri/belakang)
    const branchVoxels = [];
    const barkColor1 = '#5d4037';
    const barkColor2 = '#6d4c41';
    const barkColor3 = '#4e342e';

    // Batang utama menjulang dari daun ke atas
    for (let by = -2; by <= 14; by++) {
      const bx = -5 + Math.sin(by * 0.2) * 1.5;
      const bz = -2 + Math.cos(by * 0.2) * 0.5;
      const col = (by % 2 === 0) ? barkColor1 : barkColor2;
      branchVoxels.push([Math.round(bx), by, Math.round(bz), col]);
      branchVoxels.push([Math.round(bx) + 1, by, Math.round(bz), barkColor3]);
      branchVoxels.push([Math.round(bx), by, Math.round(bz) + 1, col]);
    }

    // Cabang horizontal menjulur ke tengah (posisi kepompong menggantung di titik y ~ 11, x ~ 0, z ~ 0)
    for (let cx = -5; cx <= 2; cx++) {
      const cy = 13 - Math.abs(cx) * 0.2;
      const cz = 0;
      const col = (cx % 2 === 0) ? barkColor1 : barkColor2;
      branchVoxels.push([cx, Math.round(cy), cz, col]);
      branchVoxels.push([cx, Math.round(cy), cz - 1, barkColor3]);
    }

    // Pucuk daun kecil di ujung ranting
    branchVoxels.push([2, 14, 0, '#66bb6a']);
    branchVoxels.push([3, 14, 0, '#81c784']);
    branchVoxels.push([2, 14, 1, '#4caf50']);

    const branchMesh = createVoxelMesh(branchVoxels, { scale: 0.22, gap: 0.98 });
    this.environmentGroup.add(branchMesh);

    // Dekorasi bunga mungil voxel di sudut daun
    const flowerVoxels = [
      // Tangkai
      [8, -1, 5, '#2e7d32'],
      [8, 0, 5, '#2e7d32'],
      [8, 1, 5, '#2e7d32'],
      // Kelopak & Inti
      [8, 2, 5, '#ffca28'], // Inti sari kuning
      [7, 2, 5, '#ffffff'], // Kelopak putih
      [9, 2, 5, '#ffffff'],
      [8, 2, 4, '#ffffff'],
      [8, 2, 6, '#ffffff'],
      [8, 3, 5, '#fff9c4']
    ];
    const flowerMesh = createVoxelMesh(flowerVoxels, { scale: 0.18 });
    this.environmentGroup.add(flowerMesh);

    // Bayangan palsu lembut (fake blob shadow) di permukaan daun
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1b3b1f,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    this.blobShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.blobShadow.rotation.x = -Math.PI / 2;
    this.blobShadow.position.set(0, -0.38, 0.4);
    this.environmentGroup.add(this.blobShadow);
  }

  /**
   * Serbuk sari melayang bergaya voxel untuk atmosfer magis diorama
   */
  buildFloatingPollen() {
    const pollenMat = new THREE.MeshBasicMaterial({
      color: 0xfff9c4,
      transparent: true,
      opacity: 0.75
    });

    this.pollenMesh = new THREE.InstancedMesh(sharedBoxGeometry, pollenMat, this.pollenCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.pollenCount; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = 0.5 + Math.random() * 4;
      const z = (Math.random() - 0.5) * 6;
      const speed = 0.4 + Math.random() * 0.6;
      const pScale = 0.04 + Math.random() * 0.04;

      this.pollenData.push({ x, y, z, originY: y, speed, scale: pScale, seed: Math.random() * Math.PI * 2 });

      dummy.position.set(x, y, z);
      dummy.scale.set(pScale, pScale, pScale);
      dummy.updateMatrix();
      this.pollenMesh.setMatrixAt(i, dummy.matrix);
    }
    this.pollenMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.pollenMesh);
  }

  /**
   * Update partikel serbuk sari secara efisien tanpa realokasi memori
   */
  updatePollen(elapsedTime) {
    if (!this.pollenMesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.pollenCount; i++) {
      const p = this.pollenData[i];
      const y = p.originY + Math.sin(elapsedTime * p.speed + p.seed) * 0.3;
      const x = p.x + Math.cos(elapsedTime * 0.4 + p.seed) * 0.15;
      const z = p.z + Math.sin(elapsedTime * 0.3 + p.seed) * 0.15;

      dummy.position.set(x, y, z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      this.pollenMesh.setMatrixAt(i, dummy.matrix);
    }
    this.pollenMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Mengubah warna latar dan pencahayaan secara halus mengikuti scroll/tahap
   */
  updateEnvironmentColors(bgColor, lightColor, lightIntensity, ambientIntensity) {
    if (bgColor) this.scene.background.set(bgColor);
    if (lightColor) this.dirLight.color.set(lightColor);
    if (lightIntensity !== undefined) this.dirLight.intensity = lightIntensity;
    if (ambientIntensity !== undefined) this.ambientLight.intensity = ambientIntensity;
  }

  /**
   * Loop rendering utama
   */
  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const elapsed = (performance.now() - this.startTime) * 0.001;
    this.updatePollen(elapsed);

    // Pastikan kamera selalu memandang target yang ditentukan timeline
    this.camera.lookAt(this.cameraTarget);

    this.renderer.render(this.scene, this.camera);
  }

  updateCameraResponsiveness() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    this.camera.aspect = aspect;

    if (aspect < 1.0) {
      // Layar ponsel/tablet potret: lebarkan FOV secara proporsional agar diorama tidak terpotong ke samping
      this.camera.fov = Math.min(68, 45 + (1.0 - aspect) * 28);
    } else {
      this.camera.fov = 45;
    }
    this.camera.updateProjectionMatrix();
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.updateCameraResponsiveness();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.isRunning = false;
      this.pauseStart = performance.now();
    } else {
      if (this.pauseStart) {
        this.startTime += (performance.now() - this.pauseStart);
      }
      this.isRunning = true;
      requestAnimationFrame(this.animate);
    }
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.renderer.dispose();
  }
}
