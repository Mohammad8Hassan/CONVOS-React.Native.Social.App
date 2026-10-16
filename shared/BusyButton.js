import { Pressable, ActivityIndicator } from 'react-native';
import useAsyncAction from './useAsyncAction';

// A Pressable for actions that take time: while onPress's promise is pending it ignores further
// presses and shows a spinner instead of its children. `busy` forces the same state from outside
// (for flows whose loading flag lives in the parent). `style` can be a function like Pressable's.
export default function BusyButton({ onPress, busy: busyProp = false, style, spinnerColor = 'white', children, ...rest }) {
  const [run, busyInternal] = useAsyncAction(async (e) => { if(onPress) await onPress(e); });
  const busy = busyInternal || busyProp;

  return (
    <Pressable
      {...rest}
      onPress={busy ? undefined : run}
      disabled={busy || rest.disabled}
      style={(state) => [typeof style === 'function' ? style(state) : style, busy ? { opacity: 0.8 } : null]}
    >
      {busy ? <ActivityIndicator color={spinnerColor} /> : children}
    </Pressable>
  );
}
