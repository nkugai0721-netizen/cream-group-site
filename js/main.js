/* CREAM GROUP - メインスクリプト v3 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');

  // スクロール時のヘッダー影
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 50);
  }, { passive: true });

  // ハンバーガーメニュー
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.classList.toggle('active');
      nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen);
      menuBtn.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    });

    nav.querySelectorAll('.header__link').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'メニューを開く');
      });
    });
  }

  // スクロールアニメーション
  const animateObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          animateObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('[data-animate]').forEach(el => {
    animateObserver.observe(el);
  });

  document.querySelectorAll('.contact__link').forEach(el => {
    animateObserver.observe(el);
  });

  // カウントアップアニメーション
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          if (isNaN(target)) return;

          const duration = target > 100 ? 1500 : 800;
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          el.textContent = '0';
          requestAnimationFrame(animate);
          countObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('[data-count]').forEach(el => {
    countObserver.observe(el);
  });

  // ===== カルーセル（モバイル） =====
  const carousel = document.getElementById('carousel');
  const dots = document.querySelectorAll('.dot');
  const cards = document.querySelectorAll('.swipe-card');
  const hint = document.getElementById('swipeHint');

  if (carousel && cards.length > 0) {
    let hintHidden = false;

    function updateDots() {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = cards[0].offsetWidth;
      const index = Math.round(scrollLeft / cardWidth);

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });

      if (!hintHidden && scrollLeft > 30) {
        if (hint) hint.classList.add('hidden');
        hintHidden = true;
      }
    }

    carousel.addEventListener('scroll', updateDots, { passive: true });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index);
        if (cards[index]) {
          cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  }

  // ストアセクションのフェードイン
  const storesSection = document.querySelector('.stores-section');
  if (storesSection) {
    const storeObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          storeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    storeObs.observe(storesSection);
  }
});
