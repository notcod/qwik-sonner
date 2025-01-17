/* eslint-disable qwik/valid-lexical-scope */
import {
  $,
  component$,
  useComputed$,
  useOnDocument,
  useSignal,
  useStore,
  useStyles$,
  useTask$,
  useOnWindow,
  sync$,
} from "@builder.io/qwik";
import {
  Theme,
  ToastT,
  ToastToDismiss,
  ToasterProps,
  ToasterStore,
} from "../utils/types";
import { Toast } from "./toast-card";
import {
  GAP,
  TOAST_LIFETIME,
  TOAST_WIDTH,
  VIEWPORT_OFFSET,
  VISIBLE_TOASTS_AMOUNT,
} from "../constants";
import styles from "./styles.css?inline";
import { toastState } from "../utils/state";

function getDocumentDirection(): ToasterProps["dir"] {
  if (typeof window === "undefined") return "ltr";
  if (typeof document === "undefined") return "ltr"; // For Fresh purpose

  const dirAttribute = document.documentElement.getAttribute("dir");

  if (dirAttribute === "auto" || !dirAttribute) {
    return window.getComputedStyle(document.documentElement)
      .direction as ToasterProps["dir"];
  }

  return dirAttribute as ToasterProps["dir"];
}

export const Toaster = component$<ToasterProps>((props) => {
  useStyles$(styles);
  const isInitializedSig = useSignal<boolean>(false);

  const {
    position = "bottom-right",
    hotkey = ["altKey", "KeyT"],
    theme = "light",
    visibleToasts = VISIBLE_TOASTS_AMOUNT,
    dir = getDocumentDirection(),
    containerAriaLabel = "Notifications",
    expand = false,
    toastOptions = {},
    closeButton = false,
    invert = false,
    gap = GAP,
    loadingIcon,
    offset = VIEWPORT_OFFSET,
    richColors = false,
    duration = TOAST_LIFETIME,
    ...restProps
  } = props;

  const listRef = useSignal<HTMLOListElement>();
  const state = useStore<ToasterStore>({
    toasts: [],
    expanded: expand,
    heights: [],
    interacting: false,
    theme,
  });

  useOnDocument(
    "sonner",
    $((ev: CustomEvent) => {
      if (isInitializedSig.value) return;
      isInitializedSig.value = true;

      state.toasts = [...state.toasts, ev.detail];

      toastState.subscribe((toast) => {
        if ((toast as ToastToDismiss).dismiss) {
          state.toasts = state.toasts.map((t) =>
            t.id === toast.id ? { ...t, delete: true } : t
          );
          return;
        }

        const indexOfExistingToast = state.toasts.findIndex(
          (t) => t.id === toast.id
        );

        // Update the toast if it already exists
        if (indexOfExistingToast !== -1) {
          state.toasts = [
            ...state.toasts.slice(0, indexOfExistingToast),
            { ...state.toasts[indexOfExistingToast], ...toast },
            ...state.toasts.slice(indexOfExistingToast + 1),
          ];
          return;
        }

        return (state.toasts = [toast, ...state.toasts]);
      });
    })
  );

  const possiblePositions = useComputed$(() => {
    return Array.from(
      new Set(
        [props.position ?? position].concat(
          state.toasts
            .filter((toast) => toast.position!)
            .map((toast) => toast.position!)
        )
      )
    );
  });

  const hotkeyLabel = hotkey
    .join("+")
    .replace(/Key/g, "")
    .replace(/Digit/g, "");

  const lastFocusedElementRef = useSignal<HTMLElement>();
  const isFocusWithinRef = useSignal<boolean>(false);

  const removeToast = $(
    (toast: ToastT) =>
      (state.toasts = state.toasts.filter(({ id }) => id !== toast.id))
  );

  useOnWindow(
    "DOMContentLoaded",
    sync$((e: Event) => {
      const documentEl = e.target as Document;
      const list = documentEl.getElementById("sonner-toaster");
      const userTheme = list?.getAttribute("data-theme") as Theme;

      // if there is a default theme that is not "system", return
      if (userTheme !== "system") return;

      // reading the qwik script to handle user theme preferences
      const themeFromLocalStorage = localStorage.getItem("theme");

      if (themeFromLocalStorage) {
        return list?.setAttribute("data-theme", themeFromLocalStorage);
      }

      const themeFromMedia =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

      list?.setAttribute("data-theme", themeFromMedia);
      localStorage.setItem("theme", themeFromMedia);
    })
  );

  useOnDocument(
    "keydown",
    $((event) => {
      // Check if all hotkeys are pressed
      const isHotkeyPressed = hotkey.every(
        (key) => (event as any)[key] || event.code === key
      );

      // If the key shortcut is pressed, expand the toaster
      if (isHotkeyPressed) {
        state.expanded = true;
        listRef.value?.focus();
      }

      // Then, if user presses escape, close the toaster
      if (
        event.code === "Escape" &&
        (document.activeElement === listRef.value ||
          listRef.value?.contains(document.activeElement))
      ) {
        state.expanded = false;
      }
    })
  );

  useTask$(({ track }) => {
    track(() => state.toasts);
    if (state.toasts.length <= 1) {
      state.expanded = false;
    }
  });

  const onBlurHandler = $((event: FocusEvent, element: HTMLOListElement) => {
    if (
      isFocusWithinRef.value &&
      !element.contains(event.relatedTarget as Node)
    ) {
      isFocusWithinRef.value = false;
      if (lastFocusedElementRef.value) {
        lastFocusedElementRef.value.focus({ preventScroll: true });
        lastFocusedElementRef.value = undefined;
      }
    }
  });

  const onFocusHandler = $((event: FocusEvent, element: HTMLOListElement) => {
    const isNotDismissible = element.dataset.dismissible === "false";

    if (isNotDismissible) return;

    if (!isFocusWithinRef.value) {
      isFocusWithinRef.value = true;
      lastFocusedElementRef.value = event.relatedTarget as HTMLElement;
    }
  });

  const onMouseleaveHandler = $(() => {
    // Avoid setting expanded to false when interacting with a toast, e.g. swiping
    if (!state.interacting) {
      state.expanded = false;
    }
  });

  const onPointerDownHandler = $(
    (_: PointerEvent, element: HTMLOListElement) => {
      const isNotDismissible = element.dataset.dismissible === "false";

      if (isNotDismissible) return;
      state.interacting = true;
    }
  );

  const makeToasterExpanded = $(() => (state.expanded = true));

  return (
    // Remove item from normal navigation flow, only available via hotkey
    <section aria-label={`${containerAriaLabel} ${hotkeyLabel}`} tabIndex={-1}>
      {possiblePositions.value.map((position, index) => {
        const [y, x] = position.split("-");
        return (
          <ol
            {...restProps}
            id="sonner-toaster"
            key={position}
            dir={dir === "auto" ? getDocumentDirection() : dir}
            tabIndex={-1}
            ref={listRef}
            class={props.class}
            data-moick-toaster
            data-theme={state.theme}
            data-rich-colors={`${richColors}`}
            data-y-position={y}
            data-x-position={x}
            style={{
              "--front-toast-height": `${state.heights[0]?.height}px`,
              "--offset": typeof offset === "number" ? `${offset}px` : offset,
              "--width": `${TOAST_WIDTH}px`,
              "--gap": `${gap}px`,
              ...props.style,
            }}
            onBlur$={[onBlurHandler, props.onBlur$]}
            onFocus$={[onFocusHandler, props.onFocus$]}
            onMouseEnter$={[makeToasterExpanded, props.onMouseEnter$]}
            onMouseMove$={[makeToasterExpanded, props.onMouseMove$]}
            onMouseLeave$={[onMouseleaveHandler, props.onMouseLeave$]}
            onPointerDown$={[onPointerDownHandler, props.onPointerDown$]}
            onPointerUp$={[
              $(() => (state.interacting = false)),
              props.onPointerUp$,
            ]}
          >
            {state.toasts
              .filter(
                (toast) =>
                  (!toast.position && index === 0) ||
                  toast.position === position
              )
              .map((toast, index) => (
                <Toast
                  key={toast.id}
                  index={index}
                  toast={toast}
                  duration={toastOptions?.duration ?? duration}
                  progressBar={toastOptions?.progressBar}
                  progressBarColor={toastOptions?.progressBarColor}
                  // eslint-disable-next-line qwik/no-react-props
                  className={toastOptions?.className}
                  descriptionClassName={toastOptions?.descriptionClassName}
                  invert={invert}
                  visibleToasts={visibleToasts}
                  closeButton={closeButton}
                  position={position}
                  style={toastOptions?.style}
                  unstyled={toastOptions?.unstyled}
                  classNames={toastOptions?.classNames}
                  cancelButtonStyle={toastOptions?.cancelButtonStyle}
                  actionButtonStyle={toastOptions?.actionButtonStyle}
                  removeToast={removeToast}
                  expandByDefault={expand}
                  gap={gap}
                  loadingIcon={loadingIcon}
                  state={state}
                />
              ))}
          </ol>
        );
      })}
    </section>
  );
});
