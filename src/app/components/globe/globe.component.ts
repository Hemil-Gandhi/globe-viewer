import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface GlobeMarker {
  name: string;
  lat: number;
  lng: number;
  type: 'city' | 'poi';
  population?: number;
}

@Component({
  selector: 'app-globe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './globe.component.html',
  styleUrl: './globe.component.css'
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('globeContainer') globeContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private globe!: THREE.Mesh;
  private atmosphere!: THREE.Mesh;
  private controls!: OrbitControls;
  private animationId!: number;
  private markerGroup!: THREE.Group;
  private lightsGroup!: THREE.Group;
  private cloudMesh!: THREE.Mesh;

  markers: GlobeMarker[] = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, type: 'city', population: 8336817 },
    { name: 'London', lat: 51.5074, lng: -0.1278, type: 'city', population: 8982000 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, type: 'city', population: 13940236 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, type: 'city', population: 5312163 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, type: 'city', population: 3331420 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, type: 'city', population: 5850342 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, type: 'city', population: 881549 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, type: 'city', population: 21296920 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'city', population: 2148327 },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050, type: 'city', population: 3645000 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, type: 'city', population: 3979576 },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074, type: 'city', population: 21540000 },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737, type: 'city', population: 24240000 },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173, type: 'city', population: 12506468 },
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, type: 'city', population: 6718803 },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357, type: 'city', population: 10289450 },
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, type: 'city', population: 4434827 },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832, type: 'city', population: 2731571 },
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, type: 'city', population: 3051629 },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, type: 'city', population: 15029231 },
  ];

  ngAfterViewInit(): void {
    console.log('GlobeComponent: Initializing 3D Globe...');
    try {
      this.initScene();
      this.createGlobe();
      this.createClouds();
      this.createAtmosphere();
      this.createCityLights();
      this.createStars();
      this.createMarkers();
      this.animate();
      this.setupResize();
      console.log('GlobeComponent: Initialization complete');
    } catch (error) {
      console.error('GlobeComponent: Error during initialization:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initScene(): void {
    const container = this.globeContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 3;

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.02;
    this.controls.enablePan = true;
    this.controls.minDistance = 1.3;
    this.controls.maxDistance = 6;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
  }

  private createGlobe(): void {
    const geometry = new THREE.SphereGeometry(1, 128, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(0, 0, 2048, 1024);
    
    function drawMap(ctx: CanvasRenderingContext2D, width: number, height: number) {
      ctx.fillStyle = '#1a3a1a';
      ctx.beginPath();
      ctx.ellipse(width/2, height/2, width/2.1, height/2.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#2d5016';
      ctx.beginPath();
      ctx.ellipse(width/2, height/2, width/2.3, height/2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#3d6b1e';
      ctx.beginPath();
      ctx.ellipse(width/2, height/2, width/2.5, height/2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#1a3a1a';
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo(i * width / 24, 0);
        ctx.lineTo(i * width / 24, height);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * height / 12);
        ctx.lineTo(width, i * height / 12);
        ctx.stroke();
      }
      
      ctx.fillStyle = '#1e5a8a';
      ctx.beginPath();
      ctx.ellipse(width * 0.3, height * 0.35, width * 0.12, height * 0.08, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.65, height * 0.4, width * 0.1, height * 0.06, -0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#1e4d6b';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.7, width * 0.15, height * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#1a3a4a';
      ctx.beginPath();
      ctx.ellipse(width * 0.75, height * 0.75, width * 0.08, height * 0.05, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    drawMap(ctx, 2048, 1024);
    
    function drawContinents(ctx: CanvasRenderingContext2D, width: number, height: number) {
      ctx.fillStyle = '#2d5a1e';
      
      ctx.beginPath();
      ctx.ellipse(width * 0.25, height * 0.45, width * 0.08, height * 0.12, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.48, height * 0.5, width * 0.1, height * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.75, height * 0.4, width * 0.08, height * 0.1, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.82, height * 0.75, width * 0.05, height * 0.08, -0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.2, height * 0.8, width * 0.04, height * 0.06, 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.9, height * 0.25, width * 0.03, height * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(width * 0.88, height * 0.55, width * 0.02, height * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    drawContinents(ctx, 2048, 1024);
    
    function addNoise(ctx: CanvasRenderingContext2D, width: number, height: number) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);
    }
    
    addNoise(ctx, 2048, 1024);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.globe.castShadow = true;
    this.globe.receiveShadow = true;
    this.scene.add(this.globe);

    const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x445588, 0.3);
    fillLight.position.set(-3, -2, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x6688ff, 0.2);
    rimLight.position.set(0, 0, -5);
    this.scene.add(rimLight);
  }

  private createClouds(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 1024, 512);
    
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radius = 10 + Math.random() * 40;
      const opacity = 0.1 + Math.random() * 0.2;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const cloudTexture = new THREE.CanvasTexture(canvas);
    
    const cloudGeometry = new THREE.SphereGeometry(1.01, 64, 32);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    
    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.scene.add(this.cloudMesh);
  }

  private createAtmosphere(): void {
    const geometry = new THREE.SphereGeometry(1.08, 64, 64);
    
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float intensity = pow(0.65 - dot(vNormal, viewDirection), 3.0);
          
          vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
          vec3 sunsetColor = vec3(1.0, 0.4, 0.2);
          
          vec3 color = mix(sunsetColor, atmosphereColor, 0.5);
          
          gl_FragColor = vec4(color, intensity * 0.8);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    this.atmosphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.atmosphere);

    const outerGlowGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const outerGlowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(0.2, 0.4, 0.8, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    this.scene.add(outerGlow);
  }

  private createCityLights(): void {
    this.lightsGroup = new THREE.Group();
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 1024, 512);
    
    for (const marker of this.markers) {
      const { x, y } = this.latLngToCanvas(marker.lat, marker.lng, 1024, 512);
      const radius = 3 + Math.min(Math.log(marker.population || 100000) * 0.5, 15);
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 220, 150, 0.8)');
      gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.4)');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const lightsTexture = new THREE.CanvasTexture(canvas);
    lightsTexture.colorSpace = THREE.SRGBColorSpace;
    
    const lightsGeometry = new THREE.SphereGeometry(1.005, 64, 32);
    const lightsMaterial = new THREE.MeshBasicMaterial({
      map: lightsTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
    
    const lightsMesh = new THREE.Mesh(lightsGeometry, lightsMaterial);
    this.lightsGroup.add(lightsMesh);
    this.scene.add(this.lightsGroup);
  }

  private latLngToCanvas(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }

  private createStars(): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 40 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = new THREE.Color();
      const hue = 0.55 + Math.random() * 0.2;
      const saturation = 0.2 + Math.random() * 0.4;
      const lightness = 0.6 + Math.random() * 0.4;
      color.setHSL(hue, saturation, lightness);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  private createMarkers(): void {
    this.markerGroup = new THREE.Group();
    
    for (const marker of this.markers) {
      const { x, y, z } = this.latLngToVector3(marker.lat, marker.lng, 1.03);
      
      const markerGroup = new THREE.Group();
      markerGroup.position.set(x, y, z);
      markerGroup.lookAt(0, 0, 0);
      
      const pinGeometry = new THREE.ConeGeometry(0.015, 0.04, 8);
      const pinMaterial = new THREE.MeshPhongMaterial({
        color: 0xff4444,
        emissive: 0x661111,
        shininess: 50,
      });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      pin.position.y = 0.02;
      markerGroup.add(pin);
      
      const baseGeometry = new THREE.SphereGeometry(0.012, 12, 12);
      const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xff6666 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      markerGroup.add(base);
      
      const glowGeometry = new THREE.SphereGeometry(0.025, 12, 12);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.userData = { baseScale: 1, animOffset: Math.random() * 100 };
      markerGroup.add(glow);
      
      this.markerGroup.add(markerGroup);
    }

    this.scene.add(this.markerGroup);
  }

  private latLngToVector3(lat: number, lng: number, radius: number): { x: number; y: number; z: number } {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.0002;
    }
    
    if (this.markerGroup) {
      const time = Date.now() * 0.003;
      this.markerGroup.children.forEach((child) => {
        const glow = child.children.find(c => c.userData && c.userData['animOffset']);
        if (glow && glow instanceof THREE.Mesh) {
          const offset = glow.userData['animOffset'];
          const scale = 1 + Math.sin(time + offset) * 0.3;
          glow.scale.setScalar(Math.max(0.7, scale));
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  private setupResize(): void {
    const container = this.globeContainer.nativeElement;
    
    window.addEventListener('resize', () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }
}
