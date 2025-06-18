// src/services/mapService.ts

// Helper function to wait for the Google Maps API to be loaded
export const waitForMapsApiToLoad = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).googleMapsApiLoaded && window.google && window.google.maps) {
      console.log("[MapService] Google Maps API already loaded.");
      resolve();
      return;
    }

    const TIMEOUT_DURATION = 10000; 
    let timeoutId = setTimeout(() => {
      window.removeEventListener('google-maps-api-loaded', listener);
      console.error(`[MapService] Timeout: Google Maps API did not load within ${TIMEOUT_DURATION / 1000} seconds.`);
      reject(new Error("Timeout waiting for Google Maps API to load. Check network, API key, and console for errors from Google."));
    }, TIMEOUT_DURATION);

    const listener = () => {
      clearTimeout(timeoutId); 
      if (window.google && window.google.maps) {
        console.log("[MapService] Google Maps API loaded successfully via event listener.");
        resolve();
      } else {
        console.error("[MapService] Google Maps API event fired, but 'window.google.maps' object not found. This may indicate an API key issue or script loading problem.");
        reject(new Error("Google Maps API loaded but not initialized correctly. Check API key and console for errors from Google."));
      }
    };

    console.log("[MapService] Waiting for Google Maps API to load...");
    window.addEventListener('google-maps-api-loaded', listener, { once: true });
  });
};


export const initMap = async (mapDiv: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map | null> => {
  try {
    await waitForMapsApiToLoad();
    return new window.google.maps.Map(mapDiv, options);
  } catch (error) {
    console.error("[MapService] Error initializing map:", error);
    throw error; 
  }
};

export const addMarker = (map: google.maps.Map, position: google.maps.LatLngLiteral, title?: string): google.maps.marker.AdvancedMarkerElement | null => {
  if (!window.google?.maps?.marker) {
    console.error("[MapService] Google Maps Marker library (google.maps.marker) not loaded. Ensure 'marker' library is included in API script.");
    return null;
  }
  return new window.google.maps.marker.AdvancedMarkerElement({
    map,
    position,
    title,
  });
};

export const getDirections = async (
  request: google.maps.DirectionsRequest
): Promise<google.maps.DirectionsResult> => { 
  await waitForMapsApiToLoad();
  const directionsService = new window.google.maps.DirectionsService();
  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        resolve(result);
      } else {
        console.error(`[MapService] Directions request failed. Status: ${status}, Result:`, result);
        reject(new Error(`Directions request failed due to ${status}`));
      }
    });
  });
};

export const geocodeAddress = async (address: string): Promise<google.maps.GeocoderResult[]> => { 
  await waitForMapsApiToLoad();
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results) {
              resolve(results);
          } else {
              console.error(`[MapService] Geocode was not successful for address "${address}". Status: ${status}`);
              reject(new Error(`Geocode failed for address "${address}": ${status}`));
          }
      });
  });
};
