export default function CanvasImage({ src, width, height, className = '' }) {
  return (
    <canvas
      className={className}
      width={width}
      height={height}
      style={{ backgroundImage: `url('${src}')` }}
      aria-hidden="true"
    ></canvas>
  );
}
