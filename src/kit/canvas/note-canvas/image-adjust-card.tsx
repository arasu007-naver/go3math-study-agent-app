// @ts-nocheck
/* eslint-disable */
// qoolla-student-app/src/components/cards/image-adjust-card.tsx 그대로 옮김(풀이 화면의 목록·이전 풀이 카드)
import React, { useState, useEffect, isValidElement, Children } from 'react';
import { Image, View } from "react-native";
import { Card, ActivityIndicator } from 'react-native-paper';

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

  // react-native-paper Card.Actions clones children and injects `index`.
  // React.Fragment only accepts `key`/`children`, so empty <>...</> (or any
  // Fragment) as a direct Card.Actions child throws on iPad/diary.
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
      <Card.Actions style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>
        {wrapped}
      </Card.Actions>
    );
  };

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Card
        key={'img-card-' + index + '-' + imgPath}
        elevation={0}
        style={{ margin: 0, padding: 0, backgroundColor: 'white', width: '100%' }}
      >
        <Card.Content style={{ padding: 0, margin:0,  justifyContent: 'center', alignItems: 'center' }}>
            {isLoading?<ActivityIndicator size="large" color="orange" />
              :<Image source={{ uri: imgPath }} style={{width: imgWidth - 12, height: imageHeight }} resizeMode="contain" />}
        </Card.Content>
        {renderActions()}
      </Card>
      <View style={{ height: 9, backgroundColor: 'rgba(255, 136, 0, 0.5)', width: '100%', marginTop: 8, borderRadius: 4.5 }} />
    </View>
  );
}

export default ImageAdjustCard;
