import React, { useState, useEffect } from 'react';
import { View, Image, ImageProps, Dimensions } from 'react-native';

interface ImageType extends ImageProps {
    width?: number
    height?: number
    handleError?: (error: Error) => void
}

const DynamicDimensionsImage = ({ source, width, style, handleError, ...props }: ImageType) => {

    const [dim, setDim] = useState(null) as any
    let isMounted = true
    const calculateDimensions = (imageWidth: number, imageHeight: number) => {
        let scale = Number(width)/imageWidth;
        const height = scale * imageHeight;
        return setDim( { width: width, height :height})
    }

    useEffect(() => {
        // handle http source image
        if ((source as any).uri) {
            Image.getSize((source as any).uri, (newWidth, newHeight) => {
                //  stop calculation when component unmouted
                if (!isMounted) {
                    return
                }

                calculateDimensions(newWidth, newHeight)
            }, (error) => {
                // handling error
                if (handleError) {
                    handleError(error)
                }
            })
        } else if (source) {
            // handle require local image
            const { width: newWidth, height: newHeight } = Image.resolveAssetSource(
                source,
            )
            //  stop calculation when component unmouted
            if (!isMounted) {
                return
            }
            calculateDimensions(newWidth, newHeight)
        }
        return () => {
            isMounted = false
        }
    }, [])

    if (dim) {
        return <Image source={source} style={{ ...(style as object), height: dim.height, width: dim.width }} onError={(e) => {
            // handling error
            if (handleError) {
                handleError(e.nativeEvent.error)
            }
        }} {...props} />
    }
    return <></>
}
export default DynamicDimensionsImage;