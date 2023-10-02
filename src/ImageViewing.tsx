/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {
  ComponentType,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  FC,
  forwardRef,
  useImperativeHandle, ReactNode,
  PropsWithChildren, ExoticComponent
} from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Modal,
} from "react-native";

import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";

import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
import {ImageSource} from "./@types";

type Props = {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onPress?: (image: ImageSource) => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
  headerAndFooterAnimation?: "slide" | "fade";
  ContentWrapper?: ExoticComponent<{ children?: ReactNode }>;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_HEADER_FOOTER_ANIMATION = "slide";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;

type ImageViewingRef = {
  scrollNext: () => void;
  scrollPrev: () => void;
}

const ImageViewing = forwardRef<ImageViewingRef, Props>(({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onPress = () => {},
  onLongPress = () => {},
  onImageIndexChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  backgroundColor = DEFAULT_BG_COLOR,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  FooterComponent,
  headerAndFooterAnimation = DEFAULT_HEADER_FOOTER_ANIMATION,
  ContentWrapper
}, ref) => {
  const imageList = useRef<VirtualizedList<ImageSource>>(null);
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
  const [headerTransform, footerTransform, barsOpacity, setBarsVisibility, toggleBarsVisible] =
    useAnimatedComponents();

  useImperativeHandle(ref, () => ({
    scrollNext: () => {
      if(!imageList.current) return;
      imageList.current.scrollToIndex({
        index: currentImageIndex + 1,
        animated: true,
      });
    },
    scrollPrev: () => {
      if(!imageList.current) return;
      imageList.current.scrollToIndex({
        index: currentImageIndex - 1,
        animated: true,
      });
    }
  }));

  const headerAnimation = useMemo(() => (
    headerAndFooterAnimation === "slide"
      ? {
        transform: headerTransform,
      }: {
        opacity: barsOpacity,
      }),
    [headerAndFooterAnimation])

  const footerAnimation = useMemo(() => (
      headerAndFooterAnimation === "slide"
        ? {
          transform: footerTransform,
        }: {
          opacity: barsOpacity,
        }),
    [headerAndFooterAnimation])


  useEffect(() => {
    if (onImageIndexChange) {
      onImageIndexChange(currentImageIndex);
    }
  }, [currentImageIndex]);

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      setBarsVisibility(!isScaled);
    },
    [imageList]
  );

  const onPressHandler = useCallback((src: ImageSource) => {
    onPress(src);
    toggleBarsVisible();
  }, [onPress, toggleBarsVisible]);

  const ContainerRoot = useMemo(() =>  ContentWrapper ?? React.Fragment, [ContentWrapper]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={presentationStyle === "overFullScreen"}
      visible={visible}
      presentationStyle={presentationStyle}
      animationType={animationType}
      onRequestClose={onRequestCloseEnhanced}
      supportedOrientations={["portrait"]}
      hardwareAccelerated
    >
      <StatusBarManager presentationStyle={presentationStyle}/>
      <ContainerRoot>
        <View style={[styles.container, {opacity, backgroundColor}]}>
          <Animated.View style={[styles.header, headerAnimation]}>
            {typeof HeaderComponent !== "undefined" ? (
              React.createElement(HeaderComponent, {
                imageIndex: currentImageIndex,
              })
            ) : (
              <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced}/>
            )}
          </Animated.View>
          <VirtualizedList
            ref={imageList}
            data={images}
            horizontal
            pagingEnabled
            windowSize={2}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={imageIndex}
            getItem={(_, index) => images[index]}
            getItemCount={() => images.length}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({item: imageSrc}) => (
              <ImageItem
                onZoom={onZoom}
                imageSrc={imageSrc}
                onRequestClose={onRequestCloseEnhanced}
                onPress={onPressHandler}
                onLongPress={onLongPress}
                delayLongPress={delayLongPress}
                swipeToCloseEnabled={swipeToCloseEnabled}
                doubleTapToZoomEnabled={doubleTapToZoomEnabled}
              />
            )}
            onMomentumScrollEnd={onScroll}
            //@ts-ignore
            keyExtractor={(imageSrc, index) =>
              keyExtractor
                ? keyExtractor(imageSrc, index)
                : typeof imageSrc === "number"
                  ? `${imageSrc}`
                  : imageSrc.uri
            }
          />
          {typeof FooterComponent !== "undefined" && (
            <Animated.View
              style={[styles.footer, footerAnimation]}
            >
              {React.createElement(FooterComponent, {
                imageIndex: currentImageIndex,
              })}
            </Animated.View>
          )}
        </View>
      </ContainerRoot>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    top: 0,
  },
  footer: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    bottom: 0,
  },
});

const EnhancedImageViewing = forwardRef<ImageViewingRef, Props>((props: Props, ref) => (
  <ImageViewing key={props.imageIndex} ref={ref} {...props} />
));

export default EnhancedImageViewing;
