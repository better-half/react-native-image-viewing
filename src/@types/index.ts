/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ImageURISource, ImageRequireSource } from "react-native";

export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

type MandatoryDimensions =
  | {
      width: number;
      height: number;
    }
  | {
      width?: never;
      height?: never;
    }

export type ImageViewingRef = {
  scrollNext: () => void;
  scrollPrev: () => void;
}

export type ImageSource = {
  blurhash?: string;
} & MandatoryDimensions & (ImageURISource | ImageRequireSource);
