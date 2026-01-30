window.addEventListener('load', () => {
  // Create full-screen canvas dynamically
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0'; // behind card
  document.body.appendChild(canvas);

  const myConfetti = confetti.create(canvas, {
    resize: true,
    useWorker: true,
    zIndex: 0
  });

  const shootFountain = () => {
    // Shoot multiple particles across bottom width
    for (let i = 0; i < 10; i++) {
      myConfetti({
        particleCount: 10,
        startVelocity: Math.random() * 50 + 40, // random speed
        spread: 80, // angle spread
        ticks: 300,
        gravity: 0.8,
        origin: { x: Math.random(), y: 1 }, // random x along bottom
        colors: ['#FBBF24','#3B82F6','#22C55E','#EC4899','#8B5CF6']
      });
    }
  };

  // Repeat for 3 seconds
  const duration = 1000;
  const interval = 200;
  const endTime = Date.now() + duration;

  const fountainInterval = setInterval(() => {
    if (Date.now() > endTime) {
      clearInterval(fountainInterval);
      return;
    }
    shootFountain();
  }, interval);
});
