import { HMSRoomProvider } from '@100mslive/react-sdk';
import { useCallContext } from '../CallProvider';
import { IncomingCallModal } from './IncomingCallModal';
import { ActiveCallScreen } from './ActiveCallScreen';

/**
 * 懒加载的通话覆盖层组件。
 * 仅在通话状态非 idle 时才渲染 HMSRoomProvider + 通话 UI，
 * 避免首屏加载 100ms SDK（~188KB）。
 */
function LazyCallOverlay() {
  const { callState } = useCallContext();

  // idle 状态下只渲染来电监听（IncomingCallModal 不依赖 HMS）
  if (callState === 'idle') {
    return <IncomingCallModal />;
  }

  // 通话活跃时加载完整 HMS SDK
  return (
    <HMSRoomProvider>
      <IncomingCallModal />
      <ActiveCallScreen />
    </HMSRoomProvider>
  );
}

export default LazyCallOverlay;
