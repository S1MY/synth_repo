// ======================
// НАСТРОЙКИ
// ======================
const TOTAL_FRAMES = 499;
let currentFrame = 0;

// ======================
// ИНИЦИАЛИЗАЦИЯ GSAP
// ======================
gsap.registerPlugin(ScrollTrigger);

// Создаем индикатор прогресса
const progressBar = document.createElement('div');
progressBar.className = 'progress-bar';
document.body.appendChild(progressBar);

// Создаем панель дебага
const debugInfo = document.createElement('div');
debugInfo.className = 'debug-info';
debugInfo.innerHTML = `
    <div>Прогресс: <span id="debug-progress">0%</span></div>
    <div>Кадр: <span id="debug-frame">1</span></div>
`;
document.body.appendChild(debugInfo);

// ======================
// 1. ПРЕДЗАГРУЗКА КАДРОВ
// ======================
function preloadFrames() {
    console.log('Начинаем предзагрузку кадров...');
    
    // Загружаем первые 50 кадров для мгновенного отображения
    for (let i = 1; i <= 50; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
    }
}

// ======================
// 2. ОСНОВНАЯ АНИМАЦИЯ
// ======================
function initAnimation() {
    const stickySection = document.querySelector('.sticky-section');
    const stickyContainer = document.querySelector('.sticky-container');
    
    // ======================
    // АНИМАЦИЯ СЛОЕВ
    // ======================
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: stickySection,
            start: "top top",     // Когда верх stickySection достигнет верха viewport
            end: "bottom bottom", // Когда низ stickySection достигнет низа viewport
            scrub: 1,            // Привязка анимации к скроллу
            pin: stickyContainer, // Фиксируем контейнер
            anticipatePin: 1,
            markers: false,       // ВКЛЮЧИТЕ ДЛЯ ВИЗУАЛИЗАЦИИ!
            onUpdate: updateAnimation,
            onEnter: () => console.log("✴️ Вошли в sticky-зону"),
            onLeave: () => console.log("⬇️ Вышли из sticky-зоны"),
            onEnterBack: () => console.log("⬆️ Вернулись в sticky-зону"),
        }
    });
    
    // Анимация слоя 1 (движение вправо)
    tl.to('.box1', {
        x: 400,
        rotation: 360,
        duration: 2
    }, 0);
    
    // Анимация слоя 2 (движение влево и увеличение)
    tl.to('.box2', {
        x: -400,
        scale: 1.5,
        duration: 2
    }, 0);
    
    // Анимация слоя 3 (движение вверх)
    tl.to('.box3', {
        y: -300,
        duration: 2
    }, 0);
    
    // ======================
    // ТЕКСТОВЫЕ ШАГИ
    // ======================
    const textSteps = document.querySelectorAll('.text-step');
    
    // Шаг 1 появляется на 0.2 прогресса
    tl.to('.step1', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.2);
    
    // Шаг 2 появляется на 0.4 прогресса
    tl.to('.step2', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.4);
    
    // Шаг 1 исчезает на 0.5 прогресса
    tl.to('.step1', {
        opacity: 0,
        y: -50,
        duration: 0.3
    }, 0.5);
    
    // Шаг 3 появляется на 0.6 прогресса
    tl.to('.step3', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.6);
    
    // Шаг 2 исчезает на 0.7 прогресса
    tl.to('.step2', {
        opacity: 0,
        y: -50,
        duration: 0.3
    }, 0.7);
    
    // Шаг 4 появляется на 0.8 прогресса
    tl.to('.step4', {
        opacity: 1,
        y: 0,
        duration: 0.3
    }, 0.8);
    
    // Шаг 3 исчезает на 0.9 прогресса
    tl.to('.step3', {
        opacity: 0,
        y: -50,
        duration: 0.3
    }, 0.9);
    
    console.log('Анимация инициализирована!');
}

// ======================
// 3. ОБНОВЛЕНИЕ АНИМАЦИИ ПРИ СКРОЛЛЕ
// ======================
function updateAnimation(self) {
    // Обновляем прогресс бар
    const progress = self.progress;
    progressBar.style.width = `${progress * 100}%`;
    
    // Обновляем кадр анимации (1-500)
    const frame = Math.max(1, Math.floor(progress * TOTAL_FRAMES));
    updateFrame(frame);
    
    // Обновляем дебаг информацию
    document.getElementById('debug-progress').textContent = 
        `${(progress * 100).toFixed(1)}%`;
    document.getElementById('debug-frame').textContent = frame;
}

// ======================
// 4. ОБНОВЛЕНИЕ КАДРА
// ======================
function updateFrame(frameNum) {
    if (frameNum === currentFrame) return;
    
    currentFrame = frameNum;
    
    // Обновляем номер кадра
    document.getElementById('frame-num').textContent = frameNum;
    
    const frameImg = document.getElementById('frame-img');
    frameImg.src = getFrameUrl(frameNum);
    
}

// ======================
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================
function getFrameUrl(frameNumber) {
    const paddedNumber = frameNumber.toString().padStart(5, '0');
    return `assets/frames/syntx+_${paddedNumber}.png`;
}

function replay() {
    // Прокручиваем к началу sticky секции
    document.querySelector('.sticky-section').scrollIntoView({
        behavior: 'smooth'
    });
    
    // Сбрасываем кадр
    setTimeout(() => {
        updateFrame(1);
    }, 500);
    
    // Анимация кнопки
    gsap.fromTo('.outro button',
        { scale: 0.9 },
        { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
    );
}

// ======================
// 6. ЗАПУСК ВСЕГО ПРИ ЗАГРУЗКЕ
// ======================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Документ загружен!');
    
    // Предзагружаем кадры
    preloadFrames();
    
    // Инициализируем анимацию
    initAnimation();
    
    // Добавляем обработчик для кнопки воспроизведения
    document.querySelector('.outro button').addEventListener('click', replay);
});

// ======================
// 7. ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ (в консоли)
// ======================
window.showFrame = function(frame) {
    if (frame >= 1 && frame <= TOTAL_FRAMES) {
        updateFrame(frame);
        console.log(`Показан кадр ${frame}`);
    }
};

window.jumpToProgress = function(percent) {
    const stickySection = document.querySelector('.sticky-section');
    const scrollY = stickySection.offsetTop + (stickySection.offsetHeight * percent / 100);
    window.scrollTo({ top: scrollY, behavior: 'smooth' });
};

console.log(`
=====================================
🛠️ КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ В КОНСОЛИ:
=====================================
showFrame(250) - показать кадр 250
jumpToProgress(50) - перейти к 50% прогресса
ScrollTrigger.getAll()[0].progress - текущий прогресс
=====================================
`);