/* CREAM GROUP - メインスクリプト v4 */

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
      // メニューオープン時はbodyスクロールを防ぐ
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('.header__link').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'メニューを開く');
        document.body.style.overflow = '';
      });
    });
  }

  // スクロールアニメーション（data-animate属性）
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

  // リゾートセクションのスクロールフェードイン
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.resort-section').forEach(el => {
    sectionObserver.observe(el);
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

  // ===== カルーセル =====
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
          entry.target.classList.add('visible');
          storeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    storeObs.observe(storesSection);
  }

  // ヒーローパララックス効果（軽量）
  const heroBg = document.querySelector('.hero-stores-bg');
  if (heroBg) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < window.innerHeight * 2) {
            heroBg.style.transform = `translateY(${scrollY * 0.15}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 問い合わせフォーム送信
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('contactSubmit');
      const status = document.getElementById('contactStatus');
      const formData = new FormData(contactForm);

      // honeypotチェック: ボットが入力した場合は静かに無視
      const honeypot = contactForm.querySelector('[name="website"]');
      if (honeypot && honeypot.value) {
        status.textContent = '送信が完了しました。折り返しご連絡いたします。';
        status.classList.add('success');
        contactForm.reset();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';
      status.textContent = '';
      status.className = 'contact-form__status';

      try {
        const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwciyIpY9oQ_htk7ZC-MYciY2xqN9HlGhurcShrlcszprSi0URHLyAy4FfgA4uwUCz9/exec';
        const res = await fetch(GAS_ENDPOINT, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          status.textContent = '送信が完了しました。折り返しご連絡いたします。';
          status.classList.add('success');
          contactForm.reset();
        } else {
          throw new Error('送信に失敗しました');
        }
      } catch (err) {
        status.textContent = '送信に失敗しました。お手数ですがメールでご連絡ください。';
        status.classList.add('error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
      }
    });
  }
});
