import React, { useEffect, useState, useRef, useCallback } from "react";
import Globe from "react-globe.gl";
import Hls from "hls.js";
import "./GlobeView.css";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

function GlobeView() {
  const [allStations, setAllStations] = useState([]);
  const [visibleStations, setVisibleStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const [isDaytime, setIsDaytime] = useState(true);
  const globeRef = useRef();
  const audioRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsDaytime(hour >= 6 && hour < 18);
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stations`);
        const data = await res.json();

        const stationsWithCoords = data
          .filter(s => s.url && s.geo_lat !== null && s.geo_long !== null)
          .map(s => ({
            lat: parseFloat(s.geo_lat),
            lng: parseFloat(s.geo_long),
            name: s.name,
            url: s.url,
          }));

        setAllStations(stationsWithCoords);

        let index = 0;
        const batchSize = 500;
        const interval = setInterval(() => {
          setVisibleStations(prev => [
            ...prev,
            ...stationsWithCoords.slice(index, index + batchSize),
          ]);
          index += batchSize;
          if (index >= stationsWithCoords.length) clearInterval(interval);
        }, 200);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStations();
  }, []);

  useEffect(() => {
    if (!currentStation || !currentStation.url) return;
    const audio = audioRef.current;
    audio.pause();

    if (Hls.isSupported() && currentStation.url.endsWith(".m3u8")) {
      const hls = new Hls();
      hls.loadSource(currentStation.url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.play().catch(err => console.error(err));
      });
    } else {
      audio.src = currentStation.url;
      audio.play().catch(err => console.error(err));
    }
  }, [currentStation]);

  const handlePointClick = useCallback(station => {
    setCurrentStation(station);
  }, []);

  useEffect(() => {
    const resize = () => {
      if (globeRef.current) {
        globeRef.current.width(window.innerWidth);
        globeRef.current.height(window.innerHeight);
      }
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: isDaytime
          ? "radial-gradient(circle at center, #f9c3c3ff, #5a5300ff)"
          : "radial-gradient(circle at center, #0b0d17, #000000)",
      }}
    >
      {/* Logo - top left */}
      <div className="radio-logo">
        Radio&nbsp;Globe
      </div>

      {/* Now Playing Overlay */}
      {currentStation && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20, 20, 30, 0.75)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "12px 24px",
            color: "#fff",
            textAlign: "center",
            boxShadow: "0 0 10px rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
          }}
        >
          <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 500 }}>
            🎵 Now Playing:{" "}
            <span style={{ color: "#ffb347" }}>{currentStation.name}</span>
          </h3>
          <audio
            ref={audioRef}
            controls
            autoPlay
            style={{
              width: "300px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
            }}
          />
        </div>
      )}

      {/* Globe */}
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={
          isDaytime
            ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            : "//unpkg.com/three-globe/example/img/earth-dark.jpg"
        }
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={visibleStations}
        pointLat="lat"
        pointLng="lng"
        pointLabel={d => d.name}
        pointColor={() => (isDaytime ? "#ff6347" : "orange")}
        pointAltitude={0.005}
        pointRadius={0.05}
        onPointClick={handlePointClick}
      />

      <style>
        {`
          @keyframes logoShine {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </div>
  );
}

export default GlobeView;
