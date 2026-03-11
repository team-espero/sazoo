import React, { useEffect, useMemo, useRef, useState } from 'react';

type SceneStatus = 'loading' | 'ready' | 'error';

const preloadedModels = new Set<string>();
const KTX2_FREE_MODELS = new Set(['/sazoo_hanok_web_home_1024.glb']);

const ScenePlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/60 border-t-transparent" />
  </div>
);

const SceneErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div className="absolute inset-0 flex items-center justify-center px-6">
    <div className="glass-panel flex max-w-[18rem] flex-col items-center gap-3 rounded-[28px] px-5 py-6 text-center">
      <div className="text-sm font-black text-slate-800">3D preview is taking a break.</div>
      <p className="text-xs font-medium leading-relaxed text-slate-500">
        The scene asset did not load cleanly. You can keep using the app or retry just this preview.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm"
      >
        Retry 3D
      </button>
    </div>
  </div>
);

const applyDefaultAlbedo = (THREE: any, material: any) => {
  if (!material) return;

  if (material.color) {
    material.color.set('#ffffff');
  }

  if (material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
    material.map.needsUpdate = true;
  }

  if (typeof material.metalness === 'number') {
    material.metalness = Math.min(material.metalness, 0.28);
  }

  if (typeof material.roughness === 'number') {
    material.roughness = Math.max(material.roughness, 0.52);
  }

  material.needsUpdate = true;
};

const disposeMaterial = (material: any) => {
  if (!material) return;

  for (const value of Object.values(material)) {
    if (value && typeof value === 'object' && typeof (value as { dispose?: () => void }).dispose === 'function') {
      (value as { dispose: () => void }).dispose();
    }
  }

  if (typeof material.dispose === 'function') {
    material.dispose();
  }
};

const disposeSceneObject = (object: any) => {
  object?.traverse?.((node: any) => {
    if (node.geometry?.dispose) {
      node.geometry.dispose();
    }

    if (Array.isArray(node.material)) {
      node.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(node.material);
    }
  });
};

const createMediaQueryListener = (query: MediaQueryList, handler: () => void) => {
  query.addEventListener?.('change', handler);
  return () => query.removeEventListener?.('change', handler);
};

const HomeScene = ({
  modelUrl = '/sazoo_hanok_web_home_1024.glb',
  scale = 5.5,
  position = [0, -2.0, 0],
  rotationSpeed = 0.25,
}: {
  modelUrl?: string;
  scale?: number;
  position?: [number, number, number];
  rotationSpeed?: number;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<SceneStatus>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const touchQuery = window.matchMedia('(pointer: coarse)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncFlags = () => {
      setIsTouchDevice(touchQuery.matches);
      setReducedMotion(motionQuery.matches);
    };

    syncFlags();

    const removeTouchListener = createMediaQueryListener(touchQuery, syncFlags);
    const removeMotionListener = createMediaQueryListener(motionQuery, syncFlags);

    return () => {
      removeTouchListener();
      removeMotionListener();
    };
  }, []);

  const maxPixelRatio = useMemo(() => (isTouchDevice ? 1.25 : 1.6), [isTouchDevice]);
  const shouldAnimate = !isTouchDevice && !reducedMotion;
  const requiresKtxTranscoder = !KTX2_FREE_MODELS.has(modelUrl);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let controls: any = null;
    let renderer: any = null;
    let cleanupModel: any = null;
    let ktx2Loader: any = null;
    let animationFrame = 0;

    const renderOnce = () => {
      if (disposed || !renderer || !controls) return;
      controls.update();
      renderer.render(scene, camera);
    };

    let scene: any;
    let camera: any;
    let modelRoot: any = null;

    const boot = async () => {
      try {
        setStatus('loading');

        const [
          THREE,
          { OrbitControls },
          { GLTFLoader },
          { MeshoptDecoder },
        ] = await Promise.all([
          import('three'),
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/libs/meshopt_decoder.module.js'),
        ]);

        let KTX2Loader: any = null;
        if (requiresKtxTranscoder) {
          ({ KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js'));
        }

        if (disposed) return;

        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(isTouchDevice ? 48 : 45, width / height, 0.1, 100);
        camera.position.set(0, 0, 7);

        renderer = new THREE.WebGLRenderer({
          antialias: !isTouchDevice,
          alpha: true,
          powerPreference: isTouchDevice ? 'low-power' : 'high-performance',
          preserveDrawingBuffer: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
        renderer.setSize(width, height, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.65));
        scene.add(new THREE.HemisphereLight(0xffffff, 0xdbeafe, 0.95));

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
        keyLight.position.set(5, 8, 6);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xf8fafc, 0.45);
        fillLight.position.set(-4, 3, -2);
        scene.add(fillLight);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = shouldAnimate;
        controls.dampingFactor = 0.08;
        controls.autoRotate = shouldAnimate;
        controls.autoRotateSpeed = rotationSpeed;
        controls.maxPolarAngle = Math.PI / 2;
        controls.minPolarAngle = Math.PI / 3;

        const loader = new GLTFLoader();
        if (KTX2Loader) {
          ktx2Loader = new KTX2Loader();
          ktx2Loader.setTranscoderPath('/basis/');
          ktx2Loader.detectSupport(renderer);
          loader.setKTX2Loader(ktx2Loader);
        }
        loader.setMeshoptDecoder(MeshoptDecoder);

        const gltf = await loader.loadAsync(modelUrl);
        if (disposed) {
          disposeSceneObject(gltf.scene);
          return;
        }

        modelRoot = gltf.scene;
        modelRoot.scale.setScalar(scale);
        modelRoot.position.set(position[0], position[1], position[2]);
        modelRoot.rotation.set(0, 0, 0);

        modelRoot.traverse((node: any) => {
          if (!node?.isMesh) return;
          if (Array.isArray(node.material)) {
            node.material.forEach((material: any) => applyDefaultAlbedo(THREE, material));
          } else {
            applyDefaultAlbedo(THREE, node.material);
          }
        });

        scene.add(modelRoot);
        cleanupModel = modelRoot;
        setStatus('ready');

        const baseY = position[1];

        const animate = () => {
          if (disposed || !renderer || !scene || !camera) return;

          if (modelRoot) {
            modelRoot.position.y = shouldAnimate
              ? baseY + Math.sin(performance.now() * 0.0011) * 0.08
              : baseY;
          }

          controls.update();
          renderer.render(scene, camera);

          if (shouldAnimate) {
            animationFrame = window.requestAnimationFrame(animate);
          }
        };

        const handleResize = () => {
          if (disposed || !renderer || !camera) return;
          const nextWidth = Math.max(container.clientWidth, 1);
          const nextHeight = Math.max(container.clientHeight, 1);
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
          renderer.setSize(nextWidth, nextHeight, false);
          renderOnce();
        };

        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        window.addEventListener('resize', handleResize);

        if (!shouldAnimate) {
          controls.addEventListener('change', renderOnce);
          renderOnce();
        } else {
          animationFrame = window.requestAnimationFrame(animate);
        }

        return () => {
          controls?.removeEventListener?.('change', renderOnce);
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('HomeScene load failed:', error);
        if (!disposed) {
          setStatus('error');
        }
      }
    };

    let detachRuntimeListeners: (() => void) | undefined;

    void boot().then((cleanup) => {
      detachRuntimeListeners = cleanup;
    });

    return () => {
      disposed = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      detachRuntimeListeners?.();
      resizeObserver?.disconnect();
      controls?.dispose?.();
      if (cleanupModel) {
        disposeSceneObject(cleanupModel);
      }
      ktx2Loader?.dispose?.();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        const canvas = renderer.domElement;
        if (canvas?.parentNode === container) {
          container.removeChild(canvas);
        }
      }
    };
  }, [isTouchDevice, maxPixelRatio, modelUrl, position, reducedMotion, requiresKtxTranscoder, retryKey, rotationSpeed, scale, shouldAnimate]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {status === 'loading' && <ScenePlaceholder />}
      {status === 'error' && <SceneErrorFallback onRetry={() => setRetryKey((prev) => prev + 1)} />}
    </div>
  );
};

export const preloadModel = (url: string) => {
  if (preloadedModels.has(url) || typeof window === 'undefined') return;
  preloadedModels.add(url);
  void fetch(url).catch(() => {
    preloadedModels.delete(url);
  });
};

export default HomeScene;
