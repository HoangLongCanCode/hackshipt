export { Avocado, type AvocadoProps } from './Avocado';
export { AvocadoCar, type AvocadoCarProps } from './AvocadoCar';
export { AvocadoLoader, type AvocadoLoaderProps } from './AvocadoLoader';
export { AvocadoSplash, type AvocadoSplashProps } from './AvocadoSplash';
export { ShiptBag, SHIPT_GREEN, type ShiptBagProps } from './ShiptBag';
export { AnimationToggle } from './AnimationToggle';
export { useAnimationPref, setAnimationPref } from './useAnimationPref';
// startDrive is intentionally NOT re-exported here: it pulls in react-dom/client and is only for map code.
// import { startDrive } from '@/components/mascot/driveCar';
