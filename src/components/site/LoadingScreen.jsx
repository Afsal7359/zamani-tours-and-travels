'use client';
export default function LoadingScreen() {
  return (
    <div className="page-loader">
      <video autoPlay muted loop playsInline preload="auto">
        <source src="/logoloading.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
