import {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
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
  /** Full-screen viewer: wheel and pinch zoom are enabled (inline they would trap page scrolling). */
  isFullscreen?: boolean;
}

let webglSupport: boolean | undefined;

/** Probe WebGL once per page and release the probe context straight away. */
function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const c = document.createElement('canvas');
      const ctx = c.getContext('webgl2') ?? c.getContext('webgl');
      webglSupport = Boolean(ctx);
      ctx?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const media = (q: string) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

export default function StadiumViewer({venue, sport, seatColor, accentColor, height = 280, hasControls = true, isFullscreen = false}: StadiumViewerProps) {
  const model = useMemo(() => buildStadium({venue, sport, seatColor, accentColor}), [venue, sport, seatColor, accentColor]);
  useEffect(() => () => model?.dispose(), [model]);
  const [showRoof, setShowRoof] = useState(true);
  const [roofOpen, setRoofOpen] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [gl, setGl] = useState<'ok' | 'unsupported' | 'lost'>(() => (hasWebGL() ? 'ok' : 'unsupported'));
  const [canvasKey, setCanvasKey] = useState(0);
  const reducedMotion = useMemo(() => media('(prefers-reduced-motion: reduce)'), []);
  const coarse = useMemo(() => media('(pointer: coarse)'), []);

  useEffect(() => {
    setShowRoof(true);
    setRoofOpen(true);
  }, [venue.id]);

  if (!model) return null;
  const hasRoof = model.roof.length > 0;
  const isRetractable = Boolean(model.setRoofOpen);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative overflow-hidden rounded-lg border border-border"
        style={{
          height,
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-background-blue) 70%, var(--color-background-surface)) 0%, var(--color-background-surface) 100%)',
        }}
        role="img"
        aria-label={`Interactive 3D model of ${venue.name}. Drag to orbit${isFullscreen ? ', pinch or scroll to zoom' : ''}.`}>
        {gl === 'ok' ? (
          <Canvas
            key={canvasKey}
            flat
            dpr={coarse ? [1, 1.5] : [1, 2]}
            shadows="percentage"
            frameloop={autoRotate && !reducedMotion ? 'always' : 'demand'}
            camera={{fov: 36, near: 1, far: 5000, position: [200, 140, 200]}}
            gl={{antialias: true, powerPreference: 'high-performance'}}
            onCreated={({gl: renderer}) => {
              renderer.domElement.addEventListener(
                'webglcontextlost',
                (e) => {
                  e.preventDefault();
                  setGl('lost');
                },
                {once: true},
              );
            }}>
            <Scene
              model={model}
              showRoof={showRoof}
              roofOpen={roofOpen}
              autoRotate={autoRotate && !reducedMotion}
              isFullscreen={isFullscreen}
              isCoarse={coarse}
            />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              isCompact
              title={gl === 'lost' ? '3D view paused' : '3D view unavailable'}
              description={gl === 'lost' ? 'The graphics context was lost. You can restart the model.' : 'This browser or device does not support WebGL, which the 3D models need.'}
              actions={
                gl === 'lost' ? (
                  <Button
                    size="sm"
                    label="Restart 3D view"
                    onClick={() => {
                      setGl('ok');
                      setCanvasKey((k) => k + 1);
                    }}
                  />
                ) : undefined
              }
            />
          </div>
        )}
        {gl === 'ok' && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-surface/80 px-2 py-1">
            <Text type="supporting" size="xsm">
              Low-poly model · to scale
            </Text>
          </div>
        )}
      </div>
      {hasControls && gl === 'ok' && (
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
  model: StadiumModel;
  showRoof: boolean;
  roofOpen: boolean;
  autoRotate: boolean;
  isFullscreen: boolean;
  isCoarse: boolean;
}

function Scene({model, showRoof, roofOpen, autoRotate, isFullscreen, isCoarse}: SceneProps) {
  const {camera, invalidate, gl, scene} = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const r = model.radius;

  // Soft studio reflections for the metal and glass (procedural, no download).
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  // Frame the model from its preferred angle whenever it changes.
  useEffect(() => {
    const az = THREE.MathUtils.degToRad(model.view.azimuth);
    const el = THREE.MathUtils.degToRad(model.view.elevation);
    const d = r * model.view.distance;
    camera.position.set(Math.cos(el) * Math.cos(az) * d, Math.sin(el) * d + model.target, Math.cos(el) * Math.sin(az) * d);
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = Math.max(0.5, r / 150);
    cam.far = r * 30;
    cam.updateProjectionMatrix();
    controls.current?.target.set(0, model.target, 0);
    controls.current?.update();
    invalidate();
  }, [model, r, camera, invalidate]);

  // Inline on touch screens: vertical swipes scroll the page, horizontal swipes orbit.
  useEffect(() => {
    if (isCoarse && !isFullscreen) gl.domElement.style.touchAction = 'pan-y';
  }, [gl, isCoarse, isFullscreen]);

  useEffect(() => {
    model.roof.forEach((o) => (o.visible = showRoof));
    invalidate();
  }, [model, showRoof, invalidate]);

  // Retractable roofs: start open, then animate toward the requested state.
  const progress = useRef(1);
  useEffect(() => {
    progress.current = 1;
    model.setRoofOpen?.(1);
    invalidate();
  }, [model, invalidate]);
  useEffect(() => invalidate(), [roofOpen, invalidate]);
  useFrame((_, delta) => {
    if (!model.setRoofOpen) return;
    const target = roofOpen ? 1 : 0;
    if (Math.abs(progress.current - target) < 0.001) return;
    progress.current += Math.sign(target - progress.current) * Math.min(Math.abs(target - progress.current), delta * 0.35);
    model.setRoofOpen(progress.current);
    invalidate();
  });

  return (
    <>
      <hemisphereLight args={['#ffffff', '#5b6168', 1.15]} />
      <directionalLight
        position={[r * 0.9, r * 1.7, r * 0.55]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
        shadow-camera-left={-r * 1.6}
        shadow-camera-right={r * 1.6}
        shadow-camera-top={r * 1.6}
        shadow-camera-bottom={-r * 1.6}
        shadow-camera-near={1}
        shadow-camera-far={r * 6}
      />
      <primitive object={model.group} />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        enablePan={false}
        enableZoom={isFullscreen}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        minDistance={r * 0.5}
        maxDistance={r * 3.6}
        maxPolarAngle={Math.PI * 0.47}
      />
    </>
  );
}
