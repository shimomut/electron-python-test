// 3D Graphics module using Three.js
// This module is loaded as a script tag with type="module" to support ES6 imports

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Graphics3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
    this.animationId = null;
  }

  init() {
    // Clear any existing content in the container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Camera setup
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Create teapot geometry
    this.createTeapot();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation
    this.animate();
  }

  createTeapot() {
    // Create a stylized teapot using basic geometries
    const group = new THREE.Group();

    // Teapot body (sphere)
    const bodyGeometry = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      shininess: 100,
      specular: 0x444444
    });
    const body = new THREE.Mesh(bodyGeometry, material);
    body.scale.set(1, 0.8, 1);
    group.add(body);

    // Spout (cone)
    const spoutGeometry = new THREE.ConeGeometry(0.15, 0.8, 16);
    const spout = new THREE.Mesh(spoutGeometry, material);
    spout.rotation.z = Math.PI / 2;
    spout.position.set(1.2, 0, 0);
    group.add(spout);

    // Handle (torus)
    const handleGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32, Math.PI);
    const handle = new THREE.Mesh(handleGeometry, material);
    handle.rotation.y = Math.PI / 2;
    handle.position.set(-0.8, 0.2, 0);
    group.add(handle);

    // Lid (cylinder + sphere)
    const lidBaseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.2, 32);
    const lidBase = new THREE.Mesh(lidBaseGeometry, material);
    lidBase.position.y = 0.7;
    group.add(lidBase);

    const lidKnobGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const lidKnob = new THREE.Mesh(lidKnobGeometry, material);
    lidKnob.position.y = 0.9;
    group.add(lidKnob);

    this.mesh = group;
    this.scene.add(this.mesh);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate the teapot
    if (this.mesh) {
      this.mesh.rotation.y += 0.005;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      // Remove the canvas element from the DOM
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    
    // Clean up geometry and materials
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
  }
}

// Export for use in renderer.js
window.Graphics3D = Graphics3D;
