import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import './styles.css';

const map = new maplibregl.Map({
  container: 'map',
  center: [13.405, 52.52],
  zoom: 10,
  style: {
    version: 8,
    glyphs: '/fonts/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
      demoLabel: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                title: 'Roboto Flex Heading 1',
              },
              geometry: {
                type: 'Point',
                coordinates: [13.405, 52.52],
              },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
      {
        id: 'demo-label',
        type: 'symbol',
        source: 'demoLabel',
        layout: {
          'text-field': ['get', 'title'],
          'text-font': ['Roboto Flex Heading 1'],
          'text-size': 28,
          'text-anchor': 'center',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#17324d',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      },
    ],
  },
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
