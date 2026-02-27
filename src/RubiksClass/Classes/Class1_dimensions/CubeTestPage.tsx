import React, { useState } from "react";
import RubiksCube from "../../Components/RubiksCube";

type HighlightType = "row" | "col" | "face" | "none";

const CubeTestPage: React.FC = () => {
    const [locked, setLocked] = useState(false);
    const [hlType, setHlType] = useState<HighlightType>("none");
    const [hlIndex, setHlIndex] = useState(0);
    const [dimInactive, setDimInactive] = useState(true);
    const [showIndices, setShowIndices] = useState(false);
    const [showCounting, setShowCounting] = useState(false);
    const [cubeSize, setCubeSize] = useState(3);

    const highlightRegion =
        hlType !== "none" ? { type: hlType as "row" | "col" | "face", index: hlIndex } : null;

    const btnStyle = (active: boolean): React.CSSProperties => ({
        padding: "0.6vw 1.5vw",
        fontSize: "1.1vw",
        borderRadius: "0.6vw",
        border: "none",
        cursor: "pointer",
        background: active ? "#e74c3c" : "#444",
        color: "#fff",
        fontFamily: "inherit",
        fontWeight: "bold",
        transition: "background 0.2s",
    });

    return (
        <div
            style={{
                minHeight: "100dvh",
                background: "#1b1b2f",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2vw",
                padding: "3vw",
                fontFamily: "'Cherry Bomb One', cursive",
                color: "#fff",
            }}
        >
            <h1 style={{ fontSize: "2.5vw", margin: 0 }}>Cube Test Page</h1>

            {/* Controls */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1vw", justifyContent: "center" }}>
                <button onClick={() => setLocked((p) => !p)} style={btnStyle(locked)}>
                    {locked ? "🔒 Locked" : "🔓 Unlocked"}
                </button>

                <select
                    value={hlType}
                    onChange={(e) => setHlType(e.target.value as HighlightType)}
                    style={{ ...btnStyle(false), background: "#2c3e50", cursor: "pointer" }}
                >
                    <option value="none">No Highlight</option>
                    <option value="row">Highlight Row</option>
                    <option value="col">Highlight Column</option>
                    <option value="face">Highlight Face</option>
                </select>

                <select
                    value={hlIndex}
                    onChange={(e) => setHlIndex(Number(e.target.value))}
                    style={{ ...btnStyle(false), background: "#2c3e50", cursor: "pointer" }}
                >
                    {Array.from({ length: cubeSize }, (_, i) => (
                        <option key={i} value={i}>
                            Index {i}
                        </option>
                    ))}
                </select>

                <button onClick={() => setDimInactive((p) => !p)} style={btnStyle(dimInactive)}>
                    {dimInactive ? "Dim: ON" : "Dim: OFF"}
                </button>

                <button onClick={() => setShowIndices((p) => !p)} style={btnStyle(showIndices)}>
                    {showIndices ? "Indices: ON" : "Indices: OFF"}
                </button>

                <button onClick={() => setShowCounting((p) => !p)} style={btnStyle(showCounting)}>
                    {showCounting ? "Counting: ON" : "Counting: OFF"}
                </button>

                <select
                    value={cubeSize}
                    onChange={(e) => setCubeSize(Number(e.target.value))}
                    style={{ ...btnStyle(false), background: "#2c3e50", cursor: "pointer" }}
                >
                    {[2, 3, 4, 5, 6, 7].map((s) => (
                        <option key={s} value={s}>
                            {s}×{s}
                        </option>
                    ))}
                </select>
            </div>

            {/* Cube */}
            <div style={{ marginTop: "2vw" }}>
                <RubiksCube
                    size={cubeSize}
                    cubeSize={28}
                    resetToFront={locked}
                    highlightRegion={highlightRegion}
                    dimInactive={dimInactive}
                    showIndices={showIndices}
                    showCounting={showCounting}
                />
            </div>
        </div>
    );
};

export default CubeTestPage;
