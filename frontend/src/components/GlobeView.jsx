import React, { useEffect, useState, useRef, useCallback } from "react";
import Globe from "react-globe.gl";
import Hls from "hls.js";

function GlobeView() {
  const [allStations, setAllStations] = useState([]);
  const [visibleStations, setVisibleStations] = useState([]);
  const [currentStation, setCurrentStation] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/stations");
        const data = await res.json();
        const stationsWithCoords = data.filter(
          s => s.url && s.geo_lat !== null && s.geo_long !== null
        );

        const stationsMapped = stationsWithCoords.map(s => ({
          lat: parseFloat(s.geo_lat),
          lng: parseFloat(s.geo_long),
          name: s.name,
          url: s.url
        }));

        setAllStations(stationsMapped);

        let index = 0;
        const batchSize = 500;
        const interval = setInterval(() => {
          setVisibleStations(prev => [
            ...prev,
            ...stationsMapped.slice(index, index + batchSize)
          ]);
          index += batchSize;
          if (index >= stationsMapped.length) clearInterval(interval);
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

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {currentStation && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
          <h3>Now Playing: {currentStation.name}</h3>
          <audio ref={audioRef} controls autoPlay style={{ width: "300px" }} />
        </div>
      )}

      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        pointsData={visibleStations}
        pointLat="lat"
        pointLng="lng"
        pointLabel={d => d.name}
        pointColor={() => "orange"}
        pointAltitude={0.005}
        pointRadius={0.10}
        onPointClick={handlePointClick}
      />
    </div>
  );
}

export default GlobeView;
