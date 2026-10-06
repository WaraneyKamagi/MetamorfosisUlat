/**
 * Modul antarmuka pengguna (UI): indikator 4 titik, kartu teks narasi per tahap, dan layar pemuatan
 */

export class MetamorphosisUI {
  constructor() {
    this.dots = Array.from(document.querySelectorAll('.stage-dot'));
    this.stageCards = Array.from(document.querySelectorAll('.stage-card'));
    this.progressBar = document.getElementById('progress-bar-fill');
    this.scrollHint = document.getElementById('scroll-hint');
    this.loadingScreen = document.getElementById('loading-screen');
    this.currentStage = -1;

    this.setupDotClicks();
    this.checkReducedMotion();
  }

  /**
   * Menambahkan navigasi klik pada indikator titik untuk berpindah tahap secara mulus
   */
  setupDotClicks() {
    const stageTargets = [0.0, 0.32, 0.58, 0.88]; // Posisi scroll representatif tiap tahap (0: Telur, 1: Ulat, 2: Kepompong, 3: Kupu-kupu)

    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = stageTargets[index] * maxScroll;
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      });
    });
  }

  /**
   * Memeriksa preferensi aksesibilitas pengguna (prefers-reduced-motion)
   */
  checkReducedMotion() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      document.body.classList.add('reduced-motion');
      const badge = document.getElementById('motion-badge');
      if (badge) badge.style.display = 'block';
    }
  }

  /**
   * Memperbarui status UI berdasarkan posisi scroll dan tahap aktif (0 - 3)
   */
  update(progress, stageIndex) {
    // 1. Perbarui garis progress bar
    if (this.progressBar) {
      this.progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // 2. Sembunyikan petunjuk gulir jika sudah mulai menggulir
    if (this.scrollHint) {
      if (progress > 0.03) {
        this.scrollHint.classList.add('hidden');
      } else {
        this.scrollHint.classList.remove('hidden');
      }
    }

    // 3. Perbarui titik indikator & kartu narasi jika tahap berubah
    if (stageIndex !== this.currentStage) {
      this.currentStage = stageIndex;

      // Update titik aktif
      this.dots.forEach((dot, idx) => {
        if (idx === stageIndex) {
          dot.classList.add('active');
          dot.setAttribute('aria-current', 'step');
        } else {
          dot.classList.remove('active');
          dot.removeAttribute('aria-current');
        }
      });

      // Update kartu teks aktif dengan transisi fade & slide
      this.stageCards.forEach((card, idx) => {
        if (idx === stageIndex) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }
  }

  /**
   * Menghilangkan layar loading setelah scene 3D siap
   */
  hideLoading() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('loaded');
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 600);
    }
  }
}
