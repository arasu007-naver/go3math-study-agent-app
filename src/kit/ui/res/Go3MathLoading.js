import React, {useEffect, useRef} from 'react';
// import {Animated} from 'react-native';
import Svg, { Path} from 'react-native-svg';

// const AnimatedPath = Animated.createAnimatedComponent(Path);
function SvgComponent(props) {
  // const color = useRef(new Animated.Value(0)).current;
  // useEffect(() => {
  //   console.log('Go3MathLogoLoader useEffect')
  //   const interval = setInterval(()=>{
  //       Animated.timing(color, {
  //         duration: 1800,
  //         toValue: 1,
  //         useNativeDriver: true,
  //       }).start();
  // }, 2400);
  // return () => clearInterval(interval);
  // }, []);

  return (
    <Svg width={280} height={86} viewBox="0 0 454 86" fill="orange" {...props} backgroundColor={'transparent'}>
      <Path
        d="M 249.375 21.75 L 249.375 84.5 L 239.125 84.5 L 239.125 21.75 L 219.25 21.75 L 219.25 84.5 L 209.75 84.5 L 209.75 12.875 L 278.875 12.875 L 278.875 84.5 L 268.875 84.5 L 268.875 21.75 L 249.375 21.75 Z M 17.875 46 L 17.875 37.125 L 39.625 37.125 L 39.625 84.5 L 0 84.5 L 0 12.875 L 39.625 12.875 L 39.625 22.25 L 10 22.25 L 10 75.5 L 30.125 75.5 L 30.125 46 L 17.875 46 Z M 444 84.5 L 454 84.5 L 454 28.125 L 423.875 28.125 L 423.875 0 L 414.375 0 L 414.375 84.5 L 423.875 84.5 L 423.875 37.125 L 444 37.125 L 444 84.5 Z M 132.375 60 L 151.75 60 L 151.75 75.125 L 131.625 75.125 L 131.625 67.875 L 122.125 67.875 L 122.125 84.5 L 161.875 84.5 L 161.875 52.5 L 147.375 52.5 L 161.625 38 L 161.625 28.25 L 122.125 28.125 L 122.125 37.5 L 146.75 37.5 L 132.375 52.5 L 132.375 60 Z M 299.5 51.25 L 328.875 51.25 L 328.875 37.125 L 299.25 37.125 L 299.25 28.125 L 338.875 28.125 L 338.875 84.5 L 299.5 84.5 L 299.5 51.25 Z M 393.875 75.5 L 393.875 84.5 L 370.875 84.5 L 370.875 37.125 L 359.375 37.125 L 359.375 28.125 L 370.875 28.125 L 370.875 11.5 L 380.375 11.5 L 380.375 28.125 L 393.875 28.125 L 393.875 37.125 L 380.375 37.125 L 380.375 75.5 L 393.875 75.5 Z M 99.75 84.5 L 60.125 84.5 L 60.125 28.125 L 99.75 28.125 L 99.75 84.5 Z M 90.375 75.5 L 90.375 37.375 L 70.125 37.5 L 70.125 75.5 L 90.375 75.5 Z M 328.875 75.25 L 328.875 60.375 L 308.75 60.375 L 308.75 75.25 L 328.875 75.25 Z"
        stroke={'orange'}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const Go3MathSvgLogo = React.memo(SvgComponent);
export default Go3MathSvgLogo;
