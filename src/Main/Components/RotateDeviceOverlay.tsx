import "./RotateDeviceOverlay.css";
import { useState } from "react";

const ROTATE_OVERLAY_BYPASS_KEY = "rotateOverlayBypassed";

function RotateDeviceOverlay() {
  const [isBypassed, setIsBypassed] = useState(
    () => sessionStorage.getItem(ROTATE_OVERLAY_BYPASS_KEY) === "true"
  );

  const handleBypass = () => {
    sessionStorage.setItem(ROTATE_OVERLAY_BYPASS_KEY, "true");
    setIsBypassed(true);
  };

  if (isBypassed) {
    return null;
  }

  return (
    <div className="rotate-overlay">
      <div className="rotate-content">
        <div className="rotate-icon-container">
          <div className="rotate-device"></div>
        </div>
        <h2>Gire sua tela</h2>
        <p>Para a melhor experiência, por favor, jogue com o dispositivo na horizontal!</p>
        <button
          className="rotate-bypass-button"
          onClick={handleBypass}
          type="button"
        >
          Continuar mesmo assim
        </button>
      </div>
    </div>
  );
}

export default RotateDeviceOverlay;
