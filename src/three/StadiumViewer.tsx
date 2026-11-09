import {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {HStack} from '@astryxdesign/core/HStack';
import {Switch} from '@astryxdesign/core/Switch';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Text} from '@astryxdesign/core/Text';
import type {Sport, Venue} from '../data';
import {buildStadium, type StadiumModel} from './buildStadium';

export interface StadiumViewerProps {
  venue: Venue;
  sport: Sport;
  seatColor: string;
  accentColor: string;
  height?: number | string;
  /** Show the roof / rotate controls under the canvas. */
  hasControls?: boolean;
}

export default function StadiumViewer({venue, sport, seatColor, accentColor, height = 280, hasControls = true}: StadiumViewerProps) {
  const [showRoof, setShowRoof] = useState(venue.roof !== 'indoor' || venue.feature === 'saddle-roof');
  const [roofOpen, setRoofOpen] = useState(venue.roof === 'retractable');
  const [autoRotate, setAutoRotate] = useState(true);
  const hasRoof = venue.roof !== 'open';
  const isRetractable = venue.roof === 'retractable';
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    setShowRoof(venue.roof !== 'indoor' || venue.feature === 'saddle-roof');
    setRoofOpen(venue.roof === 'retractable');
  }, [venue.id, venue.roof]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative overflow-hidden rounded-lg border border-border"
        style={{
          height,
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-background-blue) 70%, var(--color-background-surface)) 0%, var(--color-background-surface) 100%)',
        }}
        role="img"
        aria-label={`Interactive 3D model of ${venue.name}. Drag to orbit, pinch or scroll to zoom.`}>
        <Canvas
          dpr={[1, 2]}
          shadows
          frameloop={autoRotate && !reducedMotion ? 'always' : 'demand'}
          camera={{fov: 38, near: 1, far: 5000, position: [200, 140, 200]}}
          gl={{antialias: true, preserveDrawingBuffer: false}}>
          <Scene
            venue={venue}
            sport={sport}
            seatColor={seatColor}
            accentColor={accentColor}
            showRoof={showRoof}
            roofOpen={roofOpen}
            autoRotate={autoRotate && !reducedMotion}
          />
        </Canvas>
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-surface/80 px-2 py-1">
          <Text type="supporting" size="xsm">
            Procedural model · approximate
          </Text>
        </div>
      </div>
      {hasControls && (
        <HStack gap={3} wrap="wrap" vAlign="center">
          {hasRoof && <Switch size="sm" label="Roof" value={showRoof} onChange={setShowRoof} />}
          {hasRoof && isRetractable && showRoof && (
            <SegmentedControl size="sm" label="Retractable roof" value={roofOpen ? 'open' : 'closed'} onChange={(v) => setRoofOpen(v === 'open')}>
              <SegmentedControlItem value="closed" label="Closed" />
              <SegmentedControlItem value="open" label="Open" />
            </SegmentedControl>
          )}
          {!reducedMotion && <Switch size="sm" label="Auto-rotate" value={autoRotate} onChange={setAutoRotate} />}
        </HStack>
      )}
    </div>
  );
}

interface SceneProps {
  venue: Venue;
  sport: Sport;
  seatColor: string;
  accentColor: string;
  showRoof: boolean;
  roofOpen: boolean;
  autoRotate: boolean;
}

function Scene({venue, sport, seatColor, accentColor, showRoof, roofOpen, autoRotate}: SceneProps) {
  const model = useMemo<StadiumModel>(
    () => buildStadium({venue, sport, seatColor, accentColor}),
    [venue, sport, seatColor, accentColor],
  );
  useEffect(() => () => model.dispose(), [model]);

  const {camera, invalidate} = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  // Frame the model whenever it changes.
  useEffect(() => {
    const r = model.radius;
    camera.position.set(r * 1.7, r * 1.25, r * 1.85);
    (camera as THREE.PerspectiveCamera).far = r * 20;
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, r * 0.05, 0);
    controls.current?.update();
    invalidate();
  }, [model, camera, invalidate]);

  useEffect(() => {
    model.roof.forEach((o) => (o.visible = showRoof));
    invalidate();
  }, [model, showRoof, invalidate]);

  // Animate retractable roofs.
  useEffect(() => invalidate(), [roofOpen, invalidate]);
  const progress = useRef(0);
  useEffect(() => {
    progress.current = 0;
  }, [model]);
  const base = useMemo(() => model.movingRoof.map((m) => m.object.position.clone()), [model]);
  useFrame((_, delta) => {
    const target = roofOpen ? 1 : 0;
    if (Math.abs(progress.current - target) < 0.001) return;
    progress.current += Math.sign(target - progress.current) * Math.min(Math.abs(target - progress.current), delta * 0.6);
    const t = 0.5 - Math.cos(progress.current * Math.PI) / 2;
    model.movingRoof.forEach((m, i) => {
      m.object.position.copy(base[i]).addScaledVector(m.openOffset, t);
      if (m.openRotationY) m.object.rotation.y = m.openRotationY * t;
      if (m.openScale) {
        const sc = 1 + (m.openScale - 1) * t;
        m.object.scale.set(sc, 1, sc);
      }
      if (m.shrink) {
        const s = 1 - t * 0.98;
        m.object.scale.set(s, 1, s);
      }
    });
    invalidate();
  });

  return (
    <>
      <hemisphereLight args={['#ffffff', '#5b6168', 1.1]} />
      <directionalLight
        position={[model.radius, model.radius * 1.6, model.radius * 0.6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
        shadow-camera-left={-model.radius * 1.5}
        shadow-camera-right={model.radius * 1.5}
        shadow-camera-top={model.radius * 1.5}
        shadow-camera-bottom={-model.radius * 1.5}
      />
      <primitive object={model.group} />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={model.radius * 0.35}
        maxDistance={model.radius * 3.2}
        maxPolarAngle={Math.PI * 0.47}
      />
    </>
  );
}
