// src/components/map/MapDisplay.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { initMap, waitForMapsApiToLoad } from '../../services/mapService.js';
import { MapDisplayProps, MapMarkerData, GeoLocation } from '../../types.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';

const getMarkerIconContent = (type: MapMarkerData['type'], isDarkMode: boolean, title?: string): HTMLElement => {
  let bgColor = isDarkMode ? '#555' : '#AAA'; // Default gray
  let textColor = isDarkMode ? '#FFF' : '#000';
  let initial = '?';
  let width = 32, height = 32, fontSize = 16; 

  switch(type) {
    case 'origin':
      bgColor = isDarkMode ? 'rgba(34, 139, 34, 0.9)' : 'rgba(46, 204, 113, 0.9)'; // ForestGreen / Emerald
      textColor = '#FFF';
      initial = 'O';
      width = 36; height = 36; fontSize = 18;
      break;
    case 'destination':
      bgColor = isDarkMode ? 'rgba(220, 20, 60, 0.9)' : 'rgba(255, 99, 71, 0.9)'; // Crimson / Tomato
      textColor = '#FFF';
      initial = 'D';
      width = 36; height = 36; fontSize = 18;
      break;
    case 'journey_stop': 
      bgColor = isDarkMode ? 'rgba(75, 122, 199, 0.9)' : 'rgba(100, 149, 237, 0.9)'; // CornflowerBlue
      textColor = '#FFF';
      // Extract stop number if present in title like "Stop 1: Address" or "S1: Address"
      const titleMatch = title?.match(/^(Stop\s*|S)(\d+)/i);
      initial = titleMatch ? `S${titleMatch[2]}` : 'S';
      break;
    case 'recipient':
      bgColor = isDarkMode ? 'rgba(255, 105, 180, 0.9)' : 'rgba(255, 182, 193, 0.9)'; // HotPink / LightPink
      textColor = '#000';
      initial = 'R';
      break;
    case 'provider':
      bgColor = isDarkMode ? 'rgba(255, 165, 0, 0.9)' : 'rgba(255, 215, 0, 0.9)'; // Orange / Gold
      textColor = '#000';
      initial = 'P';
      break;
    case 'product':
      bgColor = isDarkMode ? 'rgba(128, 0, 128, 0.9)' : 'rgba(186, 85, 211, 0.9)'; // Purple / MediumOrchid
      textColor = '#FFF';
      initial = '$';
      break;
    case 'current_provider_location':
      bgColor = isDarkMode ? 'rgba(0, 191, 255, 0.9)' : 'rgba(30, 144, 255, 0.9)'; // DeepSkyBlue / DodgerBlue
      textColor = '#FFF';
      initial = '>'; // Arrow-like
      break;
    case 'service_area': 
    case 'generic':
    default:
      bgColor = isDarkMode ? 'rgba(100, 100, 100, 0.7)' : 'rgba(150, 150, 150, 0.7)';
      textColor = isDarkMode ? '#DDD' : '#333';
      initial = title ? title.substring(0,1).toUpperCase() : '?';
      width = 28; height = 28; fontSize = 14;
  }

  const iconElement = document.createElement('div');
  iconElement.style.width = `${width}px`;
  iconElement.style.height = `${height}px`;
  iconElement.style.backgroundColor = bgColor;
  iconElement.style.borderRadius = '50%';
  iconElement.style.display = 'flex';
  iconElement.style.alignItems = 'center';
  iconElement.style.justifyContent = 'center';
  iconElement.style.color = textColor;
  iconElement.style.fontSize = `${fontSize}px`;
  iconElement.style.fontWeight = 'bold';
  iconElement.style.border = `1px solid ${isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`;
  iconElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  iconElement.textContent = initial;
  return iconElement;
};


const MapDisplay: React.FC<MapDisplayProps> = ({ 
    center, 
    zoom, 
    className = 'w-full h-96', 
    markers: newMarkersProp = [],
    onMapClick,
    onMarkerClick,
    route, 
    journeyPath 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGMapMarkers, setCurrentGMapMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [currentRoutePolyline, setCurrentRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [currentJourneyPolyline, setCurrentJourneyPolyline] = useState<google.maps.Polyline | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const markerClickListenersRef = useRef<google.maps.MapsEventListener[]>([]); 


  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      setIsLoading(true); 
      try {
        await waitForMapsApiToLoad(); 
        if (!window.google || !window.google.maps || !window.google.maps.Map) {
            if (isMounted) setError("Google Maps 'Map' constructor not found after API load.");
            setIsLoading(false);
            return;
        }
        if (mapRef.current && isMounted) {
          const mapOptions: google.maps.MapOptions = {
            center,
            zoom,
            mapId: isDarkMode ? "GOTODO_AI_MAP_ID_DARK" : "GOTODO_AI_MAP_ID_SIMPLE",
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false, 
          };
          const map = await initMap(mapRef.current, mapOptions);
          if (map && isMounted) {
            setMapInstance(map);
            setError(null); 
          } else if (isMounted) {
            setError("Failed to initialize map instance.");
          }
        }
      } catch (e) {
        console.error("Map initialization error:", e);
        if (isMounted) {
            setError((e as Error).message || "Could not load the map.");
        }
      } finally {
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    initialize();
    
    return () => {
      isMounted = false;
      if (mapInstance && window.google && window.google.maps && window.google.maps.event) { 
        markerClickListenersRef.current.forEach(listener => window.google.maps.event.removeListener(listener));
        markerClickListenersRef.current = [];
        currentGMapMarkers.forEach(m => m.map = null);
        currentRoutePolyline?.setMap(null);
        currentJourneyPolyline?.setMap(null);
      }
      setCurrentGMapMarkers([]);
      setCurrentRoutePolyline(null);
      setCurrentJourneyPolyline(null);
    };
  }, [isDarkMode]); // Dependency on isDarkMode to re-initialize map with correct mapId

  useEffect(() => {
    if (mapInstance) {
      mapInstance.setCenter(center);
      mapInstance.setZoom(zoom);
    }
  }, [center, zoom, mapInstance]);

  useEffect(() => {
    if (mapInstance && window.google?.maps?.event && window.google.maps.marker?.AdvancedMarkerElement) { 
      markerClickListenersRef.current.forEach(listener => window.google.maps.event.removeListener(listener));
      markerClickListenersRef.current = [];
      currentGMapMarkers.forEach(m => m.map = null);
      const newGMapMarkerInstances: google.maps.marker.AdvancedMarkerElement[] = [];
      
      if (newMarkersProp && newMarkersProp.length > 0) {
        newMarkersProp.forEach(markerData => {
          if (markerData && typeof markerData.position.lat === 'number' && typeof markerData.position.lng === 'number') {
            const markerContent = getMarkerIconContent(markerData.type, isDarkMode, markerData.title);
            const gMapMarker = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapInstance,
              position: markerData.position,
              title: markerData.title,
              content: markerContent,
              zIndex: markerData.type === 'origin' || markerData.type === 'destination' ? 100 : (markerData.type === 'journey_stop' ? 90 : 10) 
            });

            if (gMapMarker && onMarkerClick) {
              const listener = gMapMarker.addListener('click', () => {
                onMarkerClick(markerData);
              });
              markerClickListenersRef.current.push(listener);
              newGMapMarkerInstances.push(gMapMarker);
            } else if (gMapMarker) {
                 newGMapMarkerInstances.push(gMapMarker);
            }
          } else {
            console.warn("Invalid marker position provided:", markerData);
          }
        });
      }
      setCurrentGMapMarkers(newGMapMarkerInstances);
    }
  }, [newMarkersProp, mapInstance, isDarkMode, onMarkerClick]);

   useEffect(() => {
    if (mapInstance && onMapClick && window.google?.maps?.event) {
        const listener = mapInstance.addListener('click', (e: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
            let target = e.domEvent?.target as HTMLElement | null;
            let isMarkerContentClick = false;
            
            while (target && target !== mapInstance.getDiv()) {
                if (currentGMapMarkers.some(m => m.content === target || (m.content as HTMLElement)?.contains(target))) {
                   isMarkerContentClick = true;
                   break;
                }
                target = target.parentElement;
            }

            if (!isMarkerContentClick && e.latLng) {
                onMapClick(e.latLng.toJSON());
            }
        });
        return () => { if (window.google?.maps?.event) window.google.maps.event.removeListener(listener); };
    }
  }, [mapInstance, onMapClick, currentGMapMarkers]); 

  // Handle single A-B route
  useEffect(() => {
    currentRoutePolyline?.setMap(null); 
    if (mapInstance && route?.origin && route?.destination && window.google?.maps?.DirectionsService && window.google?.maps?.Polyline && !journeyPath?.length) { 
      const directionsService = new window.google.maps.DirectionsService();
      const newPolyline = new window.google.maps.Polyline({
        strokeColor: isDarkMode ? '#60a5fa' : '#2563eb', 
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: mapInstance,
      });
      
      directionsService.route({
        origin: route.origin,
        destination: route.destination,
        travelMode: window.google.maps.TravelMode.DRIVING 
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          newPolyline.setPath(result.routes[0].overview_path);
          setCurrentRoutePolyline(newPolyline);
        } else {
          console.error(`Directions request failed due to ${status}`);
          newPolyline.setMap(null); 
        }
      });
      return () => newPolyline.setMap(null);
    }
  }, [route, mapInstance, isDarkMode, journeyPath]); 

  // Handle journey path polyline
  useEffect(() => {
    currentJourneyPolyline?.setMap(null); 
    if (mapInstance && journeyPath && journeyPath.length >= 2 && window.google?.maps?.Polyline && window.google?.maps?.SymbolPath) {
      const path = journeyPath.map(p => ({ lat: p.lat, lng: p.lng }));
      const newPolyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: isDarkMode ? '#f472b6' : '#ec4899', // Pinkish
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: mapInstance,
        icons: [{
            icon: { 
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: isDarkMode ? '#f472b6' : '#ec4899',
            },
            offset: '100%',
            repeat: '50px' // Arrows more frequent
        }]
      });
      setCurrentJourneyPolyline(newPolyline);
      return () => newPolyline.setMap(null);
    }
  }, [journeyPath, mapInstance, isDarkMode]);


  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700`}>
        <LoadingSpinner text="Loading map..." />
      </div>
    );
  }

  if (error) {
    return <div className={`${className} flex items-center justify-center bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 p-4`}>{error}</div>;
  }

  return <div ref={mapRef} className={className} style={{ minHeight: '300px' }} />;
};

export default MapDisplay;