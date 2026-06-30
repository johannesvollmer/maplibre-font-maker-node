import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import './styles.css';

const glyphsPatSchema = '/fonts/{fontstack}/{range}.pbf';
const fontName = 'Roboto Flex Heading 1';

const map = new maplibregl.Map({
  container: 'map',
  center: [13.405, 52.52],
  zoom: 10,
  style: {
    version: 8,
    glyphs: glyphsPatSchema,
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
                title: 'Sample Text With Custom Font',
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
          'text-font': [fontName],
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
