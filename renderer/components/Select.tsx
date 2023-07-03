import { For, Show, createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js';
import { useFloating } from 'solid-floating-ui';

import { cx } from '../utils/classNames';

import type { JSX } from 'solid-js/jsx-runtime';
import { Transition } from 'solid-transition-group';
import { Placement, autoUpdate, offset } from '@floating-ui/dom';

export interface SelectProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  placeholder?: string;
  placement?: Placement;

  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  format?: (value: string) => string;

  popupClass?: string;
  popupStyle?: string;

  renderItem?: (props: JSX.HTMLAttributes<HTMLLIElement>, option: string) => JSX.Element;
}
const Selector = (props: SelectProps) => {
  const [local, popup, leftProps] = splitProps(
    props,
    ['format', 'options', 'value', 'onChange', 'renderItem', 'placement'],
    ['popupClass', 'popupStyle']
  );

  const [keyword, setKeyword] = createSignal<string | null>(null);
  const [open, setOpen] = createSignal(false);
  const [anchor, setAnchor] = createSignal<HTMLInputElement>();
  const [popper, setPopper] = createSignal<HTMLUListElement>();
  const [options, setOptions] = createSignal(local.options);

  /* defines */
  const position = useFloating(anchor, popper, {
    placement: local.placement ?? 'bottom-start',
    strategy: 'absolute',
    middleware: [
      offset({ mainAxis: 8, crossAxis: 0 }),
    ],
  });

  /* lifetimes */
  const listener = (event: MouseEvent) => {
    if (event.target instanceof Node && !popper()?.contains(event.target) && !anchor()?.contains(event.target)) {
      setOpen(false);
    }
  };
  onMount(() => {
    window.addEventListener('click', listener);
  });

  createEffect(() => {
    setOptions(local.options.filter((option) => (local.format?.(option) ?? option).includes(keyword() ?? '')));
    position.update();
  });

  createEffect(() => {
    const anchorDom = anchor();
    const popperDom = popper();
    
    anchorDom.addEventListener('transitionstart', () => {
      position.update();
    }, { once: true });
    popperDom.addEventListener('transitionstart', () => {
      position.update();
    }, { once: true });
  })

  onCleanup(() => {
    window.removeEventListener('click', listener);
  });

  /* callbacks */
  const onSelect = (option: string) => {
    setKeyword(null);
    setOpen(false);
    local.onChange?.(option);
  };

  return (
    <>
      <input
        {...leftProps}
        ref={setAnchor}
        class={cx('input', leftProps.class)}
        value={keyword() ?? local.format?.(local.value) ?? local.value}
        onInput={(event) => setKeyword(event.target.value)}
        onFocusIn={() => setOpen(true)}
      />
      <div
        ref={setPopper}
        style={{
          position: position.strategy,
          top: `${position.y ?? 0}px`,
          left: `${position.x ?? 0}px`,
        }}
        class={'z-50'}
      >
        <Transition name={'selector'}>
          <Show when={open()}>
            <ul
              style={`width: ${anchor()?.clientWidth}px; ${popup.popupStyle};`}
              class={cx(`
                w-full max-h-[50vh]
                flex flex-col justify-start items-start p-1 rounded-lg shadow-[0_0_0_1px_var(--tw-shadow-color),0_4px_8px_var(--tw-shadow-color)] shadow-black/25
                bg-neutral-800/90 fluent-scrollbar backdrop-blur-xl
              `, popup.popupClass)}
            >
              <For each={options()}>
                {(option) => local.renderItem?.({ onClick: () => onSelect(option) }, option) ?? (
                  <li class={'flex text-white hover:bg-white/10 rounded-lg'} onClick={() => onSelect(option)}>
                    {local.format?.(option) ?? option}
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Transition>
      </div>
    </>
  );
};

export default Selector;
