// @ts-nocheck
// qoolla-student-app/src/components/cards/image-adjust-card.tsx 그대로 옮김(풀이 화면의 목록·이전 풀이 카드)
import React, { useState, useEffect, isValidElement, Children } from 'react';
import { ActivityIndicator, Image, View } from "react-native";
import { colors, radius } from '../../../ui/theme';

const ImageAdjustCard = ({ imgPath, index, children, imgWidth }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageHeight, setImageHeight] = useState(60);

  useEffect(() => {
      if (!imgPath) return;
      Image.getSize(imgPath, (w, h) => {
        const renderWidth = imgWidth - 12;
        const ratio = renderWidth/w;
        setImageHeight(Number(h)*ratio);
        setTimeout(()=>{
          setIsLoading(false);
        }, 36)
      }, () => {
        setIsLoading(false);
      });
  }, [imgPath, imgWidth]);

  // 빈 Fragment(<></>)는 버튼 줄로 그리지 않는다(paper Card.Actions 시절 크래시 회피 로직, 동작 유지).
  const actionChildren = Children.toArray(children).filter((child) => {
    if (child == null || child === false) return false;
    if (!isValidElement(child)) return true;
    if (child.type === React.Fragment) {
      const nested = Children.toArray(child.props?.children).filter(Boolean);
      return nested.length > 0;
    }
    return true;
  });

  const renderActions = () => {
    if (actionChildren.length === 0) return null;
    const wrapped = actionChildren.map((child, i) => {
      if (isValidElement(child) && child.type === React.Fragment) {
        return (
          <View key={`img-card-actions-${index}-${i}`}>
            {child.props.children}
          </View>
        );
      }
      return (
        <View key={`img-card-actions-${index}-${i}`}>
          {child}
        </View>
      );
    });
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', margin: 0, padding: 0 }}>
        {wrapped}
      </View>
    );
  };

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View
        key={'img-card-' + index + '-' + imgPath}
        style={{ margin: 0, padding: 0, backgroundColor: colors.card, borderRadius: radius.md, width: '100%' }}
      >
        <View style={{ padding: 0, margin:0,  justifyContent: 'center', alignItems: 'center' }}>
            {isLoading?<ActivityIndicator size="large" color={colors.accent} />
              :<Image source={{ uri: imgPath }} style={{width: imgWidth - 12, height: imageHeight }} resizeMode="contain" />}
        </View>
        {renderActions()}
      </View>
      <View style={{ height: 9, backgroundColor: colors.accentSoftPress, width: '100%', marginTop: 8, borderRadius: radius.sm }} />
    </View>
  );
}

export default ImageAdjustCard;
