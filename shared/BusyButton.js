import { Pressable, ActivityIndicator } from 'react-native';
import useAsyncAction from './useAsyncAction';

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
