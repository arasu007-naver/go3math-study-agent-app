import React, {useRef} from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring
} from 'react-native-reanimated';
import Go3MathSvgLogo from '../res/Go3MathLoading';

const { height,width } = Dimensions.get('window');
export default function Go3MathTabletLoader() {
  
  const animatedStyles = useAnimatedStyle(() => {
    return {
        transform: [
            {
                scale:
                    withSequence(
                        withTiming(1.0, { duration: 1800 }),
                        withSpring(0.3)
                    ),
            },
        ],
    };
}); 
  return (
    <View style={styles.loadingView}>
        <Animated.View style={[styles.loaderContainer, animatedStyles]}>
          <Go3MathSvgLogo />
        </Animated.View>
        </View>
  );
}
const styles = StyleSheet.create({
  loaderContainer: {
    backgroundColor: 'white',
    width: width/3,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24
  },
  loadingView: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
    backgroundColor:'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
});
