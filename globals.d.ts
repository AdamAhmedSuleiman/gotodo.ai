// src/globals.d.ts

declare global {
  interface Window {
    google?: typeof google;
    googleMapsApiLoaded?: boolean;

    process?: {
      env: {
        API_KEY?: string;
        SPEECH_API_KEY?: string;
        TTS_API_KEY?: string;
        VISION_API_KEY?: string;
      };
    };
  }

  // More detailed Google Maps API typings
  namespace google.maps {
    // Basic types
    type LatLngLiteral = { lat: number; lng: number; };
    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      equals(other: LatLng | null | undefined): boolean;
      toJSON(): LatLngLiteral;
      toString(): string;
      toUrlValue(precision?: number): string;
    }
    class LatLngBounds {
      constructor(sw?: LatLngLiteral | LatLng | null, ne?: LatLngLiteral | LatLng | null);
      extend(point: LatLngLiteral | LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
      toJSON(): { north: number; south: number; east: number; west: number };
      contains(latLng: LatLngLiteral | LatLng): boolean;
      equals(other: LatLngBounds | null | undefined): boolean;
      union(other: LatLngBounds): LatLngBounds;
      // ... other methods
    }

    // Map
    interface MapOptions {
      center?: LatLngLiteral | LatLng;
      zoom?: number;
      mapId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      clickableIcons?: boolean;
      // ... other options
    }
    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
      setCenter(latLng: LatLngLiteral | LatLng): void;
      setZoom(zoom: number): void;
      getDiv(): Element;
      getCenter(): LatLng;
      getZoom(): number | undefined;
      getBounds(): LatLngBounds | null | undefined;
      fitBounds(bounds: LatLngBounds | LatLngLiteral, padding?: number | google.maps.Padding): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      // ... other methods
    }
    type Padding = number | { top?: number; right?: number; bottom?: number; left?: number };

    interface MapMouseEvent {
        latLng: LatLng | null;
        domEvent?: MouseEvent | TouchEvent | PointerEvent | KeyboardEvent | WheelEvent; // More generic DOM event
        pixel?: Point;
        stop?(): void; // If it's a DOM event that can be stopped
        // other properties if known/needed
    }
    interface IconMouseEvent extends MapMouseEvent {
        placeId?: string | undefined;
    }


    // Marker (Advanced)
    namespace marker {
      interface AdvancedMarkerElementOptions {
        map?: google.maps.Map | null;
        position?: google.maps.LatLngLiteral | null;
        title?: string | null; // Title should be string
        content?: Node | null;
        zIndex?: number;
        collisionBehavior?: string; // e.g., "REQUIRED", "OPTIONAL"
      }
      class AdvancedMarkerElement extends HTMLElement { // It's a Web Component
        constructor(options?: AdvancedMarkerElementOptions);
        addListener(eventName: string, handler: Function): google.maps.MapsEventListener;
        map: google.maps.Map | null | undefined;
        position: google.maps.LatLngLiteral | null | undefined;
        content: Node | null | undefined;
        // title property is inherited from HTMLElement and can be set directly
        title: string;
      }
    }

    // Directions
    interface DirectionsRequest {
        origin: LatLngLiteral | string | LatLng | Place;
        destination: LatLngLiteral | string | LatLng | Place;
        travelMode: TravelMode;
        waypoints?: DirectionsWaypoint[];
        optimizeWaypoints?: boolean;
        provideRouteAlternatives?: boolean;
        // ... other options
    }
    interface DirectionsResult {
        routes: DirectionsRoute[];
        geocoded_waypoints?: GeocoderWaypoint[];
        // ... other properties
    }
    interface DirectionsRoute {
        overview_path: LatLng[];
        bounds: LatLngBounds;
        legs: DirectionsLeg[];
        // ... other properties
    }
    interface DirectionsLeg { /* ... */ }
    interface DirectionsWaypoint { location: LatLngLiteral | string | Place; stopover?: boolean; }
    interface GeocoderWaypoint { /* ... */ }

    class DirectionsService {
      constructor();
      route(request: DirectionsRequest, callback: (result: DirectionsResult | null, status: DirectionsStatus) => void): Promise<DirectionsResult>;
    }
    enum TravelMode {
        DRIVING = "DRIVING",
        WALKING = "WALKING",
        BICYCLING = "BICYCLING",
        TRANSIT = "TRANSIT"
    }
    enum DirectionsStatus {
        OK = "OK",
        NOT_FOUND = "NOT_FOUND",
        ZERO_RESULTS = "ZERO_RESULTS",
        MAX_WAYPOINTS_EXCEEDED = "MAX_WAYPOINTS_EXCEEDED",
        MAX_ROUTE_LENGTH_EXCEEDED = "MAX_ROUTE_LENGTH_EXCEEDED",
        INVALID_REQUEST = "INVALID_REQUEST",
        OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
        REQUEST_DENIED = "REQUEST_DENIED",
        UNKNOWN_ERROR = "UNKNOWN_ERROR"
    }

    // Geocoder
    interface GeocoderRequest {
        address?: string;
        location?: LatLngLiteral | LatLng;
        // ... other options
    }
    interface GeocoderResult {
        formatted_address: string;
        geometry: { location: LatLng; /* ... */ };
        // ... other properties
    }
    class Geocoder {
      constructor();
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): Promise<{results: GeocoderResult[]}>;
    }
    enum GeocoderStatus {
        OK = "OK",
        ZERO_RESULTS = "ZERO_RESULTS",
        OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
        REQUEST_DENIED = "REQUEST_DENIED",
        INVALID_REQUEST = "INVALID_REQUEST",
        UNKNOWN_ERROR = "UNKNOWN_ERROR",
        ERROR = "ERROR"
    }

    // Polyline
    interface PolylineOptions {
        path?: any[] | MVCArray<LatLng>; // MVCArray or LatLngLiteral[] or LatLng[]
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        map?: Map;
        icons?: IconSequence[];
        geodesic?: boolean;
        // ... other options
    }
    class Polyline {
      constructor(opts?: PolylineOptions);
      setMap(map: Map | null): void;
      setPath(path: any[] | MVCArray<LatLng>): void; // MVCArray or LatLngLiteral[] or LatLng[]
      getMap(): Map | null;
      getPath(): MVCArray<LatLng>;
      // ... other methods
    }
    interface IconSequence {
      icon?: Symbol;
      offset?: string;
      repeat?: string;
      fixedRotation?: boolean;
    }
    interface Symbol {
      path: string | SymbolPath;
      anchor?: Point;
      fillColor?: string;
      fillOpacity?: number;
      labelOrigin?: Point;
      rotation?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }
    class Point { constructor(x:number, y:number); /* ... */ }


    // Symbols
    enum SymbolPath {
        CIRCLE = 0,
        FORWARD_CLOSED_ARROW = 1,
        FORWARD_OPEN_ARROW = 2,
        BACKWARD_CLOSED_ARROW = 3,
        BACKWARD_OPEN_ARROW = 4,
        // ... other paths
    }

    // Events
    interface MapsEventListener {
        remove(): void;
    }
    var event: {
        addListener: (instance: any, eventName: string, handler: Function) => MapsEventListener;
        removeListener: (listener: MapsEventListener) => void;
        clearInstanceListeners: (instance: any) => void;
        trigger(instance: any, eventName: string, ...args: any[]): void;
    };

    // Place (simplified for DirectionsRequest)
    interface Place {
        location?: LatLng | LatLngLiteral;
        placeId?: string;
        query?: string;
    }
    // MVCArray (simplified)
    interface MVCArray<T> {
        getAt(i: number): T;
        getLength(): number;
        insertAt(i: number, elem: T): void;
        pop(): T | undefined;
        push(elem: T): number;
        removeAt(i: number): T | undefined;
        setAt(i: number, elem: T): void;
        forEach(callback: (elem: T, index: number) => void): void; // Corrected signature
        clear() : void;
    }
  }
}
export {};