/** Long enough to cover a double-click after the modal has closed. */
export const MODAL_CLOSE_CLICK_CAPTURE_MS = 500;

/** Ignore the click that lands on the page after a modal closes under the pointer. */
export function bindModalCloseClickSink(target: EventTarget, onCaught: () => void): () => void {
  let armed = true;
  const stopNextClick = (event: Event) => {
    if (!armed) return;
    armed = false;
    event.preventDefault();
    event.stopPropagation();
    target.removeEventListener('click', stopNextClick, true);
    onCaught();
  };
  target.addEventListener('click', stopNextClick, true);
  return () => {
    armed = false;
    target.removeEventListener('click', stopNextClick, true);
  };
}
