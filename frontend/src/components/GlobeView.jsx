import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";
import Hls from "hls.js";

function GlobeView() {
    const [stations, setStations] = useState([]);
    const [currentStation, setCurrentStation] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
    fetch("http://127.0.0.1:5000/api/country/Australia")
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(station => ({
          lat: station.geo_lat,
          lng: station.geo_long,
          name: station.name,
          url: station.url
        }));
        setStations(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
  if (currentStation && currentStation.url) {
    const video = audioRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentStation.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.error(err));
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari or browsers with native HLS support
      video.src = currentStation.url;
      video.play().catch(err => console.error(err));
    }
  }
}, [currentStation]);


  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* Audio player */}
      {currentStation && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
            <h3>Now Playing: {currentStation.name}</h3>
            <video ref={audioRef} controls autoPlay style={{ display: "block", width: "300px" }} />
        </div>
    )}

      {/* Globe */}
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        pointsData={stations}
        pointLat="lat"
        pointLng="lng"
        pointLabel={d => d.name}
        pointColor={() => "orange"}
        pointAltitude={0.02}
        onPointClick={station => {
            const proxyUrl = `http://127.0.0.1:5000/api/proxy?url=${encodeURIComponent(station.url)}`;
            setCurrentStation({ ...station, url: proxyUrl });
            if (audioRef.current) {
             audioRef.current.load();
             audioRef.current.play().catch(err => console.error(err));
          }
        }}
      />
    </div>
  );
}

export default GlobeView;
