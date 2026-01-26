import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layer } from '../api/data'

interface MapComponentProps {
    layers: Layer[]
    selectedLayerId?: number
}

export const MapComponent: React.FC<MapComponentProps> = ({ layers, selectedLayerId }) => {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm',
                        type: 'raster',
                        source: 'osm',
                    },
                ],
            },
            center: [105.8, 21.5], // Vietnam center
            zoom: 6,
        })

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
        map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left')

        map.current.on('load', () => {
            setMapLoaded(true)
        })

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    // Add/update layers
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        // Remove existing COG layers
        const existingLayers = map.current.getStyle().layers || []
        existingLayers.forEach((layer) => {
            if (layer.id.startsWith('cog-')) {
                map.current!.removeLayer(layer.id)
            }
        })

        const existingSources = Object.keys(map.current.getStyle().sources || {})
        existingSources.forEach((source) => {
            if (source.startsWith('cog-')) {
                map.current!.removeSource(source)
            }
        })

        // Add selected layer
        const selectedLayer = layers.find((l) => l.id === selectedLayerId)
        if (selectedLayer && selectedLayer.cog_url) {
            const sourceId = `cog-${selectedLayer.id}`
            const layerId = `cog-layer-${selectedLayer.id}`

            map.current.addSource(sourceId, {
                type: 'raster',
                tiles: [`${selectedLayer.cog_url}?t=${Date.now()}`],
                tileSize: 256,
            })

            map.current.addLayer({
                id: layerId,
                type: 'raster',
                source: sourceId,
                paint: {
                    'raster-opacity': 0.7,
                },
            })
        }
    }, [layers, selectedLayerId, mapLoaded])

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    )
}
