import React, { useState, useRef } from 'react';
import { colors, type } from '../../ui/theme';
import {
    FlatList,
    View,
    StyleSheet,
    FlatListProps,
    StyleProp,
    ViewStyle,
    Text,
    Animated,
} from 'react-native';

export interface QFlatlistProps<ItemT = any> extends Omit<FlatListProps<ItemT>, 'data' | 'renderItem'> {
    initData?: ItemT[] | null;
    renderFunc: (info: { item: ItemT; index: number }) => React.ReactElement | null;
    EmptyListHolder?: React.ComponentType<any> | React.ReactElement | null;
    hasMore?: boolean;
}

function QFlatlist<ItemT = any>({
    initData,
    renderFunc,
    EmptyListHolder,
    ListEmptyComponent,
    style,
    hasMore,
    ...restProps
}: QFlatlistProps<ItemT>) {
    const emptyComponent = EmptyListHolder || ListEmptyComponent;
    const [showToast, setShowToast] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const onEndReachedCalledDuringMomentum = useRef(true);

    const triggerToast = () => {
        if (showToast) return;
        setShowToast(true);
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowToast(false);
        });
    };

    const handleEndReached = (info: { distanceFromEnd: number }) => {
        if (!onEndReachedCalledDuringMomentum.current) {
            if (hasMore === false) {
                triggerToast();
            } else if (restProps.onEndReached) {
                restProps.onEndReached(info);
            }
            onEndReachedCalledDuringMomentum.current = true;
        }
    };

    // 1. Data fetching is not completed / initial state (null or undefined)
    // Show entire container area with a WHITE COLOR BACKGROUND.
    if (initData === null || initData === undefined) {
        return <View style={[styles.container, style]} />;
    }

    // 2. Only show EmptyListHolder when initData is empty array []
    const showEmptyComponent = initData.length === 0 ? emptyComponent : null;

    return (
        <View style={[styles.container, style]}>
            <FlatList
                data={initData}
                renderItem={({ item, index }) => renderFunc({ item, index })}
                ListEmptyComponent={showEmptyComponent}
                keyExtractor={restProps.keyExtractor || ((item: any, index: number) => (item?.id != null ? String(item.id) : `q-idx-${index}`))}
                onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false; }}
                onEndReached={handleEndReached}
                {...restProps}
            />
            {showToast && (
                <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.toastText}>더 이상 가져올 항목이 없습니다.</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // WHITE COLOR BACKGROUND
    },
    toastContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: 'orange',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    toastText: {
        color: colors.onAccent,
        ...type.bodyStrong,
    },
});

export default QFlatlist;
