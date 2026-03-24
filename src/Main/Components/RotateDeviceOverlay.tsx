import "./RotateDeviceOverlay.css";

function RotateDeviceOverlay() {
  return (
    <div className="rotate-overlay">
      <div className="rotate-content">
        <div className="rotate-icon-container">
          <div className="rotate-device"></div>
        </div>
        <h2>Gire sua tela</h2>
        <p>Para a melhor experiência, por favor, jogue com o dispositivo na horizontal!</p>
      </div>
    </div>
  );
}

export default RotateDeviceOverlay;
