import type { CSSProperties, JSXNode, JSXOutput, PropsOf, QRL } from '@builder.io/qwik';

export type ToastTypes = 'normal' | 'action' | 'success' | 'info' | 'warning' | 'error' | 'loading' | 'default';

export type PromiseT<Data = any> = QRL<() => Promise<Data>>;

export type PromiseData<ToastData = any> = ExternalToast & {
  loading?: string | JSXNode | JSXOutput;
  success?: string | JSXNode | QRL<(data: ToastData) => JSXNode | string | JSXOutput> | JSXOutput;
  error?: string | JSXNode | ((error: any) => JSXNode | string | JSXOutput) | JSXOutput;
  finally?: () => void | Promise<void>;
};

export interface ToastClassnames {
  toast?: string;
  title?: string;
  description?: string;
  loader?: string;
  closeButton?: string;
  cancelButton?: string;
  actionButton?: string;
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
  default?: string;
}

export interface ToastT {
  id: number | string;
  title?: string | JSXNode | JSXOutput;
  type?: ToastTypes;
  icon?: JSXNode | JSXOutput;
  jsx?: JSXNode | JSXOutput;
  invert?: boolean;
  dismissible?: boolean;
  description?: string | JSXNode | JSXOutput;
  duration?: number;
  delete?: boolean;
  important?: boolean;
  action?: {
    label: string;
    onClick: QRL<(event: PointerEvent, element: HTMLButtonElement) => void>;
  };
  cancel?: {
    label: string;
    onClick?: QRL<() => void>;
  };
  onDismiss?: QRL<(toast: ToastT) => void>;
  onAutoClose?: QRL<(toast: ToastT) => void>;
  promise?: PromiseT;
  cancelButtonStyle?: string | CSSProperties;
  actionButtonStyle?: string | CSSProperties;
  style?: CSSProperties;
  unstyled?: boolean;
  className?: string;
  classNames?: ToastClassnames;
  descriptionClassName?: string;
  position?: Position;
}

export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
export interface HeightT {
  height: number;
  toastId: number | string;
}

interface ToastOptions {
  className?: string;
  descriptionClassName?: string;
  style?: CSSProperties;
  cancelButtonStyle?: string | CSSProperties;
  actionButtonStyle?: string | CSSProperties;
  duration?: number;
  unstyled?: boolean;
  classNames?: ToastClassnames;
  progressBar?: boolean;
  progressBarColor?: string;
}

export interface ToasterProps extends PropsOf<'ol'> {
  invert?: boolean;
  theme?: Theme;
  position?: Position;
  hotkey?: string[];
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  closeButton?: boolean;
  toastOptions?: ToastOptions;
  style?: CSSProperties;
  offset?: string | number;
  dir?: 'rtl' | 'ltr' | 'auto';
  loadingIcon?: JSXNode;
  containerAriaLabel?: string;
}

export interface ToasterStore {
  toasts: ToastT[];
  expanded: boolean;
  heights: HeightT[];
  interacting: boolean;
  theme: Theme;
}

export interface ToastProps {
  toast: ToastT;
  index: number;
  invert: boolean;
  state: ToasterStore;
  removeToast: QRL<(toast: ToastT) => ToastT[]>;
  gap: number;
  position: Position;
  visibleToasts: number;
  expandByDefault: boolean;
  closeButton: boolean;
  style?: CSSProperties;
  cancelButtonStyle?: string | CSSProperties;
  actionButtonStyle?: string | CSSProperties;
  duration: number;
  className?: string;
  unstyled?: boolean;
  descriptionClassName?: string;
  loadingIcon?: JSXNode;
  classNames?: ToastClassnames;
  closeButtonAriaLabel?: string;
  progressBar?: boolean;
  progressBarColor?: string;
}

export enum SwipeStateTypes {
  SwipedOut = 'SwipedOut',
  SwipedBack = 'SwipedBack',
  NotSwiped = 'NotSwiped',
}

export type Theme = 'light' | 'dark' | 'system';

export interface ToastToDismiss {
  id: number | string;
  dismiss: boolean;
}

export type ExternalToast = Omit<ToastT, 'id' | 'type' | 'jsx' | 'delete' | 'promise'> & {
  id?: number | string;
};
