/* CREAM GROUP - メインスクリプト */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');

  // スクロール時のヘッダー影
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 50);
  });

  // ハンバーガーメニュー
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.classList.toggle('active');
      nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen);
      menuBtn.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    });

    // ナビリンククリックでメニューを閉じる
    nav.querySelectorAll('.header__link').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'メニューを開く');
      });
    });
  }

  // スクロールアニメーション（Intersection Observer）
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

  // data-animate 属性を持つ要素を監視
  document.querySelectorAll('[data-animate]').forEach(el => {
    animateObserver.observe(el);
  });

  // Contactリンクのアニメーション
  document.querySelectorAll('.contact__link').forEach(el => {
    animateObserver.observe(el);
  });

  // About stat のアニメーション
  document.querySelectorAll('.about__stat').forEach(el => {
    if (!el.hasAttribute('data-animate')) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    }
    animateObserver.observe(el);
  });
});
